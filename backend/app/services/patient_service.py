from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import PatientCreate, PatientUpdate


async def create_patient(data: PatientCreate, db: AsyncSession) -> Patient:
    patient = Patient(
        name=data.name,
        phone_number=data.phone_number,
        user_id=data.user_id,
    )
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return patient


async def get_patient(patient_id: UUID, db: AsyncSession) -> Patient:
    result = await db.execute(
        select(Patient).where(Patient.patient_id == patient_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )
    return patient


async def get_patient_by_user_id(user_id: UUID, db: AsyncSession) -> Patient:
    """Return the patient record linked to this user (for self-service). Raises 404 if none."""
    result = await db.execute(
        select(Patient).where(Patient.user_id == user_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No patient profile linked to your account",
        )
    return patient


async def list_patients(db: AsyncSession) -> list[Patient]:
    result = await db.execute(select(Patient).order_by(Patient.created_at.desc()))
    return list(result.scalars().all())


async def update_patient(
    patient_id: UUID, data: PatientUpdate, db: AsyncSession
) -> Patient:
    patient = await get_patient(patient_id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)
    await db.commit()
    await db.refresh(patient)
    return patient


async def link_to_user(
    patient_id: UUID, user_id: UUID, db: AsyncSession
) -> Patient:
    patient = await get_patient(patient_id, db)

    result = await db.execute(select(User).where(User.user_id == user_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    patient.user_id = user_id
    await db.commit()
    await db.refresh(patient)
    return patient
