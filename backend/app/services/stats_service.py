from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clinical_review import ClinicalReview
from app.models.consultation import Consultation
from app.models.image import Image
from app.models.patient import Patient
from app.models.practitioner import Practitioner
from app.models.user import User
from app.schemas.stats import (
    AdminStatsResponse,
    PractitionerStatsResponse,
    RecentActivityItem,
    UserStatsResponse,
)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


async def get_admin_stats(db: AsyncSession) -> AdminStatsResponse:
    since = _utc_now() - timedelta(days=7)

    # Counts
    result = await db.execute(select(func.count()).select_from(User))
    total_users = result.scalar() or 0

    result = await db.execute(
        select(func.count()).select_from(Practitioner).where(Practitioner.practitioner_type == "GENERAL")
    )
    total_practitioners = result.scalar() or 0

    result = await db.execute(
        select(func.count()).select_from(Practitioner).where(Practitioner.practitioner_type == "SPECIALIST")
    )
    total_specialists = result.scalar() or 0

    result = await db.execute(select(func.count()).select_from(Consultation))
    total_consultations = result.scalar() or 0

    result = await db.execute(select(func.count()).select_from(Image))
    total_images = result.scalar() or 0

    result = await db.execute(select(func.count()).select_from(Patient))
    total_patients = result.scalar() or 0

    result = await db.execute(
        select(func.count()).select_from(Practitioner).where(Practitioner.approval_status == "PENDING")
    )
    pending_approvals = result.scalar() or 0

    result = await db.execute(
        select(func.count()).select_from(Consultation).where(Consultation.urgency == "URGENT")
    )
    urgent_cases = result.scalar() or 0

    # Recent activity: last 7 days consultations and new users
    recent_activity: list[RecentActivityItem] = []
    cons_result = await db.execute(
        select(Consultation)
        .where(Consultation.created_at >= since)
        .order_by(Consultation.created_at.desc())
        .limit(10)
    )
    for c in cons_result.scalars().all():
        recent_activity.append(
            RecentActivityItem(
                kind="consultation",
                id=c.consultation_id,
                summary=f"Consultation created",
                at=c.created_at,
            )
        )
    user_result = await db.execute(
        select(User).where(User.created_at >= since).order_by(User.created_at.desc()).limit(5)
    )
    for u in user_result.scalars().all():
        recent_activity.append(
            RecentActivityItem(kind="user", id=u.user_id, summary=f"User registered: {u.email}", at=u.created_at)
        )
    recent_activity.sort(key=lambda x: x.at, reverse=True)
    recent_activity = recent_activity[:15]

    return AdminStatsResponse(
        total_users=total_users,
        total_practitioners=total_practitioners,
        total_specialists=total_specialists,
        total_consultations=total_consultations,
        total_images=total_images,
        total_patients=total_patients,
        pending_approvals=pending_approvals,
        urgent_cases=urgent_cases,
        recent_activity=recent_activity,
    )


async def get_practitioner_stats(practitioner_id: UUID, db: AsyncSession) -> PractitionerStatsResponse:
    result = await db.execute(
        select(func.count()).select_from(ClinicalReview).where(ClinicalReview.practitioner_id == practitioner_id)
    )
    my_reviews = result.scalar() or 0

    # Consultations that are OPEN or IN_REVIEW (all, for "pending" workload)
    result = await db.execute(
        select(func.count())
        .select_from(Consultation)
        .where(Consultation.status.in_(["OPEN", "IN_REVIEW"]))
    )
    pending_consultations = result.scalar() or 0

    result = await db.execute(
        select(func.count()).select_from(Consultation).where(Consultation.urgency == "URGENT")
    )
    urgent_cases = result.scalar() or 0

    # Distinct patients from consultations this practitioner has reviewed
    result = await db.execute(
        select(func.count(distinct(Consultation.patient_id)))
        .select_from(ClinicalReview)
        .join(Consultation, ClinicalReview.consultation_id == Consultation.consultation_id)
        .where(ClinicalReview.practitioner_id == practitioner_id)
    )
    patients_seen = result.scalar() or 0

    return PractitionerStatsResponse(
        my_reviews=my_reviews,
        pending_consultations=pending_consultations,
        urgent_cases=urgent_cases,
        patients_seen=patients_seen,
        avg_response_time_hours=None,
    )


async def get_user_stats(user_id: UUID, db: AsyncSession) -> UserStatsResponse:
    result = await db.execute(
        select(func.count()).select_from(Consultation).where(Consultation.created_by == user_id)
    )
    my_consultations = result.scalar() or 0

    result = await db.execute(
        select(func.count()).select_from(Image).where(Image.uploaded_by == user_id, Image.source == "QUICK_SCAN")
    )
    my_scans = result.scalar() or 0

    result = await db.execute(
        select(func.count())
        .select_from(Consultation)
        .where(Consultation.created_by == user_id, Consultation.status == "OPEN")
    )
    pending_results = result.scalar() or 0

    result = await db.execute(
        select(func.count())
        .select_from(Consultation)
        .where(Consultation.created_by == user_id, Consultation.urgency == "URGENT")
    )
    urgent_alerts = result.scalar() or 0

    return UserStatsResponse(
        my_consultations=my_consultations,
        my_scans=my_scans,
        pending_results=pending_results,
        urgent_alerts=urgent_alerts,
    )
