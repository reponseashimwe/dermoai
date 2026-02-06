import uuid
from datetime import datetime

from pydantic import BaseModel


class ClinicalReviewCreate(BaseModel):
    consultation_id: uuid.UUID
    diagnosis: str
    treatment_plan: str | None = None
    notes: str | None = None
    is_final: bool = False


class ClinicalReviewRead(BaseModel):
    review_id: uuid.UUID
    consultation_id: uuid.UUID
    practitioner_id: uuid.UUID
    diagnosis: str
    treatment_plan: str | None = None
    notes: str | None = None
    is_final: bool
    created_at: datetime

    model_config = {"from_attributes": True}
