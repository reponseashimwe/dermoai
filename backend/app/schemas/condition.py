from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ConditionBase(BaseModel):
    condition_name: str
    category: str | None = None


class ConditionCreate(ConditionBase):
    pass


class ConditionRead(ConditionBase):
    condition_id: UUID
    is_predefined: bool
    created_at: datetime

    model_config = {"from_attributes": True}
