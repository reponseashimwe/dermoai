"""Database seeding: run after migrations to populate initial data."""

import logging

from sqlalchemy import select

from app.core.config import settings
from app.core.database import async_session
from app.core.security import hash_password
from app.models.user import User
from app.models.practitioner import Practitioner

logger = logging.getLogger(__name__)


async def run_seed() -> None:
    """Run all seed logic. Idempotent: safe to call on every startup."""
    async with async_session() as session:
        await _seed_admin_if_configured(session)
        await session.commit()


async def _seed_admin_if_configured(session) -> None:
    """Create a default admin/practitioner if env vars are set and no user exists."""
    email = getattr(settings, "SEED_ADMIN_EMAIL", None) or ""
    password = getattr(settings, "SEED_ADMIN_PASSWORD", None) or ""
    name = getattr(settings, "SEED_ADMIN_NAME", None) or "Admin"

    if not email or not password:
        logger.debug("Seed admin skipped: SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not set")
        return

    result = await session.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        logger.debug("Seed admin skipped: user with SEED_ADMIN_EMAIL already exists")
        return

    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role="PRACTITIONER",
    )
    session.add(user)
    await session.flush()

    practitioner = Practitioner(
        user_id=user.user_id,
        practitioner_type="DERMATOLOGIST",
        approval_status="APPROVED",
    )
    session.add(practitioner)
    logger.info("Seed admin user created: %s", email)
