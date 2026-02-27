"""Service for managing SMS-based consent verification with PINs."""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.consent_pin import ConsentPin
from app.models.consultation import Consultation
from app.models.patient import Patient
from app.models.image import Image
from app.services.sms_service import generate_pin, send_consent_pin


async def request_consent_pin(
    consultation_id: UUID, db: AsyncSession
) -> dict:
    """Generate PIN, send SMS, and store in database."""
    # Get consultation and patient
    result = await db.execute(
        select(Consultation).where(Consultation.consultation_id == consultation_id)
    )
    consultation = result.scalar_one_or_none()
    if not consultation:
        raise ValueError("Consultation not found")

    result = await db.execute(
        select(Patient).where(Patient.patient_id == consultation.patient_id)
    )
    patient = result.scalar_one_or_none()
    if not patient or not patient.phone_number:
        raise ValueError("Patient phone number not available")

    # Generate PIN
    pin_code = generate_pin()

    # Create PIN record
    consent_pin = ConsentPin(
        consultation_id=consultation_id,
        pin_code=pin_code,
        phone_number=patient.phone_number,
    )
    db.add(consent_pin)
    await db.commit()

    # Send SMS
    sms_sent = await send_consent_pin(patient.phone_number, pin_code)

    return {
        "status": "sent" if sms_sent else "created",
        "phone_number": patient.phone_number,
        "pin_id": str(consent_pin.pin_id),
        "expires_at": consent_pin.expires_at.isoformat(),
    }


async def verify_consent_pin(
    consultation_id: UUID, pin: str, db: AsyncSession
) -> dict:
    """Verify PIN and update consent for all images in consultation."""
    # Find the most recent non-expired, unverified PIN for this consultation
    result = await db.execute(
        select(ConsentPin)
        .where(
            ConsentPin.consultation_id == consultation_id,
            ConsentPin.verified == False,
            ConsentPin.expires_at > datetime.now(timezone.utc),
        )
        .order_by(ConsentPin.created_at.desc())
    )
    consent_pin = result.scalar_one_or_none()

    if not consent_pin:
        return {"status": "error", "message": "No valid PIN found or PIN expired"}

    if consent_pin.pin_code != pin:
        return {"status": "error", "message": "Invalid PIN"}

    # Mark PIN as verified
    consent_pin.verified = True
    consent_pin.verified_at = datetime.now(timezone.utc)

    # Update all images in consultation to have consent
    result = await db.execute(
        select(Image).where(Image.consultation_id == consultation_id)
    )
    images = result.scalars().all()
    
    for image in images:
        image.consent_to_reuse = True

    await db.commit()

    return {
        "status": "verified",
        "images_updated": len(images),
        "verified_at": consent_pin.verified_at.isoformat(),
    }
