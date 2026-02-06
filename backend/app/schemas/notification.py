import uuid
from datetime import datetime

from pydantic import BaseModel


class NotificationRead(BaseModel):
    notification_id: uuid.UUID
    consultation_id: uuid.UUID | None = None
    recipient_id: uuid.UUID
    message: str
    status: str
    sent_at: datetime | None = None

    model_config = {"from_attributes": True}
