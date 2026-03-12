import logging
from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, UploadFile, status

logger = logging.getLogger(__name__)
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.consultation import Consultation
from app.models.image import Image
from app.services import cloudinary_service, consultation_service, ml_service, notification_service


async def quick_scan(
    file: UploadFile,
    db: AsyncSession,
    user_id: UUID | None = None,
    consent_to_reuse: bool = False,
    include_gradcam: bool = True,
) -> dict:
    """
    Quick scan with instant ML prediction and optional GradCAM explainability.

    Args:
        file: Uploaded image file.
        db: Database session.
        user_id: Optional user ID (if authenticated).
        consent_to_reuse: Whether user consents to retraining.
        include_gradcam: Whether to generate GradCAM visualization (default True).

    Returns:
        Dict with prediction, confidence, urgency, GradCAM, and metadata.
    """
    upload_result = await cloudinary_service.upload_image(file)

    # Use GradCAM-enabled prediction if requested
    if include_gradcam:
        prediction = ml_service.predict_with_gradcam(upload_result["url"])
    else:
        prediction = ml_service.predict_with_details(upload_result["url"])

    condition = prediction["predicted_condition"]
    confidence = prediction["confidence"]
    urgency = prediction["urgency"]

    image = Image(
        uploaded_by=user_id,
        image_url=upload_result["url"],
        storage_key=upload_result["storage_key"],
        file_size=upload_result["file_size"],
        predicted_condition=condition,
        confidence=confidence,
        source="QUICK_SCAN",
        allowed_review=False,
        consultation_id=None,
        consent_to_reuse=consent_to_reuse,
    )
    db.add(image)
    await db.commit()
    await db.refresh(image)

    return {
        "image_id": image.image_id,
        "image_url": image.image_url,
        "predicted_condition": condition,
        "confidence": confidence,
        "urgency": urgency,
        "consent_to_reuse": image.consent_to_reuse,
        "all_probabilities": prediction.get("all_probabilities"),
        "model_version": prediction.get("model_version"),
        "model_date": prediction.get("model_date"),
        "triage_stage": prediction.get("triage_stage"),
        "gradcam_base64": prediction.get("gradcam_base64"),
        "gradcam_metrics": prediction.get("gradcam_metrics"),
    }


async def upload_to_consultation(
    file: UploadFile,
    consultation_id: UUID,
    user_id: UUID,
    db: AsyncSession,
    include_gradcam: bool = True,
) -> Image:
    """
    Upload image to consultation with ML prediction and GradCAM explainability.

    Args:
        file: Uploaded image file.
        consultation_id: Consultation to attach image to.
        user_id: User uploading the image.
        db: Database session.
        include_gradcam: Whether to generate GradCAM visualization (default True).

    Returns:
        Image object with predictions.
    """
    # Verify consultation exists
    await consultation_service.get_consultation(consultation_id, db)

    upload_result = await cloudinary_service.upload_image(file)

    # Use GradCAM-enabled prediction if requested
    if include_gradcam:
        prediction = ml_service.predict_with_gradcam(upload_result["url"])
    else:
        prediction = ml_service.predict_with_details(upload_result["url"])

    condition = prediction["predicted_condition"]
    confidence = prediction["confidence"]

    image = Image(
        consultation_id=consultation_id,
        uploaded_by=user_id,
        image_url=upload_result["url"],
        storage_key=upload_result["storage_key"],
        file_size=upload_result["file_size"],
        predicted_condition=condition,
        confidence=confidence,
        source="CONSULTATION",
        allowed_review=True,
    )
    db.add(image)
    await db.commit()
    await db.refresh(image)

    # Store GradCAM and metadata as transient attributes for response
    # (Not persisted to DB, but available in response)
    image.all_probabilities = prediction.get("all_probabilities")
    image.model_version = prediction.get("model_version")
    image.triage_stage = prediction.get("triage_stage")
    image.gradcam_base64 = prediction.get("gradcam_base64")
    image.gradcam_metrics = prediction.get("gradcam_metrics")

    # Re-aggregate consultation ML results
    consultation = await consultation_service.update_ml_results(consultation_id, db)

    if consultation.urgency == "REFER":
        await notification_service.notify_urgent_case(consultation, db)

    return image


