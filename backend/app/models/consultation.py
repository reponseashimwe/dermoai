import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Consultation(Base):
    __tablename__ = "consultations"

    consultation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.patient_id"), nullable=False
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False
    )
    final_predicted_condition: Mapped[str | None] = mapped_column(
        String, nullable=True
    )
    final_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    urgency: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="OPEN")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    patient: Mapped["Patient"] = relationship("Patient", back_populates="consultations")
    creator: Mapped["User"] = relationship("User")
    images: Mapped[list["Image"]] = relationship(
        "Image", back_populates="consultation"
    )
    clinical_reviews: Mapped[list["ClinicalReview"]] = relationship(
        "ClinicalReview", back_populates="consultation"
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="consultation"
    )
    teleconsultations: Mapped[list["Teleconsultation"]] = relationship(
        "Teleconsultation", back_populates="consultation"
    )
