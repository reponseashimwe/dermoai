from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.image import AttachImageRequest, ImageRead, ImageUploadResponse
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


@router.get("/{image_id}", response_model=ImageRead)
async def get_image(
    image_id: UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await image_service.get_image(image_id, db)


@router.get("/consultation/{consultation_id}", response_model=list[ImageRead])
async def list_consultation_images(
    consultation_id: UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await image_service.list_for_consultation(consultation_id, db)


@router.delete("/{image_id}", status_code=204)
async def delete_image(
    image_id: UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await image_service.delete_image(image_id, db)
