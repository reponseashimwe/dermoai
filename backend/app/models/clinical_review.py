import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class ClinicalReview(Base):
    __tablename__ = "clinical_reviews"

    review_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    consultation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("consultations.consultation_id"),
        nullable=False,
    )
    practitioner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("practitioners.practitioner_id"),
        nullable=False,
    )
    diagnosis: Mapped[str] = mapped_column(String, nullable=False)
    treatment_plan: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_final: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    consultation: Mapped["Consultation"] = relationship(
        "Consultation", back_populates="clinical_reviews"
    )
    practitioner: Mapped["Practitioner"] = relationship(
        "Practitioner", back_populates="clinical_reviews"
    )
