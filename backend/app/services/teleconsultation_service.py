import logging
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.teleconsultation import Teleconsultation
from app.schemas.teleconsultation import TeleconsultationAccept, TeleconsultationCreate
from app.services import livekit_service, practitioner_service, websocket_service

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

    if current_user.role == "PRACTITIONER":
        practitioner = await practitioner_service.get_by_user_id(current_user.user_id, db)
        practitioner_id = practitioner.practitioner_id
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

    # Notify specialists via WebSocket (non-fatal: don't fail the request if notify fails)
    try:
        payload = {
            "type": "teleconsultation_request",
            "teleconsultation_id": str(teleconsultation.teleconsultation_id),
            "consultation_id": str(data.consultation_id) if data.consultation_id else None,
            "practitioner_id": str(practitioner_id) if practitioner_id else None,
            "requested_by_user_id": str(requested_by_user_id),
        }
        if data.specialist_id:
            await websocket_service.manager.send_to_specialist(data.specialist_id, payload)
        else:
            await websocket_service.manager.broadcast_to_specialists(payload)
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
    
    # Create LiveKit room
    await livekit_service.create_room(teleconsultation.livekit_room_name)
    
    # Update teleconsultation
    teleconsultation.specialist_id = data.specialist_id
    teleconsultation.status = "ACTIVE"
    teleconsultation.started_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(teleconsultation)

    # Notify practitioner (if any) that specialist joined; patient-initiated uses polling/frontend redirect
    if teleconsultation.practitioner_id:
        await websocket_service.manager.send_to_specialist(
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
    
    if teleconsultation.status != "ACTIVE":
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
