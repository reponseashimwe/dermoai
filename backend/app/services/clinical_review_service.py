from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.clinical_review import ClinicalReview
from app.models.consultation import Consultation
from app.models.image import Image
from app.models.practitioner import Practitioner
from app.schemas.clinical_review import ClinicalReviewCreate, ClinicalReviewRead


async def create_review(
    data: ClinicalReviewCreate,
    practitioner_id: UUID,
    practitioner_type: str,
    approval_status: str,
    db: AsyncSession,
) -> ClinicalReview:
    # Verify consultation exists
    result = await db.execute(
        select(Consultation).where(
            Consultation.consultation_id == data.consultation_id
        )
    )
    consultation = result.scalar_one_or_none()
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Consultation not found"
        )

    # Only approved specialists can set is_final=True
    if data.is_final:
        if practitioner_type != "SPECIALIST" or approval_status != "APPROVED":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only approved specialists can submit final reviews",
            )

    review = ClinicalReview(
        consultation_id=data.consultation_id,
        practitioner_id=practitioner_id,
        diagnosis=data.diagnosis,
        treatment_plan=data.treatment_plan,
        notes=data.notes,
        is_final=data.is_final,
    )
    db.add(review)

    if data.is_final:
        # Propagate diagnosis to all consultation images (final = specialist)
        img_result = await db.execute(
            select(Image).where(Image.consultation_id == data.consultation_id)
        )
        for img in img_result.scalars().all():
            img.reviewed_label = data.diagnosis
            img.reviewed_as_final = True

        consultation.status = "CLOSED"
    elif consultation.status == "OPEN":
        consultation.status = "IN_REVIEW"

    await db.commit()
    await db.refresh(review)
    return review


async def list_for_consultation(
    consultation_id: UUID, db: AsyncSession
) -> list[ClinicalReviewRead]:
    result = await db.execute(
        select(ClinicalReview)
        .where(ClinicalReview.consultation_id == consultation_id)
        .order_by(ClinicalReview.created_at.desc())
        .options(
            selectinload(ClinicalReview.practitioner).selectinload(Practitioner.user)
        )
    )
    reviews = list(result.scalars().all())
    return [
        ClinicalReviewRead(
            review_id=r.review_id,
            consultation_id=r.consultation_id,
            practitioner_id=r.practitioner_id,
            practitioner_name=(
                r.practitioner.user.name
                if r.practitioner and r.practitioner.user
                else None
            ),
            diagnosis=r.diagnosis,
            treatment_plan=r.treatment_plan,
            notes=r.notes,
            is_final=r.is_final,
            created_at=r.created_at,
        )
        for r in reviews
    ]


async def get_review(review_id: UUID, db: AsyncSession) -> ClinicalReview:
    result = await db.execute(
        select(ClinicalReview).where(ClinicalReview.review_id == review_id)
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Review not found"
        )
    return review
