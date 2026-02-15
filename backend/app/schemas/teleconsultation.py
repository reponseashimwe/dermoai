from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class TeleconsultationBase(BaseModel):
    consultation_id: UUID | None = None


class TeleconsultationCreate(TeleconsultationBase):
    specialist_id: UUID | None = None  # Optional: for direct requests to specific specialist


class TeleconsultationRead(TeleconsultationBase):
    teleconsultation_id: UUID
    practitioner_id: UUID | None
    requested_by_user_id: UUID
    specialist_id: UUID | None
    livekit_room_name: str
    status: str
    started_at: datetime | None
    ended_at: datetime | None
    duration_seconds: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TeleconsultationAccept(BaseModel):
    specialist_id: UUID


class TeleconsultationEnd(BaseModel):
    pass


class TeleconsultationToken(BaseModel):
    token: str
    room_name: str
