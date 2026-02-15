from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.condition import ConditionCreate, ConditionRead
from app.services import condition_service

router = APIRouter(prefix="/api/conditions", tags=["conditions"])


@router.get("/", response_model=list[ConditionRead])
async def list_conditions(
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all conditions (predefined and custom)."""
    return await condition_service.list_conditions(db)


@router.post("/", response_model=ConditionRead)
async def create_condition(
    _user: Annotated[User, Depends(get_current_user)],
    data: ConditionCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a custom condition."""
    return await condition_service.create_condition(data, db)
