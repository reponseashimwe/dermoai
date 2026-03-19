import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, model_validator


class ImageRead(BaseModel):
    image_id: uuid.UUID
    consultation_id: uuid.UUID | None = None
    uploaded_by: uuid.UUID | None = None
    image_url: str
    storage_key: str
    predicted_condition: str | None = None
    confidence: float | None = None
    urgency: str | None = None
    reviewed_label: str | None = None
    reviewed_by: uuid.UUID | None = None
    reviewed_by_name: str | None = None
    reviewed_as_final: bool = False

    @model_validator(mode="before")
    @classmethod
    def extract_reviewer_name(cls, data: Any) -> Any:
        if hasattr(data, "reviewer") and data.reviewer is not None:
            data.__dict__["reviewed_by_name"] = data.reviewer.name
        return data
    uploaded_at: datetime
    file_size: int | None = None
    source: str
    allowed_review: bool
    consent_to_reuse: bool
    all_probabilities: dict[str, float] | None = None
    model_version: str | None = None
    triage_stage: str | None = None
    gradcam_base64: str | None = None
    gradcam_metrics: dict | None = None

    model_config = {"from_attributes": True}


class ImageUploadResponse(BaseModel):
    image_id: uuid.UUID
    image_url: str
    predicted_condition: str | None = None
    confidence: float | None = None
    all_probabilities: dict[str, float] | None = None
    model_version: str | None = None
    triage_stage: str | None = None
    gradcam_base64: str | None = None
    gradcam_metrics: dict | None = None

    model_config = {"from_attributes": True}


class QuickScanResponse(BaseModel):
    image_id: uuid.UUID
    image_url: str
    predicted_condition: str
    confidence: float
    urgency: str
    consent_to_reuse: bool
    all_probabilities: dict[str, float] | None = None
    model_version: str | None = None
    model_date: str | None = None
    triage_stage: str | None = None
    gradcam_base64: str | None = None
    gradcam_metrics: dict | None = None

    model_config = {"from_attributes": True}


class AttachImageRequest(BaseModel):
    consultation_id: uuid.UUID


class ImageListResponse(BaseModel):
    items: list[ImageRead]
    total: int


class ImageReviewUpdate(BaseModel):
    reviewed_label: str


class ImageConsentUpdate(BaseModel):
    consent_to_reuse: bool
