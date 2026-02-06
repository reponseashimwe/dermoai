from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate
from app.services import user_service

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user


@router.put("/me", response_model=UserRead)
async def update_me(
    data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await user_service.update_user(current_user, data, db)


@router.get("/", response_model=list[UserRead])
async def list_users(
    _admin: Annotated[User, Depends(require_role("ADMIN"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await user_service.list_users(db)


@router.put("/{user_id}/deactivate", response_model=UserRead)
async def deactivate_user(
    user_id: UUID,
    _admin: Annotated[User, Depends(require_role("ADMIN"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await user_service.deactivate_user(user_id, db)
