"""Service for managing appointment requests."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment_request import AppointmentRequest
from app.models.practitioner import Practitioner
from app.models.user import User
from app.models.consultation import Consultation
from app.schemas.appointment import AppointmentRequestCreate, AppointmentRequestUpdate


async def get_practitioner_names(
    practitioner_ids: list[UUID], db: AsyncSession
) -> dict[UUID, str]:
    """Return a map of practitioner_id -> user name for the given IDs."""
    if not practitioner_ids:
        return {}
    result = await db.execute(
        select(Practitioner.practitioner_id, User.name)
        .join(User, Practitioner.user_id == User.user_id)
        .where(Practitioner.practitioner_id.in_(practitioner_ids))
    )
    return {row[0]: row[1] for row in result.all()}


async def get_requester_names(
    user_ids: list[UUID], db: AsyncSession
) -> dict[UUID, str]:
    """Return a map of user_id -> name for the given IDs (e.g. who requested the appointment)."""
    if not user_ids:
        return {}
    result = await db.execute(
        select(User.user_id, User.name).where(User.user_id.in_(user_ids))
    )
    return {row[0]: row[1] for row in result.all()}


async def create_appointment_request(
    data: AppointmentRequestCreate, user_id: UUID, db: AsyncSession
) -> AppointmentRequest:
    """Create a new appointment request."""
    appointment = AppointmentRequest(
        consultation_id=data.consultation_id,
        requested_by_user_id=user_id,
        specialist_id=data.specialist_id,
        proposed_datetime=data.proposed_datetime,
        notes=data.notes,
        status="PENDING",
    )
    db.add(appointment)
    await db.commit()
    await db.refresh(appointment)
    return appointment


async def get_my_requests(user_id: UUID, db: AsyncSession) -> list[AppointmentRequest]:
    """Get all appointment requests created by the current user."""
    result = await db.execute(
        select(AppointmentRequest)
        .where(AppointmentRequest.requested_by_user_id == user_id)
        .order_by(AppointmentRequest.created_at.desc())
    )
    return list(result.scalars().all())


async def get_incoming_requests(
    practitioner_id: UUID, db: AsyncSession
) -> list[AppointmentRequest]:
    """Get incoming appointment requests for a specialist (all non-rejected)."""
    result = await db.execute(
        select(AppointmentRequest)
        .where(
            or_(
                AppointmentRequest.specialist_id == practitioner_id,
                AppointmentRequest.specialist_id.is_(None),
            ),
            AppointmentRequest.status != "REJECTED",
        )
        .order_by(AppointmentRequest.created_at.desc())
    )
    return list(result.scalars().all())


async def get_appointment_request(
    request_id: UUID, db: AsyncSession
) -> AppointmentRequest | None:
    """Get a specific appointment request."""
    result = await db.execute(
        select(AppointmentRequest).where(AppointmentRequest.request_id == request_id)
    )
    return result.scalar_one_or_none()


async def delete_appointment_request(
    request_id: UUID, user_id: UUID, db: AsyncSession
) -> None:
    """Delete an appointment request. Only the requester (creator) can delete."""
    result = await db.execute(
        select(AppointmentRequest).where(AppointmentRequest.request_id == request_id)
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )
    if appointment.requested_by_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the person who created the appointment can delete it",
        )
    await db.delete(appointment)
    await db.commit()


async def update_appointment_request(
    request_id: UUID, data: AppointmentRequestUpdate, db: AsyncSession
) -> AppointmentRequest:
    """Update an appointment request (approve, reject, propose time)."""
    result = await db.execute(
        select(AppointmentRequest).where(AppointmentRequest.request_id == request_id)
    )
    appointment = result.scalar_one()

    if data.status is not None:
        appointment.status = data.status
    if data.specialist_proposed_datetime is not None:
        appointment.specialist_proposed_datetime = data.specialist_proposed_datetime
    if data.rejection_reason is not None:
        appointment.rejection_reason = data.rejection_reason

    appointment.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(appointment)
    return appointment


async def get_pending_count(practitioner_id: UUID, db: AsyncSession) -> int:
    """Get count of pending/rescheduled appointment requests for a specialist."""
    result = await db.execute(
        select(AppointmentRequest)
        .where(
            or_(
                AppointmentRequest.specialist_id == practitioner_id,
                AppointmentRequest.specialist_id.is_(None),
            ),
            AppointmentRequest.status.in_(["PENDING", "RESCHEDULED"]),
        )
    )
    return len(result.scalars().all())


async def get_upcoming_appointments(user_id: UUID, db: AsyncSession) -> list[AppointmentRequest]:
    """Get upcoming approved appointments for a user."""
    result = await db.execute(
        select(AppointmentRequest)
        .where(
            AppointmentRequest.requested_by_user_id == user_id,
            AppointmentRequest.status == "APPROVED",
            AppointmentRequest.proposed_datetime > datetime.now(timezone.utc),
        )
        .order_by(AppointmentRequest.proposed_datetime.asc())
        .limit(5)
    )
    return list(result.scalars().all())


async def get_requests_by_consultation(
    consultation_id: UUID, db: AsyncSession
) -> list[AppointmentRequest]:
    """Get all appointment requests for a specific consultation."""
    result = await db.execute(
        select(AppointmentRequest)
        .where(AppointmentRequest.consultation_id == consultation_id)
        .order_by(AppointmentRequest.created_at.desc())
    )
    return list(result.scalars().all())


async def get_requests_for_user_consultations(
    user_id: UUID, db: AsyncSession
) -> list[AppointmentRequest]:
    """Get all appointment requests for consultations the user can access."""
    # First get all consultation IDs the user can access
    consultation_query = select(Consultation.consultation_id)
    # If USER role, only their own consultations
    consultation_query = consultation_query.where(Consultation.created_by == user_id)
    
    consultation_result = await db.execute(consultation_query)
    consultation_ids = [row[0] for row in consultation_result.all()]
    
    if not consultation_ids:
        return []
    
    # Get appointment requests for those consultations
    result = await db.execute(
        select(AppointmentRequest)
        .where(AppointmentRequest.consultation_id.in_(consultation_ids))
        .order_by(AppointmentRequest.created_at.desc())
    )
    return list(result.scalars().all())
