from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class RecentActivityItem(BaseModel):
    kind: str  # "consultation" | "user" | "review" | "image"
    id: UUID
    summary: str
    at: datetime


class AdminStatsResponse(BaseModel):
    total_users: int
    total_practitioners: int
    total_specialists: int
    total_consultations: int
    total_images: int
    total_patients: int
    pending_approvals: int
    urgent_cases: int
    recent_activity: list[RecentActivityItem] = []


class PractitionerStatsResponse(BaseModel):
    my_reviews: int
    pending_consultations: int
    urgent_cases: int
    patients_seen: int
    avg_response_time_hours: float | None = None


class UserStatsResponse(BaseModel):
    my_consultations: int
    my_scans: int
    pending_results: int
    urgent_alerts: int
