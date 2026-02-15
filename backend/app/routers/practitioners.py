from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.schemas.practitioner import (
    ApprovalAction,
    PractitionerAvailableRead,
    PractitionerRead,
    PractitionerStatusUpdate,
    PractitionerUpdate,
)
from app.services import practitioner_service

router = APIRouter(prefix="/api/practitioners", tags=["practitioners"])


@router.get("/available", response_model=list[PractitionerAvailableRead])
async def list_available_practitioners(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    practitioner_type: str | None = None,
    online_only: bool = True,
):
    """List practitioners (online only by default), optionally filtered by type. Excludes current user. Includes name and email."""
    practitioners = await practitioner_service.list_available(
        db,
        practitioner_type=practitioner_type,
        online_only=online_only,
        exclude_user_id=current_user.user_id,
    )
    return [
        PractitionerAvailableRead(
            **PractitionerRead.model_validate(p).model_dump(),
            name=p.user.name,
            email=p.user.email,
        )
        for p in practitioners
    ]


@router.put("/me/status", response_model=PractitionerRead)
async def update_my_status(
    current_user: Annotated[User, Depends(require_role("PRACTITIONER"))],
    data: PractitionerStatusUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update current practitioner's online status. Sets last_active to now."""
    return await practitioner_service.update_my_status(current_user.user_id, data, db)


@router.get("/", response_model=list[PractitionerRead])
async def list_practitioners(
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await practitioner_service.list_practitioners(db)


@router.get("/pending", response_model=list[PractitionerRead])
async def list_pending_practitioners(
    _admin: Annotated[User, Depends(require_role("ADMIN"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await practitioner_service.list_pending(db)


@router.get("/{practitioner_id}", response_model=PractitionerRead)
async def get_practitioner(
    practitioner_id: UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await practitioner_service.get_practitioner(practitioner_id, db)


@router.put("/{practitioner_id}", response_model=PractitionerRead)
async def update_practitioner(
    practitioner_id: UUID,
    data: PractitionerUpdate,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await practitioner_service.update_practitioner(practitioner_id, data, db)


@router.put("/{practitioner_id}/approve", response_model=PractitionerRead)
async def approve_or_reject_practitioner(
    practitioner_id: UUID,
    data: ApprovalAction,
    _admin: Annotated[User, Depends(require_role("ADMIN"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await practitioner_service.approve_or_reject(practitioner_id, data, db)
