from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.schemas.image import (
    AttachImageRequest,
    ImageListResponse,
    ImageRead,
    ImageReviewUpdate,
    ImageUploadResponse,
)
from app.services import image_service

router = APIRouter(prefix="/api/images", tags=["images"])


@router.post("/upload", response_model=ImageUploadResponse, status_code=201)
async def upload_to_consultation(
    file: UploadFile,
    consultation_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    image = await image_service.upload_to_consultation(
        file, consultation_id, current_user.user_id, db
    )
    return image


@router.post("/{image_id}/attach", response_model=ImageRead)
async def attach_to_consultation(
    image_id: UUID,
    data: AttachImageRequest,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await image_service.attach_to_consultation(
        image_id, data.consultation_id, db
    )


@router.get("/unreviewed", response_model=ImageListResponse)
async def list_unreviewed_images(
    _user: Annotated[User, Depends(require_role("PRACTITIONER"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """List images eligible for specialist review (allowed_review=true, no reviewed_label). Paginated."""
    items, total = await image_service.list_unreviewed(db, skip=skip, limit=limit)
    return ImageListResponse(items=[ImageRead.model_validate(i) for i in items], total=total)


@router.get("/all", response_model=ImageListResponse)
async def list_all_images(
    _user: Annotated[User, Depends(require_role("ADMIN"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    consultation_id: UUID | None = None,
    uploaded_by: UUID | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
):
    """List all images in the system (admin). Optional filters. Paginated."""
    items, total = await image_service.list_all(
        db,
        skip=skip,
        limit=limit,
        consultation_id=consultation_id,
        uploaded_by=uploaded_by,
        date_from=date_from,
        date_to=date_to,
    )
    return ImageListResponse(items=[ImageRead.model_validate(i) for i in items], total=total)


@router.get("/consultation/{consultation_id}", response_model=list[ImageRead])
async def list_consultation_images(
    consultation_id: UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await image_service.list_for_consultation(consultation_id, db)


@router.get("/{image_id}", response_model=ImageRead)
async def get_image(
    image_id: UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await image_service.get_image(image_id, db)


@router.patch("/{image_id}", response_model=ImageRead)
async def update_image_review(
    image_id: UUID,
    data: ImageReviewUpdate,
    _user: Annotated[User, Depends(require_role("PRACTITIONER"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Set reviewed_label for an image (specialist review queue)."""
    return await image_service.update_reviewed_label(
        image_id, data.reviewed_label, db
    )


@router.delete("/{image_id}", status_code=204)
async def delete_image(
    image_id: UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await image_service.delete_image(image_id, db)
