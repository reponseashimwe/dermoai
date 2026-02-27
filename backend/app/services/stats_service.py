from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import case, distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clinical_review import ClinicalReview
from app.models.consultation import Consultation
from app.models.image import Image
from app.models.patient import Patient
from app.models.practitioner import Practitioner
from app.models.user import User
from app.schemas.stats import (
    AdminStatsResponse,
    ConsentStats,
    ConfidenceDistribution,
    ConfidenceTrendPoint,
    DispositionStats,
    LocationStats,
    ModelPerformanceStats,
    OutcomeByDisposition,
    PractitionerStatsResponse,
    RecentActivityItem,
    UserStatsResponse,
)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


async def _calculate_model_performance_stats(db: AsyncSession) -> ModelPerformanceStats:
    """Calculate ML model performance metrics from consultations."""
    # Total predictions (consultations with predicted conditions)
    result = await db.execute(
        select(func.count())
        .select_from(Consultation)
        .where(Consultation.final_predicted_condition.isnot(None))
    )
    total_predictions = result.scalar() or 0

    # Average confidence
    result = await db.execute(
        select(func.avg(Consultation.final_confidence))
        .select_from(Consultation)
        .where(Consultation.final_confidence.isnot(None))
    )
    avg_confidence = result.scalar() or 0.0

    # Confidence trend (last 8 weeks) — use single expression for GROUP BY to avoid PostgreSQL GroupingError
    eight_weeks_ago = _utc_now() - timedelta(weeks=8)
    week_trunc = func.date_trunc("week", Consultation.created_at)
    trend_result = await db.execute(
        select(
            week_trunc.label("week"),
            func.avg(Consultation.final_confidence).label("avg_confidence"),
            func.count().label("count"),
        )
        .where(
            Consultation.created_at >= eight_weeks_ago,
            Consultation.final_confidence.isnot(None),
        )
        .group_by(week_trunc)
        .order_by(week_trunc)
    )
    confidence_trend = [
        ConfidenceTrendPoint(
            week=row.week.strftime("%Y-%m-%d") if row.week else "Unknown",
            avg_confidence=float(row.avg_confidence or 0.0),
            count=row.count,
        )
        for row in trend_result
    ]

    # Low confidence count (< 0.6)
    result = await db.execute(
        select(func.count())
        .select_from(Consultation)
        .where(Consultation.final_confidence < 0.6)
    )
    low_confidence_count = result.scalar() or 0

    # Confidence distribution
    result = await db.execute(
        select(Consultation.final_confidence)
        .where(Consultation.final_confidence.isnot(None))
    )
    confidences = [row[0] for row in result.all()]
    
    low = sum(1 for c in confidences if c < 0.4)
    medium = sum(1 for c in confidences if 0.4 <= c < 0.6)
    good = sum(1 for c in confidences if 0.6 <= c < 0.8)
    high = sum(1 for c in confidences if c >= 0.8)

    confidence_distribution = ConfidenceDistribution(
        low=low,
        medium=medium,
        good=good,
        high=high,
    )

    return ModelPerformanceStats(
        total_predictions=total_predictions,
        avg_confidence=float(avg_confidence),
        confidence_trend=confidence_trend,
        low_confidence_count=low_confidence_count,
        confidence_distribution=confidence_distribution,
    )


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

    result = await db.execute(
        select(func.count()).select_from(Image).where(Image.source == "QUICK_SCAN")
    )
    quick_scan_count = result.scalar() or 0

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

    # Disposition statistics
    disp_result = await db.execute(
        select(Consultation.disposition, func.count().label("count"))
        .select_from(Consultation)
        .group_by(Consultation.disposition)
    )
    disp_data = {row.disposition or "not_set": row.count for row in disp_result}
    disposition_stats = DispositionStats(
        treated_locally=disp_data.get("TREATED_LOCALLY", 0),
        telemedicine_only=disp_data.get("TELEMEDICINE_ONLY", 0),
        referred_to_clinic=disp_data.get("REFERRED_TO_CLINIC", 0),
        not_set=disp_data.get("not_set", 0),
    )

    # Location statistics (top 10 districts)
    location_result = await db.execute(
        select(Patient.district, func.count().label("count"))
        .where(Patient.district.isnot(None))
        .group_by(Patient.district)
        .order_by(func.count().desc())
        .limit(10)
    )
    location_stats = [
        LocationStats(district=row.district, count=row.count)
        for row in location_result
    ]

    # Consent statistics
    consent_result = await db.execute(
        select(Image.consent_to_reuse, func.count().label("count"))
        .select_from(Image)
        .group_by(Image.consent_to_reuse)
    )
    consent_data = {row.consent_to_reuse: row.count for row in consent_result}
    consent_total = sum(consent_data.values())
    consent_stats = ConsentStats(
        consented=consent_data.get(True, 0),
        not_consented=consent_data.get(False, 0),
        total=consent_total,
    )

    # Outcome by disposition
    outcome_result = await db.execute(
        select(
            Consultation.disposition,
            func.count().label("total"),
            func.sum(case((Consultation.outcome_verified.is_(True), 1), else_=0)).label("verified"),
            func.sum(case((Consultation.got_treatment.is_(True), 1), else_=0)).label("got_treatment"),
        )
        .where(Consultation.disposition.isnot(None))
        .group_by(Consultation.disposition)
    )
    outcome_by_disposition = [
        OutcomeByDisposition(
            disposition=row.disposition,
            total=row.total,
            verified=row.verified or 0,
            got_treatment=row.got_treatment or 0,
        )
        for row in outcome_result
    ]

    # Model performance stats
    model_stats = await _calculate_model_performance_stats(db)

    return AdminStatsResponse(
        total_users=total_users,
        total_practitioners=total_practitioners,
        total_specialists=total_specialists,
        total_consultations=total_consultations,
        total_images=total_images,
        total_patients=total_patients,
        quick_scan_count=quick_scan_count,
        pending_approvals=pending_approvals,
        urgent_cases=urgent_cases,
        recent_activity=recent_activity,
        disposition_stats=disposition_stats,
        location_stats=location_stats,
        consent_stats=consent_stats,
        outcome_by_disposition=outcome_by_disposition,
        model_stats=model_stats,
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
