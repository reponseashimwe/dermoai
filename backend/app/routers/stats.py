from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.patient import Patient
from app.models.image import Image
from app.models.practitioner import Practitioner
from app.schemas.stats import AdminStatsResponse, PractitionerStatsResponse, UserStatsResponse
from app.services import stats_service
from app.services.practitioner_service import get_practitioner_by_user_id

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/public", response_model=dict)
async def public_stats(db: Annotated[AsyncSession, Depends(get_db)]):
    """Get public statistics (no auth required) for homepage."""
    # Total patients
    result = await db.execute(select(func.count()).select_from(Patient))
    total_patients = result.scalar() or 0
    
    # Total images analyzed
    result = await db.execute(select(func.count()).select_from(Image))
    total_images = result.scalar() or 0
    
    # Number of specialists
    result = await db.execute(
        select(func.count())
        .select_from(Practitioner)
        .where(Practitioner.practitioner_type == "SPECIALIST")
    )
    total_specialists = result.scalar() or 0
    
    # Count unique districts with patients
    result = await db.execute(
        select(func.count(func.distinct(Patient.district)))
        .where(Patient.district.isnot(None))
    )
    districts_served = result.scalar() or 0
    
    return {
        "patients_served": total_patients,
        "images_analyzed": total_images,
        "specialists": total_specialists,
        "districts_served": districts_served,
    }


@router.get("/admin", response_model=AdminStatsResponse)
async def admin_stats(
    _user: Annotated[User, Depends(require_role("ADMIN"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Dashboard statistics for admin: users, practitioners, consultations, images, patients, pending approvals, urgent cases, recent activity."""
    return await stats_service.get_admin_stats(db)


@router.get("/practitioner", response_model=PractitionerStatsResponse)
async def practitioner_stats(
    current_user: Annotated[User, Depends(require_role("PRACTITIONER"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Dashboard statistics for practitioner: my reviews, pending consultations, urgent cases, patients seen."""
    practitioner = await get_practitioner_by_user_id(current_user.user_id, db)
    if not practitioner:
        return PractitionerStatsResponse(
            my_reviews=0,
            pending_consultations=0,
            urgent_cases=0,
            patients_seen=0,
            avg_response_time_hours=None,
        )
    return await stats_service.get_practitioner_stats(practitioner.practitioner_id, db)


@router.get("/user", response_model=UserStatsResponse)
async def user_stats(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Dashboard statistics for regular user: my consultations, my scans, pending results, urgent alerts."""
    return await stats_service.get_user_stats(current_user.user_id, db)


@router.get("/ml-metrics", response_model=dict)
async def ml_metrics(
    _user: Annotated[User, Depends(require_role("ADMIN"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Machine Learning model metrics for Ministry of Health (super admin) dashboard.

    Returns:
        - Prediction distribution by condition
        - Confidence distribution (high/medium/low)
        - Uncertain predictions (confidence < 0.45)
        - Triage decision breakdown (REFER vs MANAGE LOCALLY)
        - Model version and date
        - Recent prediction trends
    """
    from app.services import ml_service

    # Get all images with predictions
    result = await db.execute(
        select(Image)
        .where(Image.predicted_condition.isnot(None))
        .order_by(Image.uploaded_at.desc())
    )
    images = list(result.scalars().all())

    # Prediction distribution
    condition_counts = {}
    for img in images:
        condition = img.predicted_condition
        condition_counts[condition] = condition_counts.get(condition, 0) + 1

    # Confidence distribution
    confidence_bins = {"high": 0, "medium": 0, "low": 0, "uncertain": 0}
    for img in images:
        if img.confidence is None:
            continue
        if img.confidence >= 0.8:
            confidence_bins["high"] += 1
        elif img.confidence >= 0.6:
            confidence_bins["medium"] += 1
        elif img.confidence >= 0.45:
            confidence_bins["low"] += 1
        else:
            confidence_bins["uncertain"] += 1

    # Uncertain predictions (need manual review)
    uncertain_predictions = [
        {
            "image_id": str(img.image_id),
            "condition": img.predicted_condition,
            "confidence": img.confidence,
            "uploaded_at": img.uploaded_at.isoformat(),
        }
        for img in images
        if img.confidence and img.confidence < 0.45
    ][:20]  # Limit to 20 most recent

    # Triage decision breakdown (REFER vs MANAGE LOCALLY)
    triage_counts = {"REFER": 0, "MANAGE LOCALLY": 0}
    for img in images:
        if img.predicted_condition:
            urgency = ml_service.TRIAGE_MAPPING.get(img.predicted_condition, "REFER")
            triage_counts[urgency] = triage_counts.get(urgency, 0) + 1

    # Average confidence by condition
    condition_confidences = {}
    condition_image_counts = {}
    for img in images:
        if img.predicted_condition and img.confidence is not None:
            condition = img.predicted_condition
            if condition not in condition_confidences:
                condition_confidences[condition] = []
            condition_confidences[condition].append(img.confidence)
            condition_image_counts[condition] = (
                condition_image_counts.get(condition, 0) + 1
            )

    avg_confidence_by_condition = {
        condition: round(sum(confidences) / len(confidences), 4)
        for condition, confidences in condition_confidences.items()
    }

    return {
        "model_version": ml_service.MODEL_VERSION,
        "model_date": ml_service.MODEL_DATE,
        "total_predictions": len(images),
        "condition_distribution": condition_counts,
        "confidence_distribution": confidence_bins,
        "triage_decision_breakdown": triage_counts,
        "avg_confidence_by_condition": avg_confidence_by_condition,
        "uncertain_predictions": uncertain_predictions,
        "class_names": ml_service.CLASS_NAMES,
        "triage_mapping": ml_service.TRIAGE_MAPPING,
    }
