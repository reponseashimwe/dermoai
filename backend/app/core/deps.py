from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.models.practitioner import Practitioner
from app.models.user import User

bearer_scheme = HTTPBearer()
bearer_scheme_optional = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    payload = decode_token(credentials.credentials)
    sub = payload.get("sub")
    token_type = payload.get("type")
    if not sub or token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    result = await db.execute(select(User).where(User.user_id == UUID(sub)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


async def get_optional_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme_optional)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User | None:
    """Returns the user if a valid token is provided, otherwise None."""
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    sub = payload.get("sub")
    token_type = payload.get("type")
    if not sub or token_type != "access":
        return None
    result = await db.execute(select(User).where(User.user_id == UUID(sub)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        return None
    return user


def require_role(*roles: str):
    async def role_checker(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return role_checker


async def get_current_active_practitioner(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Practitioner:
    if current_user.role != "PRACTITIONER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Practitioner role required",
        )
    result = await db.execute(
        select(Practitioner).where(Practitioner.user_id == current_user.user_id)
    )
    practitioner = result.scalar_one_or_none()
    if not practitioner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Practitioner profile not found",
        )
    return practitioner


async def require_approved_practitioner(
    practitioner: Annotated[Practitioner, Depends(get_current_active_practitioner)],
) -> Practitioner:
    if practitioner.approval_status != "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Practitioner not approved",
        )
    return practitioner
