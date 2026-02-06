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
  created_at: string;
}

export interface PatientCreate {
  name: string;
  phone_number?: string;
  user_id?: string;
}

export interface PatientUpdate {
  name?: string;
  phone_number?: string;
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
  created_at: string;
}

export interface ConsultationCreate {
  patient_id: string;
}

export interface ConsultationUpdate {
  status?: string;
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
  uploaded_at: string;
  file_size: number | null;
  source: string;
  allowed_review: boolean;
  consent_to_reuse: boolean;
}

export interface ImageUploadResponse {
  image_id: string;
  image_url: string;
  predicted_condition: string | null;
  confidence: number | null;
}

export interface QuickScanResponse {
  image_id: string;
  image_url: string;
  predicted_condition: string;
  confidence: number;
  urgency: "URGENT" | "NON_URGENT";
  consent_to_reuse: boolean;
}

export interface AttachImageRequest {
  consultation_id: string;
}

// Clinical Review
export interface ClinicalReview {
  review_id: string;
  consultation_id: string;
  practitioner_id: string;
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
  created_at: string;
}

export interface PractitionerUpdate {
  expertise?: string;
}

export interface ApprovalAction {
  approval_status: "APPROVED" | "REJECTED";
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
