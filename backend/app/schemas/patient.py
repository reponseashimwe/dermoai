import uuid
from datetime import datetime

from pydantic import BaseModel


class PatientCreate(BaseModel):
    name: str
    phone_number: str | None = None
    user_id: uuid.UUID | None = None


class PatientRead(BaseModel):
    patient_id: uuid.UUID
    user_id: uuid.UUID | None = None
    name: str
    phone_number: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PatientUpdate(BaseModel):
    name: str | None = None
    phone_number: str | None = None


class LinkPatientRequest(BaseModel):
    user_id: uuid.UUID
