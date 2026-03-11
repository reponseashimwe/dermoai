"""Router for appointment request management."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.practitioner import Practitioner
from app.models.appointment_request import AppointmentRequest
from app.schemas.appointment import (
    AppointmentRequestCreate,
    AppointmentRequestRead,
    AppointmentRequestUpdate,
)
from app.services import (
    appointment_service,
    consultation_service,
    teleconsultation_service,
    sms_service,
)
from app.models.user import User as UserModel
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


class StartCallResponse(BaseModel):
    teleconsultation_id: UUID


class AppointmentCompleteResponse(BaseModel):
    request_id: UUID
    status: str


async def _enrich_appointment_responses(
    requests: list[AppointmentRequest], db: AsyncSession
) -> list[AppointmentRequestRead]:
    """Add specialist_name and requester_name so the viewer never sees themselves."""
    specialist_ids = list({r.specialist_id for r in requests if r.specialist_id})
    requester_ids = list({r.requested_by_user_id for r in requests})
    specialist_names = await appointment_service.get_practitioner_names(specialist_ids, db)
    requester_names = await appointment_service.get_requester_names(requester_ids, db)
    return [
        AppointmentRequestRead(
            **{
                **AppointmentRequestRead.model_validate(r).model_dump(),
                "specialist_name": specialist_names.get(r.specialist_id) if r.specialist_id else None,
                "requester_name": requester_names.get(r.requested_by_user_id),
            }
        )
        for r in requests
    ]


async def _enrich_single(
    request: AppointmentRequest, db: AsyncSession
) -> AppointmentRequestRead:
    """Enrich a single appointment for response."""
    result = await _enrich_appointment_responses([request], db)
    return result[0]


async def get_current_practitioner(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Practitioner:
    """Get current user's practitioner record."""
    if current_user.role != "PRACTITIONER":
        raise HTTPException(status_code=403, detail="Practitioner role required")
    
    result = await db.execute(
        select(Practitioner).where(Practitioner.user_id == current_user.user_id)
    )
    practitioner = result.scalar_one_or_none()
    if not practitioner:
        raise HTTPException(status_code=404, detail="Practitioner record not found")
    
    return practitioner


def _format_appointment_datetime(dt: datetime | None) -> str:
    if not dt:
        return "N/A"
    return dt.strftime("%b %d, %Y, %I:%M %p")