async def attach_to_consultation(
    image_id: UUID, consultation_id: UUID, db: AsyncSession
) -> Image:
    image = await get_image(image_id, db)

    if image.source != "QUICK_SCAN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only QUICK_SCAN images can be attached to consultations",
        )

    # Verify consultation exists
    await consultation_service.get_consultation(consultation_id, db)

    image.consultation_id = consultation_id
    image.allowed_review = True
    await db.commit()
    await db.refresh(image)

    # Re-aggregate consultation ML results
    consultation = await consultation_service.update_ml_results(consultation_id, db)

    if consultation.urgency == "REFER":
        await notification_service.notify_urgent_case(consultation, db)

    return image


async def get_image(image_id: UUID, db: AsyncSession) -> Image:
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Image).options(selectinload(Image.reviewer)).where(Image.image_id == image_id)
    )
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Image not found"
        )
    return image


async def get_image_with_gradcam(
    image_id: UUID, db: AsyncSession, include_gradcam: bool = True
) -> Image:
    """
    Get image and optionally generate GradCAM on-the-fly for review/admin viewing.

    Args:
        image_id: Image ID to retrieve.
        db: Database session.
        include_gradcam: Whether to generate GradCAM (default True).

    Returns:
        Image object with transient GradCAM attributes attached.
    """
    image = await get_image(image_id, db)

    if include_gradcam and image.predicted_condition:
        try:
            # Generate GradCAM on-the-fly (same as quick scan)
            prediction = ml_service.predict_with_gradcam(image.image_url)

            # Attach as transient attributes (not persisted)
            image.all_probabilities = prediction.get("all_probabilities")
            image.model_version = prediction.get("model_version")
            image.triage_stage = prediction.get("triage_stage")
            image.gradcam_base64 = prediction.get("gradcam_base64")
            image.gradcam_metrics = prediction.get("gradcam_metrics")
        except Exception as e:
            logger.exception(
                "GradCAM generation failed for image_id=%s url=%s: %s",
                image_id,
                image.image_url[:80] if image.image_url else None,
                e,
            )
            image.gradcam_base64 = None
            image.gradcam_metrics = None

    return image


async def list_for_consultation(
    consultation_id: UUID, db: AsyncSession
) -> list[Image]:
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Image)
        .options(selectinload(Image.reviewer))
        .where(Image.consultation_id == consultation_id)
        .order_by(Image.uploaded_at.desc())
    )
    return list(result.scalars().all())


async def update_image_consent(
    image_id: UUID, consent: bool, user_id: UUID, db: AsyncSession
) -> Image:
    """Update consent for a single image. Owner, consultation creator, or consultation patient can modify."""
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(Image).where(Image.image_id == image_id)
    )
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Image not found"
        )
    allowed = False
    if image.uploaded_by == user_id:
        allowed = True
    elif image.consultation_id:
        consultation = await db.execute(
            select(Consultation)
            .options(selectinload(Consultation.patient))
            .where(Consultation.consultation_id == image.consultation_id)
        )
        cons = consultation.scalar_one_or_none()
        if cons:
            if cons.created_by == user_id:
                allowed = True
            elif cons.patient and cons.patient.user_id == user_id:
                allowed = True  # patient consenting for their own consultation
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    image.consent_to_reuse = consent
    await db.commit()
    await db.refresh(image)
    return image


