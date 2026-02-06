from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.practitioner import Practitioner
from app.schemas.practitioner import ApprovalAction, PractitionerUpdate


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
