"""Schemas for appointment requests."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AppointmentRequestCreate(BaseModel):
    consultation_id: UUID | None = None
    specialist_id: UUID | None = None
    proposed_datetime: datetime
    notes: str | None = None


class AppointmentRequestUpdate(BaseModel):
    status: str | None = None
    specialist_proposed_datetime: datetime | None = None
    rejection_reason: str | None = None


class AppointmentRequestRead(BaseModel):
    request_id: UUID
    consultation_id: UUID | None
    requested_by_user_id: UUID
    specialist_id: UUID | None
    proposed_datetime: datetime
    status: str
    specialist_proposed_datetime: datetime | None
    notes: str | None
    rejection_reason: str | None
    created_at: datetime
    updated_at: datetime
    specialist_name: str | None = None
    requester_name: str | None = None

    class Config:
        from_attributes = True
