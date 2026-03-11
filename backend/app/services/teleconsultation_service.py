import logging
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.teleconsultation import Teleconsultation
from app.schemas.teleconsultation import TeleconsultationAccept, TeleconsultationCreate
from app.services import (
    livekit_service,
    practitioner_service,
    websocket_service,
    appointment_service,
    consultation_service,
)

logger = logging.getLogger(__name__)


async def create_teleconsultation(
    current_user: User,
    data: TeleconsultationCreate,
    db: AsyncSession,
) -> Teleconsultation:
    """Create a new teleconsultation request (by practitioner or patient)."""
    room_name = f"telecons_{uuid.uuid4().hex[:12]}"

    practitioner_id: uuid.UUID | None = None
    requested_by_user_id: uuid.UUID = current_user.user_id

    requester_speciality: str | None = None

    if current_user.role == "PRACTITIONER":
        practitioner = await practitioner_service.get_by_user_id(current_user.user_id, db)
        practitioner_id = practitioner.practitioner_id
        requester_speciality = practitioner.expertise or practitioner.practitioner_type
    else:
        # Patient (USER) initiating: must specify which specialist to call
        if not data.specialist_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="specialist_id is required when requesting as a patient",
            )

    teleconsultation = Teleconsultation(
        teleconsultation_id=uuid.uuid4(),
        consultation_id=data.consultation_id,
        practitioner_id=practitioner_id,
        requested_by_user_id=requested_by_user_id,
        specialist_id=data.specialist_id,
        livekit_room_name=room_name,
        status="PENDING",
    )
    db.add(teleconsultation)
    await db.commit()
    await db.refresh(teleconsultation)

    # Create LiveKit room so requester can join immediately (e.g. from appointment Call button)
    try:
        await livekit_service.create_room(room_name)
    except Exception as e:
        logger.warning("LiveKit create_room on new teleconsultation failed (room may exist): %s", e)

    # Notify specialists via WebSocket (non-fatal: don't fail the request if notify fails)
    try:
        payload = {
            "type": "teleconsultation_request",
            "teleconsultation_id": str(teleconsultation.teleconsultation_id),
            "consultation_id": str(data.consultation_id) if data.consultation_id else None,
            "practitioner_id": str(practitioner_id) if practitioner_id else None,
            "requested_by_user_id": str(requested_by_user_id),
            "requester_name": current_user.name,
            "requester_role": current_user.role,
            "requester_speciality": requester_speciality,
            "source": data.source or "DIRECT",
        }
        if data.specialist_id:
            # If a practitioner is calling their own assigned specialist_id (e.g. specialist
            # starting a call from an appointment), avoid sending the popup back to the
            # same participant connection. In that case, broadcast to other participants only.
            if practitioner_id and data.specialist_id == practitioner_id:
                await websocket_service.manager.broadcast_to_participants(
                    payload, exclude=practitioner_id
                )
            else:
                await websocket_service.manager.send_to_participant(data.specialist_id, payload)
        else:
            await websocket_service.manager.broadcast_to_participants(payload)
    except Exception as e:
        logger.warning("Teleconsultation WebSocket notify failed (request still created): %s", e)

    return teleconsultation


async def accept_teleconsultation(
    teleconsultation_id: uuid.UUID,
    data: TeleconsultationAccept,
    db: AsyncSession,
) -> Teleconsultation:
    """Specialist accepts the teleconsultation and creates LiveKit room."""
    result = await db.execute(
        select(Teleconsultation).where(
            Teleconsultation.teleconsultation_id == teleconsultation_id
        )
    )
    teleconsultation = result.scalar_one_or_none()
    
    if not teleconsultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teleconsultation not found",
        )
    
    if teleconsultation.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teleconsultation already accepted or completed",
        )
    
    # Create LiveKit room (may already exist if created when request was made)
    try:
        await livekit_service.create_room(teleconsultation.livekit_room_name)
    except Exception as e:
        logger.warning("LiveKit create_room on accept (may already exist): %s", e)
    
    # Update teleconsultation
    teleconsultation.specialist_id = data.specialist_id
    teleconsultation.status = "ACTIVE"
    teleconsultation.started_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(teleconsultation)

    # Notify practitioner (if any) that specialist joined; patient-initiated uses polling/frontend redirect
    if teleconsultation.practitioner_id:
        await websocket_service.manager.send_to_participant(
            teleconsultation.practitioner_id,
            {
                "type": "teleconsultation_accepted",
                "teleconsultation_id": str(teleconsultation.teleconsultation_id),
                "specialist_id": str(data.specialist_id),
            },
        )

    return teleconsultation


