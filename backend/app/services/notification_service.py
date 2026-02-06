import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.consultation import Consultation
from app.models.notification import Notification
from app.models.practitioner import Practitioner
from app.models.user import User

logger = logging.getLogger(__name__)


async def create_notification(
    consultation_id: UUID | None,
    recipient_id: UUID,
    message: str,
    db: AsyncSession,
) -> Notification:
    notification = Notification(
        consultation_id=consultation_id,
        recipient_id=recipient_id,
        message=message,
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification


async def send_email_stub(
    notification: Notification, recipient_email: str, db: AsyncSession
) -> None:
    """Stub: logs to console instead of sending actual email."""
    logger.info(
        "EMAIL STUB — To: %s | Message: %s",
        recipient_email,
        notification.message,
    )
    notification.status = "SENT"
    notification.sent_at = datetime.now(timezone.utc)
    await db.commit()


async def notify_urgent_case(
    consultation: Consultation, db: AsyncSession
) -> None:
    """Notify all approved specialists about an urgent case."""
    result = await db.execute(
        select(Practitioner).where(
            Practitioner.approval_status == "APPROVED",
            Practitioner.practitioner_type == "SPECIALIST",
            Practitioner.is_active == True,  # noqa: E712
        )
    )
    specialists = result.scalars().all()

    for specialist in specialists:
        user_result = await db.execute(
            select(User).where(User.user_id == specialist.user_id)
        )
        user = user_result.scalar_one_or_none()
        if not user:
            continue

        message = (
            f"URGENT case detected — Consultation {consultation.consultation_id}: "
            f"{consultation.final_predicted_condition} "
            f"(confidence: {consultation.final_confidence})"
        )

        notification = await create_notification(
            consultation.consultation_id, user.user_id, message, db
        )
        await send_email_stub(notification, user.email, db)


async def list_for_user(
    user_id: UUID, db: AsyncSession
) -> list[Notification]:
    result = await db.execute(
        select(Notification)
        .where(Notification.recipient_id == user_id)
        .order_by(Notification.notification_id.desc())
    )
    return list(result.scalars().all())
