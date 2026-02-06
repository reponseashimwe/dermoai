from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_active_practitioner
from app.models.practitioner import Practitioner
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
    _practitioner: Annotated[Practitioner, Depends(get_current_active_practitioner)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await clinical_review_service.list_for_consultation(consultation_id, db)


@router.get("/{review_id}", response_model=ClinicalReviewRead)
async def get_review(
    review_id: UUID,
    _practitioner: Annotated[Practitioner, Depends(get_current_active_practitioner)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await clinical_review_service.get_review(review_id, db)
