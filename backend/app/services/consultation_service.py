from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.consultation import Consultation
from app.models.image import Image
from app.schemas.consultation import ConsultationCreate, ConsultationUpdate
from app.services import ml_service


async def create_consultation(
    data: ConsultationCreate, user_id: UUID, db: AsyncSession
) -> Consultation:
    consultation = Consultation(
        patient_id=data.patient_id,
        created_by=user_id,
    )
    db.add(consultation)
    await db.commit()
    await db.refresh(consultation)
    return consultation


async def get_consultation(consultation_id: UUID, db: AsyncSession) -> Consultation:
    result = await db.execute(
        select(Consultation)
        .options(selectinload(Consultation.images))
        .where(Consultation.consultation_id == consultation_id)
    )
    consultation = result.scalar_one_or_none()
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Consultation not found"
        )
    return consultation


async def list_consultations(db: AsyncSession) -> list[Consultation]:
    result = await db.execute(
        select(Consultation).order_by(Consultation.created_at.desc())
    )
    return list(result.scalars().all())


async def update_consultation(
    consultation_id: UUID, data: ConsultationUpdate, db: AsyncSession
) -> Consultation:
    consultation = await get_consultation(consultation_id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(consultation, field, value)
    await db.commit()
    await db.refresh(consultation)
    return consultation


async def update_ml_results(consultation_id: UUID, db: AsyncSession) -> Consultation:
    """Re-aggregate ML predictions from all images in the consultation."""
    result = await db.execute(
        select(Image).where(Image.consultation_id == consultation_id)
    )
    images = result.scalars().all()

    image_data = [
        {
            "predicted_condition": img.predicted_condition,
            "confidence": img.confidence,
        }
        for img in images
    ]

    aggregated = ml_service.aggregate_predictions(image_data)

    consultation = await get_consultation(consultation_id, db)
    consultation.final_predicted_condition = aggregated["final_predicted_condition"]
    consultation.final_confidence = aggregated["final_confidence"]
    consultation.urgency = aggregated["urgency"]

    await db.commit()
    await db.refresh(consultation)
    return consultation
