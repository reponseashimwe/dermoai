import uuid
from datetime import datetime

from pydantic import BaseModel


class ConsultationCreate(BaseModel):
    patient_id: uuid.UUID


class ConsultationRead(BaseModel):
    consultation_id: uuid.UUID
    patient_id: uuid.UUID
    created_by: uuid.UUID
    final_predicted_condition: str | None = None
    final_confidence: float | None = None
    urgency: str | None = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConsultationUpdate(BaseModel):
    status: str | None = None


class ConsultationImagesConsentUpdate(BaseModel):
    consent_to_reuse: bool
