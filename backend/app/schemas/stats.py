from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class RecentActivityItem(BaseModel):
    kind: str  # "consultation" | "user" | "review" | "image"
    id: UUID
    summary: str
    at: datetime


class DispositionStats(BaseModel):
    treated_locally: int
    telemedicine_only: int
    referred_to_clinic: int
    not_set: int


class LocationStats(BaseModel):
    district: str
    count: int


class ConsentStats(BaseModel):
    consented: int
    not_consented: int
    total: int


class OutcomeByDisposition(BaseModel):
    disposition: str
    total: int
    verified: int
    got_treatment: int


class ConfidenceTrendPoint(BaseModel):
    week: str
    avg_confidence: float
    count: int


class ConfidenceDistribution(BaseModel):
    low: int  # < 0.4
    medium: int  # 0.4-0.6
    good: int  # 0.6-0.8
    high: int  # > 0.8


class ModelPerformanceStats(BaseModel):
    total_predictions: int
    avg_confidence: float
    confidence_trend: list[ConfidenceTrendPoint]
    low_confidence_count: int
    confidence_distribution: ConfidenceDistribution


class TelemedStatusBreakdown(BaseModel):
    completed: int
    pending: int
    active: int


class TelemedStats(BaseModel):
    teleconsultations_total: int
    appointments_total: int
    status: TelemedStatusBreakdown


class TopCondition(BaseModel):
    name: str
    count: int


class AdminStatsResponse(BaseModel):
    total_users: int
    total_practitioners: int
    total_specialists: int
    total_consultations: int
    total_images: int
    total_patients: int
    quick_scan_count: int
    pending_approvals: int
    urgent_cases: int
    recent_activity: list[RecentActivityItem] = []
    disposition_stats: DispositionStats
    location_stats: list[LocationStats]
    consent_stats: ConsentStats
    outcome_by_disposition: list[OutcomeByDisposition]
    model_stats: ModelPerformanceStats
    telemed_stats: TelemedStats
    top_conditions: list[TopCondition] = []


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
