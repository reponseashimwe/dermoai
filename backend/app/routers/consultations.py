from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.consultation import ConsultationCreate, ConsultationRead, ConsultationUpdate
from app.services import consultation_service

router = APIRouter(prefix="/api/consultations", tags=["consultations"])


@router.post("/", response_model=ConsultationRead, status_code=201)
async def create_consultation(
    data: ConsultationCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await consultation_service.create_consultation(
        data, current_user.user_id, db
    )


@router.get("/", response_model=list[ConsultationRead])
async def list_consultations(
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await consultation_service.list_consultations(db)


@router.get("/{consultation_id}", response_model=ConsultationRead)
async def get_consultation(
    consultation_id: UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await consultation_service.get_consultation(consultation_id, db)


@router.put("/{consultation_id}", response_model=ConsultationRead)
async def update_consultation(
    consultation_id: UUID,
    data: ConsultationUpdate,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await consultation_service.update_consultation(consultation_id, data, db)
