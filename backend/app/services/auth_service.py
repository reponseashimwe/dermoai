from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.practitioner import Practitioner
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse


async def register(data: RegisterRequest, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    if data.role not in ("USER", "PRACTITIONER"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role"
        )

    if data.role == "PRACTITIONER" and not data.practitioner_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="practitioner_type is required for PRACTITIONER role",
        )

    user = User(
        name=data.name,
        email=data.email,
        phone_number=data.phone_number,
        password_hash=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    await db.flush()

    if data.role == "PRACTITIONER":
        practitioner = Practitioner(
            user_id=user.user_id,
            practitioner_type=data.practitioner_type,
            expertise=data.expertise,
            approval_status="PENDING",
        )
        db.add(practitioner)

    await db.commit()
    await db.refresh(user)
    return user


async def login(data: LoginRequest, db: AsyncSession) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated"
        )

    return TokenResponse(
        access_token=create_access_token(str(user.user_id), user.role),
        refresh_token=create_refresh_token(str(user.user_id)),
    )


async def refresh(refresh_token: str, db: AsyncSession) -> TokenResponse:
    payload = decode_token(refresh_token)
    sub = payload.get("sub")
    token_type = payload.get("type")
    if not sub or token_type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    result = await db.execute(select(User).where(User.user_id == UUID(sub)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return TokenResponse(
        access_token=create_access_token(str(user.user_id), user.role),
        refresh_token=create_refresh_token(str(user.user_id)),
    )
