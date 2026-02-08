"""Database seeding: super admin, practitioners, and specialists (find-or-create on startup)."""
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session
from app.core.security import hash_password
from app.models.practitioner import Practitioner
from app.models.user import User

logger = logging.getLogger(__name__)

SEED_USERS = [
    {
        "email": "admin@dermoai.rw",
        "name": "Super Admin",
        "password": "Admin@123",
        "role": "ADMIN",
        "phone_number": None,
    },
    {
        "email": "dr.mutesi@dermoai.rw",
        "name": "Dr. Mutesi",
        "password": "Doctor@123",
        "role": "PRACTITIONER",
        "phone_number": None,
        "practitioner_type": "GENERAL",
        "expertise": "General Practice",
    },
    {
        "email": "dr.uwase@dermoai.rw",
        "name": "Dr. Uwase",
        "password": "Doctor@123",
        "role": "PRACTITIONER",
        "phone_number": None,
        "practitioner_type": "GENERAL",
        "expertise": "General Practice",
    },
    {
        "email": "dr.kagabo@dermoai.rw",
        "name": "Dr. Kagabo",
        "password": "Doctor@123",
        "role": "PRACTITIONER",
        "phone_number": None,
        "practitioner_type": "SPECIALIST",
        "expertise": "Dermatology",
    },
    {
        "email": "dr.ingabire@dermoai.rw",
        "name": "Dr. Ingabire",
        "password": "Doctor@123",
        "role": "PRACTITIONER",
        "phone_number": None,
        "practitioner_type": "SPECIALIST",
        "expertise": "Dermatology",
    },
]


async def _get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def _ensure_user(session: AsyncSession, data: dict) -> User:
    existing = await _get_user_by_email(session, data["email"])
    if existing:
        logger.info("Seed user already exists: %s", data["email"])
        return existing

    user = User(
        name=data["name"],
        email=data["email"],
        phone_number=data.get("phone_number"),
        password_hash=hash_password(data["password"]),
        role=data["role"],
    )
    session.add(user)
    await session.flush()

    if data["role"] == "PRACTITIONER":
        practitioner = Practitioner(
            user_id=user.user_id,
            practitioner_type=data["practitioner_type"],
            expertise=data.get("expertise"),
            approval_status="APPROVED",
        )
        session.add(practitioner)

    logger.info("Created seed user: %s (%s)", data["email"], data["role"])
    return user


async def run_seed() -> None:
    """Run find-or-create seed for super admin, practitioners, and specialists."""
    async with async_session() as session:
        try:
            for data in SEED_USERS:
                await _ensure_user(session, data)
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.exception("Seed failed: %s", e)
            raise
