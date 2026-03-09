"""SMS notification service for urgent case alerts and consent PINs."""

import os
import random
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.practitioner import Practitioner
from app.models.user import User

MISTA_API_KEY = os.getenv("MISTA_API_KEY")
MISTA_API_URL = os.getenv("MISTA_API_URL", "https://api.mista.io/v1/sms")
SENDER_NAME = os.getenv("SMS_SENDER_NAME", "DermoAI")


def generate_pin() -> str:
    """Generate a 6-digit PIN code."""
    return f"{random.randint(100000, 999999)}"


async def send_sms(phone_number: str, message: str) -> bool:
    """Send an SMS message to a phone number."""
    if not MISTA_API_KEY:
        print(f"SMS not configured, would have sent to {phone_number}: {message}")
        return False

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                MISTA_API_URL,
                headers={"Authorization": f"Bearer {MISTA_API_KEY}"},
                json={
                    "to": phone_number,
                    "from": SENDER_NAME,
                    "message": message,
                },
                timeout=10.0,
            )
            return response.status_code == 200
    except Exception as e:
        print(f"SMS send failed for {phone_number}: {e}")
        return False


async def send_consent_pin(phone_number: str, pin: str) -> bool:
    """Send consent PIN to patient's phone number."""
    message = (
        f"DermoAI: Your consent PIN is {pin}. "
        f"Valid for 10 minutes. Do not share this code."
    )
    return await send_sms(phone_number, message)


async def send_urgent_alert(
    consultation_id: UUID,
    condition: str,
    db: AsyncSession,
) -> dict:
    """Send SMS to all approved specialists about urgent case."""
    if not MISTA_API_KEY:
        return {"status": "skipped", "reason": "SMS not configured"}

    result = await db.execute(
        select(User)
        .join(Practitioner, Practitioner.user_id == User.user_id)
        .where(
            Practitioner.practitioner_type == "SPECIALIST",
            Practitioner.approval_status == "APPROVED",
            User.phone_number.isnot(None),
        )
    )
    specialists = result.scalars().all()

    if not specialists:
        return {"status": "no_recipients"}

    message = (
        f"DermoAI REFER: New {condition} case requires specialist review. "
        f"Consultation ID: {str(consultation_id)[:8]}. Please log in to review."
    )

    sent_count = 0
    async with httpx.AsyncClient() as client:
        for specialist in specialists:
            if specialist.phone_number:
                success = await send_sms(specialist.phone_number, message)
                if success:
                    sent_count += 1

    return {"status": "sent", "count": sent_count, "total": len(specialists)}


# --- Appointment lifecycle SMS ---


async def send_appointment_created_to_specialist(
    phone_number: str,
    requester_name: str,
    proposed_datetime: str,
    consultation_id_short: str,
) -> bool:
    """Notify specialist that a new appointment request was created."""
    message = (
        f"DermoAI: New appointment request from {requester_name} "
        f"for {proposed_datetime}. Consultation: {consultation_id_short}. Please log in to respond."
    )
    return await send_sms(phone_number, message)


async def send_appointment_rejected_to_requester(
    phone_number: str,
    proposed_datetime: str,
    rejection_reason: str | None,
) -> bool:
    """Notify requester that their appointment was rejected."""
    reason = f" Reason: {rejection_reason}" if rejection_reason else ""
    message = (
        f"DermoAI: Your appointment request for {proposed_datetime} was not accepted.{reason} "
        "Log in to book another time."
    )
    return await send_sms(phone_number, message)


async def send_appointment_accepted_to_requester(
    phone_number: str,
    specialist_name: str,
    proposed_datetime: str,
) -> bool:
    """Notify requester that their appointment was approved."""
    message = (
        f"DermoAI: Your appointment with {specialist_name} on {proposed_datetime} has been approved. "
        "Join the video call from the app when it's time."
    )
    return await send_sms(phone_number, message)


async def send_call_started(phone_number: str) -> bool:
    """Notify participant that the video call is ready."""
    message = "DermoAI: Your video call is ready. Join from the app now."
    return await send_sms(phone_number, message)
