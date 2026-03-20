import logging
import sys
import types
from contextlib import asynccontextmanager

# Pydantic v1 compat shim crashes on Python 3.13 (metaclass conflict in ConstrainedDate).
# FastAPI calls `from pydantic import v1` for every response_model to check if it's a v1
# model; install a stub so the check returns False instead of raising TypeError.
try:
    import pydantic.v1  # noqa: F401
except TypeError:
    _stub = types.ModuleType("pydantic.v1")

    class _BaseModel:  # minimal stub — lenient_issubclass checks against this
        pass

    _stub.BaseModel = _BaseModel  # type: ignore[attr-defined]
    sys.modules["pydantic.v1"] = _stub

# Time freeze must be activated before any other imports that use datetime
from app.core.config import settings
if settings.FREEZE_TIME:
    import datetime as _dt
    from zoneinfo import ZoneInfo
    from freezegun import freeze_time as _freeze_time
    # Combine the frozen date with the real current Kigali time (UTC+2).
    _kigali = ZoneInfo("Africa/Kigali")
    _frozen_date = _dt.date.fromisoformat(settings.FREEZE_TIME)
    _now_kigali = _dt.datetime.now(_kigali)
    _frozen_start = _dt.datetime.combine(_frozen_date, _now_kigali.timetz())
    _freezer = _freeze_time(
        _frozen_start.isoformat(),
        tick=True,
        # Keep deterministic app timestamps, but never freeze LiveKit token clock.
        ignore=["cloudinary", "livekit", "app.services.livekit_service"],
    )
    _freezer.start()
    logging.getLogger(__name__).warning("⚠ Date frozen at: %s (Kigali time ticking)", _frozen_date)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.migrate import run_migrations
from app.core.seed import run_seed
from app.routers import (
    appointments,
    auth,
    clinical_reviews,
    conditions,
    consultations,
    images,
    notifications,
    patients,
    practitioners,
    retraining_logs,
    stats,
    teleconsultations,
    triage,
    users,
    websocket,
)
from app.core.seed import run_seed
from app.services.cloudinary_service import configure_cloudinary
from app.services import condition_service
from app.core.database import async_session

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run migrations then seed on startup
    try:
        await run_migrations()
        await run_seed()
    except Exception as e:
        logger.exception("Startup migration/seed failed: %s", e)
        raise
    configure_cloudinary()
    try:
        await run_seed()
        # Seed predefined conditions
        async with async_session() as db:
            await condition_service.seed_predefined_conditions(db)
    except Exception as e:
        logger.warning("Seed skipped or failed: %s", e)
    yield


def create_app() -> FastAPI:
    application = FastAPI(
        title="DermoAI",
        description="AI-assisted dermatological triage for resource-limited settings",
        version="0.1.0",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    application.include_router(auth.router)
    application.include_router(users.router)
    application.include_router(patients.router)
    application.include_router(practitioners.router)
    application.include_router(consultations.router)
    application.include_router(images.router)
    application.include_router(triage.router)
    application.include_router(clinical_reviews.router)
    application.include_router(notifications.router)
    application.include_router(retraining_logs.router)
    application.include_router(stats.router)
    application.include_router(conditions.router)
    application.include_router(teleconsultations.router)
    application.include_router(appointments.router)
    application.include_router(websocket.router)

    @application.get("/health")
    async def health_check():
        return {"status": "healthy"}

    @application.exception_handler(SQLAlchemyError)
    async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
        logger.error("Database error: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal database error"},
        )

    return application


app = create_app()
