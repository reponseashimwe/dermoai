import uuid
from datetime import datetime

from pydantic import BaseModel


class PractitionerRead(BaseModel):
    practitioner_id: uuid.UUID
    user_id: uuid.UUID
    practitioner_type: str
    approval_status: str
    expertise: str | None = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PractitionerUpdate(BaseModel):
    expertise: str | None = None


class ApprovalAction(BaseModel):
    approval_status: str  # APPROVED or REJECTED
