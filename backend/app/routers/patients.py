from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.patient import LinkPatientRequest, PatientCreate, PatientRead, PatientUpdate
from app.services import patient_service

router = APIRouter(prefix="/api/patients", tags=["patients"])


@router.post("/", response_model=PatientRead, status_code=201)
async def create_patient(
    data: PatientCreate,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await patient_service.create_patient(data, db)


@router.get("/", response_model=list[PatientRead])
async def list_patients(
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await patient_service.list_patients(db)


@router.get("/{patient_id}", response_model=PatientRead)
async def get_patient(
    patient_id: UUID,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await patient_service.get_patient(patient_id, db)


@router.put("/{patient_id}", response_model=PatientRead)
async def update_patient(
    patient_id: UUID,
    data: PatientUpdate,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await patient_service.update_patient(patient_id, data, db)


@router.post("/{patient_id}/link", response_model=PatientRead)
async def link_patient_to_user(
    patient_id: UUID,
    data: LinkPatientRequest,
    _user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await patient_service.link_to_user(patient_id, data.user_id, db)
