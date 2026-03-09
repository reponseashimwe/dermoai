from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.appointment_request import AppointmentRequest
from app.models.consultation import Consultation
from app.models.image import Image
from app.models.practitioner import Practitioner
from app.models.teleconsultation import Teleconsultation
from app.models.user import User
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


async def get_consultation(
    consultation_id: UUID,
    db: AsyncSession,
    *,
    current_user: User | None = None,
) -> Consultation:
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
    if current_user:
        if current_user.role == "USER":
            if consultation.created_by != current_user.user_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Consultation not found"
                )
        elif current_user.role == "PRACTITIONER":
            if consultation.created_by == current_user.user_id:
                pass
            else:
                pract_result = await db.execute(
                    select(Practitioner.practitioner_id).where(Practitioner.user_id == current_user.user_id)
                )
                pract_row = pract_result.one_or_none()
                if not pract_row:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND, detail="Consultation not found"
                    )
                practitioner_id = pract_row[0]
                tc_exists = await db.execute(
                    select(Teleconsultation.teleconsultation_id).where(
                        Teleconsultation.consultation_id == consultation_id,
                        or_(
                            Teleconsultation.specialist_id == practitioner_id,
                            Teleconsultation.practitioner_id == practitioner_id,
                        ),
                    ).limit(1)
                )
                apt_exists = await db.execute(
                    select(AppointmentRequest.request_id).where(
                        AppointmentRequest.consultation_id == consultation_id,
                        AppointmentRequest.specialist_id == practitioner_id,
                    ).limit(1)
                )
                if not tc_exists.scalar_one_or_none() and not apt_exists.scalar_one_or_none():
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND, detail="Consultation not found"
                    )
    return consultation


async def list_consultations(
    db: AsyncSession,
    *,
    current_user: User,
    include_closed: bool = False,
) -> list[Consultation]:
    query = select(Consultation).order_by(Consultation.created_at.desc())
    if not include_closed:
        query = query.where(Consultation.status != "CLOSED")
    if current_user.role == "USER":
        query = query.where(Consultation.created_by == current_user.user_id)
    elif current_user.role == "PRACTITIONER":
        # Practitioner sees: created by me, or I was called in (teleconsultation specialist), or I accepted appointment
        pract_result = await db.execute(
            select(Practitioner.practitioner_id).where(Practitioner.user_id == current_user.user_id)
        )
        pract_row = pract_result.one_or_none()
        if pract_row:
            practitioner_id = pract_row[0]
            tc_ids = select(Teleconsultation.consultation_id).where(
                Teleconsultation.consultation_id.isnot(None),
                or_(
                    Teleconsultation.specialist_id == practitioner_id,
                    Teleconsultation.practitioner_id == practitioner_id,
                ),
            )
            apt_ids = select(AppointmentRequest.consultation_id).where(
                AppointmentRequest.consultation_id.isnot(None),
                AppointmentRequest.specialist_id == practitioner_id,
            )
            query = query.where(
                or_(
                    Consultation.created_by == current_user.user_id,
                    Consultation.consultation_id.in_(tc_ids.scalar_subquery()),
                    Consultation.consultation_id.in_(apt_ids.scalar_subquery()),
                )
            )
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_consultation(
    consultation_id: UUID,
    data: ConsultationUpdate,
    db: AsyncSession,
    *,
    current_user: User | None = None,
) -> Consultation:
    consultation = await get_consultation(
        consultation_id, db, current_user=current_user
    )
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

    if consultation.urgency == "REFER" and consultation.final_predicted_condition:
        try:
            from app.services import sms_service

            await sms_service.send_urgent_alert(
                consultation_id,
                consultation.final_predicted_condition,
                db,
            )
        except Exception as e:
            print(f"SMS notification failed: {e}")

    return consultation
