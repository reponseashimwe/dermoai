from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_practitioner, get_current_user
from app.models.consultation import Consultation
from app.models.practitioner import Practitioner
from app.models.user import User
from app.schemas.clinical_review import ClinicalReviewCreate, ClinicalReviewRead
from app.services import clinical_review_service

router = APIRouter(prefix="/api/clinical-reviews", tags=["clinical-reviews"])


@router.post("/", response_model=ClinicalReviewRead, status_code=201)
async def create_review(
    data: ClinicalReviewCreate,
    practitioner: Annotated[Practitioner, Depends(get_current_active_practitioner)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await clinical_review_service.create_review(
        data,
        practitioner.practitioner_id,
        practitioner.practitioner_type,
        practitioner.approval_status,
        db,
    )


@router.get(
    "/consultation/{consultation_id}", response_model=list[ClinicalReviewRead]
)
async def list_reviews_for_consultation(
    consultation_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    # Practitioners and admins can list any consultation's reviews
    if current_user.role in ("PRACTITIONER", "ADMIN"):
        return await clinical_review_service.list_for_consultation(
            consultation_id, db
        )
    # Patients may only list reviews for their own consultations
    result = await db.execute(
        select(Consultation).where(
            Consultation.consultation_id == consultation_id
        )
    )
    consultation = result.scalar_one_or_none()
    if not consultation or consultation.created_by != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found",
        )
    return await clinical_review_service.list_for_consultation(
        consultation_id, db
    )


@router.get("/{review_id}", response_model=ClinicalReviewRead)
async def get_review(
    review_id: UUID,
    _practitioner: Annotated[Practitioner, Depends(get_current_active_practitioner)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await clinical_review_service.get_review(review_id, db)
