from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.appointment_request import AppointmentRequest
from app.models.teleconsultation import Teleconsultation
from app.schemas.consultation import (
    ConsultationCreate,
    ConsultationImagesConsentUpdate,
    ConsultationRead,
    ConsultationUpdate,
)
from app.schemas.teleconsultation import TeleconsultationRead
from app.services import consultation_service, image_service, consent_service, teleconsultation_service

router = APIRouter(prefix="/api/consultations", tags=["consultations"])


class ConsentPinVerify(BaseModel):
    pin: str


@router.post("/", response_model=ConsultationRead, status_code=201)
async def create_consultation(
    data: ConsultationCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await consultation_service.create_consultation(
        data, current_user.user_id, db
    )


@router.get("/", response_model=list[ConsultationRead])
async def list_consultations(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    consultations = await consultation_service.list_consultations(
        db, current_user=current_user
    )
    # Consultation IDs that have at least one appointment request
    result = await db.execute(
        select(AppointmentRequest.consultation_id).where(
            AppointmentRequest.consultation_id.isnot(None)
        ).distinct()
    )
    ids_with_appointments = {row[0] for row in result.all()}
    tc_result = await db.execute(
        select(Teleconsultation.consultation_id).where(
            Teleconsultation.consultation_id.isnot(None)
        ).distinct()
    )
    ids_with_teleconsultation = {row[0] for row in tc_result.all()}
    return [
        ConsultationRead(
            **{
                **ConsultationRead.model_validate(c).model_dump(),
                "has_appointments": c.consultation_id in ids_with_appointments,
                "has_teleconsultation": c.consultation_id in ids_with_teleconsultation,
            }
        )
        for c in consultations
    ]


@router.get("/{consultation_id}", response_model=ConsultationRead)
async def get_consultation(
    consultation_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    consultation = await consultation_service.get_consultation(
        consultation_id, db, current_user=current_user
    )
    has_appointments = False
    has_teleconsultation = False
    try:
        apt_result = await db.execute(
            select(AppointmentRequest.request_id).where(
                AppointmentRequest.consultation_id == consultation_id
            ).limit(1)
        )
        has_appointments = apt_result.scalar_one_or_none() is not None
    except Exception:
        pass
    try:
        tc_result = await db.execute(
            select(Teleconsultation.teleconsultation_id).where(
                Teleconsultation.consultation_id == consultation_id
            ).limit(1)
        )
        has_teleconsultation = tc_result.scalar_one_or_none() is not None
    except Exception:
        pass
    return ConsultationRead(
        consultation_id=consultation.consultation_id,
        patient_id=consultation.patient_id,
        created_by=consultation.created_by,
        final_predicted_condition=consultation.final_predicted_condition,
        final_confidence=consultation.final_confidence,
        urgency=consultation.urgency,
        status=consultation.status,
        disposition=consultation.disposition,
        referral_note=consultation.referral_note,
        got_treatment=consultation.got_treatment,
        outcome_verified=consultation.outcome_verified,
        created_at=consultation.created_at,
        has_appointments=has_appointments,
        has_teleconsultation=has_teleconsultation,
    )


@router.get("/{consultation_id}/teleconsultations", response_model=list[TeleconsultationRead])
async def list_consultation_teleconsultations(
    consultation_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List teleconsultations for this consultation. Access follows consultation access."""
    await consultation_service.get_consultation(
        consultation_id, db, current_user=current_user
    )
    return await teleconsultation_service.list_by_consultation(consultation_id, db)


@router.put("/{consultation_id}", response_model=ConsultationRead)
async def update_consultation(
    consultation_id: UUID,
    data: ConsultationUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await consultation_service.update_consultation(
        consultation_id, data, db, current_user=current_user
    )


@router.patch("/{consultation_id}/images-consent")
async def set_consultation_images_consent(
    consultation_id: UUID,
    data: ConsultationImagesConsentUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Set consent_to_reuse for all images in this consultation. Only the patient (consultation creator) can change it."""
    consultation = await consultation_service.get_consultation(
        consultation_id, db, current_user=current_user
    )
    if consultation.created_by != current_user.user_id:
        raise HTTPException(
            status_code=403,
            detail="Only the patient can update consent for this consultation.",
        )
    count = await image_service.set_consultation_images_consent(
        consultation_id, data.consent_to_reuse, db
    )
    return {"updated": count}


@router.post("/{consultation_id}/request-consent-pin")
async def request_consent_pin(
    consultation_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Generate and send a consent PIN to the patient's phone number."""
    # Verify consultation exists and user has access
    await consultation_service.get_consultation(
        consultation_id, db, current_user=current_user
    )
    
    try:
        result = await consent_service.request_consent_pin(consultation_id, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{consultation_id}/verify-consent-pin")
async def verify_consent_pin(
    consultation_id: UUID,
    data: ConsentPinVerify,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Verify a consent PIN and grant consent for all images in the consultation."""
    # Verify consultation exists and user has access
    await consultation_service.get_consultation(
        consultation_id, db, current_user=current_user
    )
    
    result = await consent_service.verify_consent_pin(consultation_id, data.pin, db)
    
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result


@router.post("/{consultation_id}/close", response_model=ConsultationRead)
async def close_consultation(
    consultation_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Mark consultation as closed so it no longer appears on dashboard or in notifications."""
    consultation = await consultation_service.get_consultation(
        consultation_id, db, current_user=current_user
    )
    return await consultation_service.update_consultation(
        consultation_id,
        ConsultationUpdate(status="CLOSED"),
        db,
        current_user=current_user,
    )


@router.post("/{consultation_id}/reopen", response_model=ConsultationRead)
async def reopen_consultation(
    consultation_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Reopen a closed consultation."""
    consultation = await consultation_service.get_consultation(
        consultation_id, db, current_user=current_user
    )
    return await consultation_service.update_consultation(
        consultation_id,
        ConsultationUpdate(status="OPEN"),
        db,
        current_user=current_user,
    )
