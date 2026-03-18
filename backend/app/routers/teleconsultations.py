from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.core.config import settings
from app.models.user import User
from app.schemas.teleconsultation import (
    TeleconsultationAccept,
    TeleconsultationCreate,
    TeleconsultationEnd,
    TeleconsultationRead,
    TeleconsultationToken,
)
from app.services import livekit_service, practitioner_service, teleconsultation_service, websocket_service

router = APIRouter(prefix="/api/teleconsultations", tags=["teleconsultations"])


@router.post("/", response_model=TeleconsultationRead)
async def create_teleconsultation(
    current_user: Annotated[User, Depends(get_current_user)],
    data: TeleconsultationCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a teleconsultation: practitioner (GP) or patient can request a video call with a specialist."""
    return await teleconsultation_service.create_teleconsultation(
        current_user, data, db
    )


@router.post("/{teleconsultation_id}/accept", response_model=TeleconsultationRead)
async def accept_teleconsultation(
    teleconsultation_id: UUID,
    current_user: Annotated[User, Depends(require_role("PRACTITIONER"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Specialist accepts a teleconsultation request."""
    practitioner = await practitioner_service.get_by_user_id(current_user.user_id, db)
    data = TeleconsultationAccept(specialist_id=practitioner.practitioner_id)
    return await teleconsultation_service.accept_teleconsultation(
        teleconsultation_id, data, db
    )


@router.post("/{teleconsultation_id}/end", response_model=TeleconsultationRead)
async def end_teleconsultation(
    teleconsultation_id: UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """End a teleconsultation. Any authenticated participant can end the call."""
    return await teleconsultation_service.end_teleconsultation(teleconsultation_id, db)


@router.get("/{teleconsultation_id}/token", response_model=TeleconsultationToken)
async def get_teleconsultation_token(
    teleconsultation_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get LiveKit token for joining the teleconsultation room."""
    teleconsultation = await teleconsultation_service.get_teleconsultation(
        teleconsultation_id, db
    )

    # Notify other practitioner participants that someone joined this call.
    # Only practitioners trigger this notification; user joins are already
    # represented by the initial teleconsultation_request.
    if current_user.role == "PRACTITIONER":
        try:
            from app.services import practitioner_service as _ps

            practitioner = await _ps.get_by_user_id(current_user.user_id, db)
        except Exception:
            practitioner = None

        other_practitioner_ids: set[UUID] = set()
        if practitioner:
            # Current user is a practitioner: notify the other practitioner party (GP or specialist)
            if teleconsultation.practitioner_id and teleconsultation.practitioner_id != practitioner.practitioner_id:
                other_practitioner_ids.add(teleconsultation.practitioner_id)
            if teleconsultation.specialist_id and teleconsultation.specialist_id != practitioner.practitioner_id:
                other_practitioner_ids.add(teleconsultation.specialist_id)

        join_payload = {
            "type": "teleconsultation_joined",
            "teleconsultation_id": str(teleconsultation.teleconsultation_id),
            "consultation_id": str(teleconsultation.consultation_id) if teleconsultation.consultation_id else None,
        }
        for pid in other_practitioner_ids:
            try:
                await websocket_service.manager.send_to_participant(pid, join_payload)
            except Exception:
                # Do not fail token generation if notification fails
                continue

    # Generate token for the user
    token = livekit_service.generate_token(
        room_name=teleconsultation.livekit_room_name,
        participant_name=current_user.name,
        participant_identity=str(current_user.user_id),
    )
    return TeleconsultationToken(
        token=token,
        room_name=teleconsultation.livekit_room_name,
    )


@router.get("/incoming", response_model=list[TeleconsultationRead])
async def list_incoming_teleconsultations(
    current_user: Annotated[User, Depends(require_role("PRACTITIONER"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List pending teleconsultation requests for the current specialist (incoming calls)."""
    practitioner = await practitioner_service.get_by_user_id(current_user.user_id, db)
    return await teleconsultation_service.list_pending_for_specialist(
        practitioner.practitioner_id, db
    )


@router.get("/{teleconsultation_id}", response_model=TeleconsultationRead)
async def get_teleconsultation(
    teleconsultation_id: UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get teleconsultation details."""
    return await teleconsultation_service.get_teleconsultation(teleconsultation_id, db)