@router.post("/request", response_model=AppointmentRequestRead, status_code=201)
async def create_appointment_request(
    data: AppointmentRequestCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new appointment request."""
    appointment = await appointment_service.create_appointment_request(
        data, current_user.user_id, db
    )
    # Notify specialist by SMS (non-blocking)
    try:
        if appointment.specialist_id:
            spec = await db.execute(
                select(UserModel).join(Practitioner, Practitioner.user_id == UserModel.user_id).where(
                    Practitioner.practitioner_id == appointment.specialist_id
                )
            )
            specialist_user = spec.scalar_one_or_none()
            req = await db.execute(select(UserModel).where(UserModel.user_id == appointment.requested_by_user_id))
            requester = req.scalar_one_or_none()
            if specialist_user and specialist_user.phone_number and requester:
                await sms_service.send_appointment_created_to_specialist(
                    specialist_user.phone_number,
                    requester.name,
                    _format_appointment_datetime(appointment.proposed_datetime),
                    str(appointment.consultation_id)[:8],
                )
    except Exception as e:
        print(f"SMS (appointment created) failed: {e}")
    return await _enrich_single(appointment, db)


@router.get("/my-requests", response_model=list[AppointmentRequestRead])
async def get_my_requests(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get all my outgoing appointment requests."""
    requests = await appointment_service.get_my_requests(current_user.user_id, db)
    return await _enrich_appointment_responses(requests, db)


@router.get("/incoming", response_model=list[AppointmentRequestRead])
async def get_incoming_requests(
    practitioner: Annotated[Practitioner, Depends(get_current_practitioner)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get incoming appointment requests for specialists."""
    if practitioner.practitioner_type != "SPECIALIST":
        raise HTTPException(
            status_code=403, detail="Only specialists can view incoming requests"
        )
    
    requests = await appointment_service.get_incoming_requests(
        practitioner.practitioner_id, db
    )
    return await _enrich_appointment_responses(requests, db)


@router.get("/pending-count")
async def get_pending_count(
    practitioner: Annotated[Practitioner, Depends(get_current_practitioner)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get count of pending appointment requests."""
    if practitioner.practitioner_type != "SPECIALIST":
        return {"count": 0}
    
    count = await appointment_service.get_pending_count(
        practitioner.practitioner_id, db
    )
    return {"count": count}


@router.get("/upcoming", response_model=list[AppointmentRequestRead])
async def get_upcoming_appointments(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    consultation_id: UUID | None = Query(None),
):
    """Get upcoming approved appointments, optionally filtered by consultation."""
    if consultation_id:
        await consultation_service.get_consultation(
            consultation_id, db, current_user=current_user
        )
        requests = await appointment_service.get_requests_by_consultation(
            consultation_id, db
        )
    else:
        requests = await appointment_service.get_upcoming_appointments(
            current_user.user_id, db
        )
    return await _enrich_appointment_responses(requests, db)


@router.get("/for-my-consultations", response_model=list[AppointmentRequestRead])
async def get_appointments_for_my_consultations(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get all appointment requests for consultations the current user can access."""
    requests = await appointment_service.get_requests_for_user_consultations(
        current_user.user_id, db
    )
    return await _enrich_appointment_responses(requests, db)


@router.post("/{request_id}/start-call", response_model=StartCallResponse)
async def start_call_from_appointment(
    request_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get or create a teleconsultation room for this appointment; returns teleconsultation_id to open the video call."""
    teleconsultation = await teleconsultation_service.get_or_create_teleconsultation_for_appointment(
        request_id, current_user, db
    )
    # Notify both parties by SMS that the call is ready (non-blocking)
    try:
        appointment = await appointment_service.get_appointment_request(request_id, db)
        if appointment:
            user_ids = [appointment.requested_by_user_id]
            if appointment.specialist_id:
                spec = await db.execute(
                    select(UserModel).join(Practitioner, Practitioner.user_id == UserModel.user_id).where(
                        Practitioner.practitioner_id == appointment.specialist_id
                    )
                )
                specialist_user = spec.scalar_one_or_none()
                if specialist_user:
                    user_ids.append(specialist_user.user_id)
            for uid in set(user_ids):
                u = await db.execute(select(UserModel).where(UserModel.user_id == uid))
                user = u.scalar_one_or_none()
                if user and user.phone_number:
                    await sms_service.send_call_started(user.phone_number)
    except Exception as e:
        print(f"SMS (call started) failed: {e}")
    return StartCallResponse(teleconsultation_id=teleconsultation.teleconsultation_id)


@router.patch("/{request_id}/complete", response_model=AppointmentCompleteResponse)
async def complete_appointment(
    request_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Mark an appointment as completed after a successful call.

    This is intentionally light on validation: any user with access to the
    appointment's consultation can complete it.
    """
    appointment = await appointment_service.get_appointment_request(request_id, db)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    # Ensure current user can see the related consultation; this reuses
    # existing access checks in consultation_service.
    if appointment.consultation_id:
        await consultation_service.get_consultation(
            appointment.consultation_id, db, current_user=current_user
        )

    updated = await appointment_service.update_appointment_request(
        request_id, AppointmentRequestUpdate(status="COMPLETED"), db
    )
    return AppointmentCompleteResponse(
        request_id=updated.request_id,
        status=updated.status,
    )


@router.delete("/{request_id}", status_code=204)
async def delete_appointment(
    request_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete an appointment request. Only the requester can delete."""
    await appointment_service.delete_appointment_request(
        request_id, current_user.user_id, db
    )


@router.patch("/{request_id}/approve", response_model=AppointmentRequestRead)
async def approve_appointment(
    request_id: UUID,
    practitioner: Annotated[Practitioner, Depends(get_current_practitioner)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Approve an appointment request."""
    if practitioner.practitioner_type != "SPECIALIST":
        raise HTTPException(status_code=403, detail="Only specialists can approve")

    appointment = await appointment_service.get_appointment_request(request_id, db)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    updated = await appointment_service.update_appointment_request(
        request_id, AppointmentRequestUpdate(status="APPROVED"), db
    )
    # Notify requester by SMS
    try:
        req = await db.execute(select(UserModel).where(UserModel.user_id == updated.requested_by_user_id))
        requester = req.scalar_one_or_none()
        specialist_name = None
        if updated.specialist_id:
            names = await appointment_service.get_practitioner_names([updated.specialist_id], db)
            specialist_name = names.get(updated.specialist_id) or "Specialist"
        else:
            specialist_name = "Your specialist"
        if requester and requester.phone_number:
            await sms_service.send_appointment_accepted_to_requester(
                requester.phone_number,
                specialist_name,
                _format_appointment_datetime(updated.proposed_datetime),
            )
    except Exception as e:
        print(f"SMS (appointment accepted) failed: {e}")
    return await _enrich_single(updated, db)


@router.patch("/{request_id}/reject", response_model=AppointmentRequestRead)
async def reject_appointment(
    request_id: UUID,
    data: AppointmentRequestUpdate,
    practitioner: Annotated[Practitioner, Depends(get_current_practitioner)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Reject an appointment request with reason."""
    if practitioner.practitioner_type != "SPECIALIST":
        raise HTTPException(status_code=403, detail="Only specialists can reject")

    appointment = await appointment_service.get_appointment_request(request_id, db)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    updated = await appointment_service.update_appointment_request(
        request_id,
        AppointmentRequestUpdate(status="REJECTED", rejection_reason=data.rejection_reason),
        db,
    )
    # Notify requester by SMS
    try:
        req = await db.execute(select(UserModel).where(UserModel.user_id == updated.requested_by_user_id))
        requester = req.scalar_one_or_none()
        if requester and requester.phone_number:
            await sms_service.send_appointment_rejected_to_requester(
                requester.phone_number,
                _format_appointment_datetime(updated.proposed_datetime),
                updated.rejection_reason,
            )
    except Exception as e:
        print(f"SMS (appointment rejected) failed: {e}")
    return await _enrich_single(updated, db)


@router.patch("/{request_id}/propose-time", response_model=AppointmentRequestRead)
async def propose_alternative_time(
    request_id: UUID,
    data: AppointmentRequestUpdate,
    practitioner: Annotated[Practitioner, Depends(get_current_practitioner)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Propose an alternative time for the appointment."""
    if practitioner.practitioner_type != "SPECIALIST":
        raise HTTPException(status_code=403, detail="Only specialists can propose times")
    
    appointment = await appointment_service.get_appointment_request(request_id, db)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return await appointment_service.update_appointment_request(
        request_id,
        AppointmentRequestUpdate(
            status="RESCHEDULED",
            specialist_proposed_datetime=data.specialist_proposed_datetime,
        ),
        db,
    )
