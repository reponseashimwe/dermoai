import uuid

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class UUIDMixin:
    """Mixin that adds a UUID primary key column. Subclasses override `pk_name`."""

    @classmethod
    def _pk_column(cls, name: str) -> Column:
        return Column(name, UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