async def end_teleconsultation(
    teleconsultation_id: uuid.UUID,
    db: AsyncSession,
) -> Teleconsultation:
    """End an active teleconsultation."""
    result = await db.execute(
        select(Teleconsultation).where(
            Teleconsultation.teleconsultation_id == teleconsultation_id
        )
    )
    teleconsultation = result.scalar_one_or_none()
    
    if not teleconsultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teleconsultation not found",
        )
    
    if teleconsultation.status not in ("ACTIVE", "PENDING"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Teleconsultation is not active",
        )
    
    # Calculate duration
    if teleconsultation.started_at:
        duration = (datetime.now(timezone.utc) - teleconsultation.started_at).total_seconds()
        teleconsultation.duration_seconds = int(duration)
    
    teleconsultation.status = "COMPLETED"
    teleconsultation.ended_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(teleconsultation)
    
    # Delete LiveKit room
    try:
        await livekit_service.delete_room(teleconsultation.livekit_room_name)
    except Exception:
        pass  # Room might already be deleted
    
    return teleconsultation


async def get_teleconsultation(
    teleconsultation_id: uuid.UUID,
    db: AsyncSession,
) -> Teleconsultation:
    """Get a teleconsultation by ID."""
    result = await db.execute(
        select(Teleconsultation).where(
            Teleconsultation.teleconsultation_id == teleconsultation_id
        )
    )
    teleconsultation = result.scalar_one_or_none()
    
    if not teleconsultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teleconsultation not found",
        )
    
    return teleconsultation


async def list_by_consultation(
    consultation_id: uuid.UUID,
    db: AsyncSession,
) -> list[Teleconsultation]:
    """List all teleconsultations for a consultation (any status)."""
    result = await db.execute(
        select(Teleconsultation)
        .where(Teleconsultation.consultation_id == consultation_id)
        .order_by(Teleconsultation.created_at.desc())
    )
    return list(result.scalars().all())


async def list_pending_for_specialist(
    specialist_id: uuid.UUID,
    db: AsyncSession,
    *,
    max_age_minutes: int = 15,
) -> list[Teleconsultation]:
    """List pending teleconsultation requests for a specialist (incoming calls).
    Only returns requests created within the last max_age_minutes (default 15).
    """
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=max_age_minutes)
    result = await db.execute(
        select(Teleconsultation).where(
            Teleconsultation.specialist_id == specialist_id,
            Teleconsultation.status == "PENDING",
            Teleconsultation.created_at >= cutoff,
        ).order_by(Teleconsultation.created_at.desc())
    )
    return list(result.scalars().all())


async def list_active_for_specialist(
    specialist_id: uuid.UUID,
    db: AsyncSession,
) -> list[Teleconsultation]:
    """List active teleconsultations for a specialist."""
    result = await db.execute(
        select(Teleconsultation).where(
            Teleconsultation.specialist_id == specialist_id,
            Teleconsultation.status == "ACTIVE",
        )
    )
    return list(result.scalars().all())


async def get_or_create_teleconsultation_for_appointment(
    request_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> Teleconsultation:
    """Get existing or create new teleconsultation for an appointment. Used when user clicks Call from appointment."""
    appointment = await appointment_service.get_appointment_request(request_id, db)
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )
    if not appointment.consultation_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment is not linked to a consultation",
        )

    # Access: requester, specialist for this appointment, or user with access to the consultation
    is_requester = appointment.requested_by_user_id == current_user.user_id
    if current_user.role == "PRACTITIONER":
        practitioner = await practitioner_service.get_by_user_id(current_user.user_id, db)
        is_specialist = practitioner and appointment.specialist_id == practitioner.practitioner_id
    else:
        is_specialist = False
    if not is_requester and not is_specialist:
        await consultation_service.get_consultation(
            appointment.consultation_id, db, current_user=current_user
        )

    # Find existing ACTIVE or PENDING teleconsultation for this consultation (and specialist if set)
    q = select(Teleconsultation).where(
        Teleconsultation.consultation_id == appointment.consultation_id,
        Teleconsultation.status.in_(["PENDING", "ACTIVE"]),
    )
    if appointment.specialist_id:
        q = q.where(Teleconsultation.specialist_id == appointment.specialist_id)
    q = q.order_by(Teleconsultation.created_at.desc()).limit(1)
    result = await db.execute(q)
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    # Patients must have an assigned specialist to start a call from an appointment
    if current_user.role == "USER" and not appointment.specialist_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This appointment has no assigned specialist; use the Call page to choose a practitioner.",
        )

    # Create new teleconsultation (room is created inside create_teleconsultation)
    data = TeleconsultationCreate(
        consultation_id=appointment.consultation_id,
        specialist_id=appointment.specialist_id,
        source="APPOINTMENT",
    )
    return await create_teleconsultation(current_user, data, db)
