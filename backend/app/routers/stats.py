from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.schemas.stats import AdminStatsResponse, PractitionerStatsResponse, UserStatsResponse
from app.services import stats_service
from app.services.practitioner_service import get_practitioner_by_user_id

router = APIRouter(prefix="/api/stats", tags=["stats"])


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
