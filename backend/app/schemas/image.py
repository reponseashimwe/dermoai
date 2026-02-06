import uuid
from datetime import datetime

from pydantic import BaseModel


class ImageRead(BaseModel):
    image_id: uuid.UUID
    consultation_id: uuid.UUID | None = None
    uploaded_by: uuid.UUID | None = None
    image_url: str
    storage_key: str
    predicted_condition: str | None = None
    confidence: float | None = None
    reviewed_label: str | None = None
    uploaded_at: datetime
    file_size: int | None = None
    source: str
    allowed_review: bool
    consent_to_reuse: bool

    model_config = {"from_attributes": True}


class ImageUploadResponse(BaseModel):
    image_id: uuid.UUID
    image_url: str
    predicted_condition: str | None = None
    confidence: float | None = None

    model_config = {"from_attributes": True}


class QuickScanResponse(BaseModel):
    image_id: uuid.UUID
    image_url: str
    predicted_condition: str
    confidence: float
    urgency: str
    consent_to_reuse: bool

    model_config = {"from_attributes": True}


class AttachImageRequest(BaseModel):
    consultation_id: uuid.UUID