async def set_consultation_images_consent(
    consultation_id: UUID, consent_to_reuse: bool, db: AsyncSession
) -> int:
    """Set consent_to_reuse for all images in this consultation. Returns count updated."""
    result = await db.execute(
        select(Image).where(Image.consultation_id == consultation_id)
    )
    images = list(result.scalars().all())
    for img in images:
        img.consent_to_reuse = consent_to_reuse
    await db.commit()
    return len(images)


async def list_for_user(user_id: UUID, db: AsyncSession) -> list[Image]:
    """List quick-scan images for a user."""
    result = await db.execute(
        select(Image)
        .where(Image.uploaded_by == user_id, Image.source == "QUICK_SCAN")
        .order_by(Image.uploaded_at.desc())
    )
    return list(result.scalars().all())


async def list_unreviewed(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[Image], int]:
    """List images eligible for review: no reviewed_label, consented for reuse only."""
    from sqlalchemy.orm import selectinload
    criteria = (
        Image.reviewed_label.is_(None),
        Image.consent_to_reuse.is_(True),
    )
    count_result = await db.execute(select(func.count()).select_from(Image).where(*criteria))
    total = count_result.scalar() or 0
    result = await db.execute(
        select(Image)
        .options(selectinload(Image.reviewer))
        .where(*criteria)
        .order_by(Image.uploaded_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all()), total


async def list_reviewed(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[Image], int]:
    """List images that have been reviewed (have reviewed_label), consented for reuse only. Paginated."""
    from sqlalchemy.orm import selectinload
    criteria = (
        Image.reviewed_label.isnot(None),
        Image.consent_to_reuse.is_(True),
    )
    count_result = await db.execute(select(func.count()).select_from(Image).where(*criteria))
    total = count_result.scalar() or 0
    result = await db.execute(
        select(Image)
        .options(selectinload(Image.reviewer))
        .where(*criteria)
        .order_by(Image.uploaded_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all()), total


async def list_all(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    consultation_id: UUID | None = None,
    uploaded_by: UUID | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    consent_to_reuse: bool | None = None,
) -> tuple[list[Image], int]:
    """List all images (admin). Optional filters. When consent_to_reuse=True, only consented images."""
    criteria = []
    if consultation_id is not None:
        criteria.append(Image.consultation_id == consultation_id)
    if uploaded_by is not None:
        criteria.append(Image.uploaded_by == uploaded_by)
    if date_from is not None:
        criteria.append(Image.uploaded_at >= date_from)
    if date_to is not None:
        criteria.append(Image.uploaded_at <= date_to)
    if consent_to_reuse is True:
        criteria.append(Image.consent_to_reuse.is_(True))

    count_query = select(func.count()).select_from(Image)
    if criteria:
        count_query = count_query.where(*criteria)
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    list_query = select(Image).order_by(Image.uploaded_at.desc()).offset(skip).limit(limit)
    if criteria:
        list_query = list_query.where(*criteria)
    result = await db.execute(list_query)
    return list(result.scalars().all()), total


async def update_reviewed_label(
    image_id: UUID, reviewed_label: str, db: AsyncSession,
    reviewer_id: UUID | None = None,
) -> Image:
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Image).options(selectinload(Image.reviewer)).where(Image.image_id == image_id)
    )
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    if not image.allowed_review and not image.consultation_id and not image.consent_to_reuse:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image does not allow review",
        )
    image.reviewed_label = reviewed_label
    image.reviewed_by = reviewer_id
    image.reviewed_as_final = False  # Set via queue, not final clinical review
    if image.consultation_id:
        image.allowed_review = True  # Ensure consultation images are marked allowed
    await db.commit()
    await db.refresh(image)
    return image


async def delete_image(image_id: UUID, db: AsyncSession) -> None:
    image = await get_image(image_id, db)
    consultation_id = image.consultation_id

    cloudinary_service.delete_image(image.storage_key)

    await db.delete(image)
    await db.commit()

    # Re-aggregate if image was part of a consultation
    if consultation_id:
        await consultation_service.update_ml_results(consultation_id, db)
