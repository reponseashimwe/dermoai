import uuid
from datetime import datetime

from pydantic import BaseModel


class RetrainingLogCreate(BaseModel):
    dataset_size: int
    accuracy: float | None = None
    model_version: str


class RetrainingLogRead(BaseModel):
    log_id: uuid.UUID
    retrained_at: datetime
    dataset_size: int
    accuracy: float | None = None
    model_version: str

    model_config = {"from_attributes": True}
