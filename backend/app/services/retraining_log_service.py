from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.retraining_log import RetrainingLog
from app.schemas.retraining_log import RetrainingLogCreate


async def create_log(data: RetrainingLogCreate, db: AsyncSession) -> RetrainingLog:
    log = RetrainingLog(
        dataset_size=data.dataset_size,
        accuracy=data.accuracy,
        model_version=data.model_version,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


async def get_log(log_id: UUID, db: AsyncSession) -> RetrainingLog:
    result = await db.execute(
        select(RetrainingLog).where(RetrainingLog.log_id == log_id)
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Retraining log not found"
        )
    return log


async def list_logs(db: AsyncSession) -> list[RetrainingLog]:
    result = await db.execute(
        select(RetrainingLog).order_by(RetrainingLog.retrained_at.desc())
    )
    return list(result.scalars().all())
