from typing import Annotated

from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_optional_user
from app.models.user import User
from app.schemas.image import ImageRead, QuickScanResponse
from app.services import image_service

router = APIRouter(prefix="/api/triage", tags=["triage"])


@router.post("/scan", response_model=QuickScanResponse)
async def quick_scan(
    file: UploadFile,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_optional_user)] = None,
    consent_to_reuse: bool = False,
):
    """Upload an image for instant ML prediction.

    Works without authentication. If a Bearer token is provided,
    the image is linked to the authenticated user.
    Set consent_to_reuse=true to allow the image to be used for future model retraining.
    """
    user_id = current_user.user_id if current_user else None
    return await image_service.quick_scan(
        file, db, user_id=user_id, consent_to_reuse=consent_to_reuse
    )


@router.get("/history", response_model=list[ImageRead])
async def scan_history(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List quick-scan images for the current authenticated user."""
    return await image_service.list_for_user(current_user.user_id, db)
