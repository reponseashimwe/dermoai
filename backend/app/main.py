import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.migrate import run_migrations
from app.core.seed import run_seed
from app.routers import (
    auth,
    clinical_reviews,
    consultations,
    images,
    notifications,
    patients,
    practitioners,
    retraining_logs,
    triage,
    users,
)
from app.services.cloudinary_service import configure_cloudinary

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
