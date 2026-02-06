import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Practitioner(Base):
    __tablename__ = "practitioners"

    practitioner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id"), unique=True, nullable=False
    )
    practitioner_type: Mapped[str] = mapped_column(String, nullable=False)
    approval_status: Mapped[str] = mapped_column(
        String, nullable=False, default="PENDING"
    )
    expertise: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship("User", back_populates="practitioner")
    clinical_reviews: Mapped[list["ClinicalReview"]] = relationship(
        "ClinicalReview", back_populates="practitioner"
    )
