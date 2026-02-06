from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.models.user import User
from app.schemas.retraining_log import RetrainingLogCreate, RetrainingLogRead
from app.services import retraining_log_service

router = APIRouter(prefix="/api/retraining-logs", tags=["retraining-logs"])


@router.post("/", response_model=RetrainingLogRead, status_code=201)
async def create_log(
    data: RetrainingLogCreate,
    _admin: Annotated[User, Depends(require_role("ADMIN"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await retraining_log_service.create_log(data, db)


@router.get("/", response_model=list[RetrainingLogRead])
async def list_logs(
    _admin: Annotated[User, Depends(require_role("ADMIN"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await retraining_log_service.list_logs(db)


@router.get("/{log_id}", response_model=RetrainingLogRead)
async def get_log(
    log_id: UUID,
    _admin: Annotated[User, Depends(require_role("ADMIN"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await retraining_log_service.get_log(log_id, db)
