// User
export interface User {
  user_id: string;
  name: string;
  email: string;
  phone_number: string | null;
  role: "USER" | "PRACTITIONER" | "ADMIN";
  is_active: boolean;
  created_at: string;
}

export interface UserUpdate {
  name?: string;
  email?: string;
  phone_number?: string;
}

// Auth
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone_number?: string;
  role: string;
  practitioner_type?: string;
  expertise?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

// Patient
export interface Patient {
  patient_id: string;
  user_id: string | null;
  name: string;
  phone_number: string | null;
  district: string | null;
  province: string | null;
  created_at: string;
}

export interface PatientCreate {
  name: string;
  phone_number?: string;
  user_id?: string;
  district?: string;
  province?: string;
}

export interface PatientUpdate {
  name?: string;
  phone_number?: string;
  district?: string;
  province?: string;
}

// Consultation
export interface Consultation {
  consultation_id: string;
  patient_id: string;
  created_by: string;
  final_predicted_condition: string | null;
  final_confidence: number | null;
  urgency: string | null;
  status: "OPEN" | "IN_REVIEW" | "CLOSED";
  disposition: string | null;
  referral_note: string | null;
  got_treatment: boolean | null;
  outcome_verified: boolean | null;
  created_at: string;
  has_appointments?: boolean;
}

export interface ConsultationCreate {
  patient_id: string;
}

export interface ConsultationUpdate {
  status?: string;
  disposition?: string;
  referral_note?: string;
  got_treatment?: boolean;
  outcome_verified?: boolean;
}

// Image
export interface Image {
  image_id: string;
  consultation_id: string | null;
  uploaded_by: string | null;
  image_url: string;
  storage_key: string;
  predicted_condition: string | null;
  confidence: number | null;
  reviewed_label: string | null;
  reviewed_as_final: boolean;
  uploaded_at: string;
  file_size: number | null;
  source: string;
  allowed_review: boolean;
  consent_to_reuse: boolean;
  all_probabilities?: Record<string, number>;
  model_version?: string;
  triage_stage?: string;
  gradcam_base64?: string;
  gradcam_metrics?: GradCAMMetrics;
}

export interface ImageUploadResponse {
  image_id: string;
  image_url: string;
  predicted_condition: string | null;
  confidence: number | null;
  all_probabilities?: Record<string, number>;
  model_version?: string;
  triage_stage?: string;
  gradcam_base64?: string;
  gradcam_metrics?: GradCAMMetrics;
}

export interface GradCAMMetrics {
  peak_activation_location: {
    x: number;
    y: number;
    normalized_x: number;
    normalized_y: number;
  };
  peak_intensity: number;
  mean_activation: number;
  activation_area: number;
}

export interface QuickScanResponse {
  image_id: string;
  image_url: string;
  predicted_condition: string;
  confidence: number;
  urgency: "URGENT" | "NON_URGENT" | "REFER" | "MANAGE LOCALLY";
  consent_to_reuse: boolean;
  all_probabilities?: Record<string, number>;
  model_version?: string;
  model_date?: string;
  triage_stage?: "STAGE_1_LOW_CONFIDENCE" | "STAGE_2_REFER_OVERRIDE" | "NORMAL_PREDICTION";
  gradcam_base64?: string;
  gradcam_metrics?: GradCAMMetrics;
}

export interface AttachImageRequest {
  consultation_id: string;
}

export interface ImageListResponse {
  items: Image[];
  total: number;
}

// Clinical Review
export interface ClinicalReview {
  review_id: string;
  consultation_id: string;
  practitioner_id: string;
  practitioner_name: string | null;
  diagnosis: string;
  treatment_plan: string | null;
  notes: string | null;
  is_final: boolean;
  created_at: string;
}

export interface ClinicalReviewCreate {
  consultation_id: string;
  diagnosis: string;
  treatment_plan?: string;
  notes?: string;
  is_final?: boolean;
}

// Practitioner
export interface Practitioner {
  practitioner_id: string;
  user_id: string;
  practitioner_type: "GENERAL" | "SPECIALIST";
  approval_status: "PENDING" | "APPROVED" | "REJECTED";
  expertise: string | null;
  is_active: boolean;
  is_online?: boolean;
  last_active?: string | null;
  created_at: string;
}

export interface PractitionerAvailable extends Practitioner {
  name: string;
  email: string;
}

export interface PractitionerUpdate {
  expertise?: string;
}

export interface PractitionerStatusUpdate {
  is_online: boolean;
}

export interface ApprovalAction {
  approval_status: "APPROVED" | "REJECTED";
}

// Dashboard stats
export interface RecentActivityItem {
  kind: string;
  id: string;
  summary: string;
  at: string;
}

export interface DispositionStats {
  treated_locally: number;
  telemedicine_only: number;
  referred_to_clinic: number;
  not_set: number;
}

export interface LocationStats {
  district: string;
  count: number;
}

export interface ConsentStats {
  consented: number;
  not_consented: number;
  total: number;
}

export interface OutcomeByDisposition {
  disposition: string;
  total: number;
  verified: number;
  got_treatment: number;
}

export interface AdminStats {
  total_users: number;
  total_practitioners: number;
  total_specialists: number;
  total_consultations: number;
  total_images: number;
  total_patients: number;
  quick_scan_count: number;
  pending_approvals: number;
  urgent_cases: number;
  recent_activity: RecentActivityItem[];
  disposition_stats: DispositionStats;
  location_stats: LocationStats[];
  consent_stats: ConsentStats;
  outcome_by_disposition: OutcomeByDisposition[];
  model_stats: ModelPerformanceStats;
}

export interface ConfidenceTrendPoint {
  week: string;
  avg_confidence: number;
  count: number;
}

export interface ConfidenceDistribution {
  low: number;
  medium: number;
  good: number;
  high: number;
}

export interface ModelPerformanceStats {
  total_predictions: number;
  avg_confidence: number;
  confidence_trend: ConfidenceTrendPoint[];
  low_confidence_count: number;
  confidence_distribution: ConfidenceDistribution;
}

export interface PractitionerStats {
  my_reviews: number;
  pending_consultations: number;
  urgent_cases: number;
  patients_seen: number;
  avg_response_time_hours: number | null;
}

export interface UserStats {
  my_consultations: number;
  my_scans: number;
  pending_results: number;
  urgent_alerts: number;
}

// Notification
export interface Notification {
  notification_id: string;
  consultation_id: string | null;
  recipient_id: string;
  message: string;
  status: string;
  sent_at: string | null;
}

// Retraining Log
export interface RetrainingLog {
  log_id: string;
  retrained_at: string;
  dataset_size: number;
  accuracy: number | null;
  model_version: string;
}

export interface RetrainingLogCreate {
  dataset_size: number;
  accuracy?: number;
  model_version: string;
}
