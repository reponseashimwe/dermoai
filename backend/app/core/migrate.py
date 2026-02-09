"""Run Alembic migrations programmatically on startup."""

import asyncio
import logging
import subprocess
from pathlib import Path

logger = logging.getLogger(__name__)

# Backend root (parent of app/)
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


def _run_migrations_sync() -> None:
    """Run `alembic upgrade head` in backend dir. Blocks."""
    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        cwd=BACKEND_DIR,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        logger.error("Migration failed: %s", result.stderr or result.stdout)
        raise RuntimeError(f"Migration failed: {result.stderr or result.stdout}")
    if result.stdout:
        logger.debug("Migration output: %s", result.stdout.strip())


async def run_migrations() -> None:
    """Run Alembic migrations in a thread so the event loop is not blocked."""
    await asyncio.to_thread(_run_migrations_sync)
    logger.info("Migrations completed (alembic upgrade head)")
