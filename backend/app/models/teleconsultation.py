import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Teleconsultation(Base):
    __tablename__ = "teleconsultations"

    teleconsultation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    consultation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("consultations.consultation_id"), nullable=True
    )
    practitioner_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("practitioners.practitioner_id"), nullable=True
    )
    requested_by_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False
    )
    specialist_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("practitioners.practitioner_id"), nullable=True
    )
    livekit_room_name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    consultation: Mapped["Consultation"] = relationship("Consultation", back_populates="teleconsultations")
    practitioner: Mapped["Practitioner | None"] = relationship(
        "Practitioner", foreign_keys=[practitioner_id], back_populates="initiated_teleconsultations"
    )
    requested_by_user: Mapped["User"] = relationship("User", foreign_keys=[requested_by_user_id])
    specialist: Mapped["Practitioner | None"] = relationship(
        "Practitioner", foreign_keys=[specialist_id], back_populates="accepted_teleconsultations"
    )
