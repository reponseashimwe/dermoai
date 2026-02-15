from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import nulls_last, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.practitioner import Practitioner
from app.schemas.practitioner import ApprovalAction, PractitionerStatusUpdate, PractitionerUpdate


async def get_practitioner(practitioner_id: UUID, db: AsyncSession) -> Practitioner:
    result = await db.execute(
        select(Practitioner).where(Practitioner.practitioner_id == practitioner_id)
    )
    practitioner = result.scalar_one_or_none()
    if not practitioner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Practitioner not found"
        )
    return practitioner


async def get_practitioner_by_user_id(user_id: UUID, db: AsyncSession) -> Practitioner | None:
    result = await db.execute(select(Practitioner).where(Practitioner.user_id == user_id))
    return result.scalar_one_or_none()


# Alias for routers that use get_by_user_id
get_by_user_id = get_practitioner_by_user_id


async def list_practitioners(db: AsyncSession) -> list[Practitioner]:
    result = await db.execute(
        select(Practitioner).order_by(Practitioner.created_at.desc())
    )
    return list(result.scalars().all())


async def update_practitioner(
    practitioner_id: UUID, data: PractitionerUpdate, db: AsyncSession
) -> Practitioner:
    practitioner = await get_practitioner(practitioner_id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(practitioner, field, value)
    await db.commit()
    await db.refresh(practitioner)
    return practitioner


async def list_pending(db: AsyncSession) -> list[Practitioner]:
    result = await db.execute(
        select(Practitioner).where(Practitioner.approval_status == "PENDING")
    )
    return list(result.scalars().all())


async def approve_or_reject(
    practitioner_id: UUID, data: ApprovalAction, db: AsyncSession
) -> Practitioner:
    if data.approval_status not in ("APPROVED", "REJECTED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="approval_status must be APPROVED or REJECTED",
        )
    practitioner = await get_practitioner(practitioner_id, db)
    if practitioner.approval_status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only approve or reject PENDING practitioners",
        )
    practitioner.approval_status = data.approval_status
    await db.commit()
    await db.refresh(practitioner)
    return practitioner


async def list_available(
    db: AsyncSession,
    practitioner_type: str | None = None,
    online_only: bool = True,
    exclude_user_id: UUID | None = None,
) -> list[Practitioner]:
    """List practitioners (optionally online only, optionally filtered by type). Excludes current user when exclude_user_id is set. Loads user relation."""
    query = (
        select(Practitioner)
        .options(selectinload(Practitioner.user))
        .where(Practitioner.approval_status == "APPROVED", Practitioner.is_active.is_(True))
    )
    if online_only:
        query = query.where(Practitioner.is_online.is_(True))
    if practitioner_type is not None:
        query = query.where(Practitioner.practitioner_type == practitioner_type)
    if exclude_user_id is not None:
        query = query.where(Practitioner.user_id != exclude_user_id)
    query = query.order_by(
        nulls_last(Practitioner.last_active.desc()),
        Practitioner.created_at.desc(),
    )
    result = await db.execute(query)
    return list(result.unique().scalars().all())


async def update_my_status(
    user_id: UUID, data: PractitionerStatusUpdate, db: AsyncSession
) -> Practitioner:
    practitioner = await get_practitioner_by_user_id(user_id, db)
    if not practitioner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Practitioner profile not found",
        )
    practitioner.is_online = data.is_online
    practitioner.last_active = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(practitioner)
    return practitioner
