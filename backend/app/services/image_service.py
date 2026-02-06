from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.image import Image
from app.services import cloudinary_service, consultation_service, ml_service, notification_service


async def quick_scan(
    file: UploadFile,
    db: AsyncSession,
    user_id: UUID | None = None,
    consent_to_reuse: bool = False,
) -> dict:
    upload_result = await cloudinary_service.upload_image(file)

    condition = ml_service.predict(upload_result["url"])
    confidence = ml_service.get_confidence(upload_result["url"])
    urgency = ml_service.classify_urgency(condition, confidence)

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
    }


async def upload_to_consultation(
    file: UploadFile,
    consultation_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> Image:
    # Verify consultation exists
    await consultation_service.get_consultation(consultation_id, db)

    upload_result = await cloudinary_service.upload_image(file)

    condition = ml_service.predict(upload_result["url"])
    confidence = ml_service.get_confidence(upload_result["url"])

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

    # Re-aggregate consultation ML results
    consultation = await consultation_service.update_ml_results(consultation_id, db)

    if consultation.urgency == "URGENT":
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

    if consultation.urgency == "URGENT":
        await notification_service.notify_urgent_case(consultation, db)

    return image


async def get_image(image_id: UUID, db: AsyncSession) -> Image:
    result = await db.execute(select(Image).where(Image.image_id == image_id))
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Image not found"
        )
    return image


async def list_for_consultation(
    consultation_id: UUID, db: AsyncSession
) -> list[Image]:
    result = await db.execute(
        select(Image)
        .where(Image.consultation_id == consultation_id)
        .order_by(Image.uploaded_at.desc())
    )
    return list(result.scalars().all())


async def list_for_user(user_id: UUID, db: AsyncSession) -> list[Image]:
    """List quick-scan images for a user."""
    result = await db.execute(
        select(Image)
        .where(Image.uploaded_by == user_id, Image.source == "QUICK_SCAN")
        .order_by(Image.uploaded_at.desc())
    )
    return list(result.scalars().all())


async def delete_image(image_id: UUID, db: AsyncSession) -> None:
    image = await get_image(image_id, db)
    consultation_id = image.consultation_id

    cloudinary_service.delete_image(image.storage_key)

    await db.delete(image)
    await db.commit()

    # Re-aggregate if image was part of a consultation
    if consultation_id:
        await consultation_service.update_ml_results(consultation_id, db)
