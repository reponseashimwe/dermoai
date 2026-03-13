# DermoAI — Project Documentation & Report

**Version:** 1.0.0
**Last updated:** March 2026

---

## 1. Project Overview

### 1.1 What is DermoAI?

**DermoAI** is an AI-assisted dermatological triage framework designed for **resource-limited settings in Rwanda**. It addresses a known problem: existing dermatology AI often performs 30–40% worse on **Fitzpatrick Skin Types (FST) V–VI** (darker skin tones). The system is built to:

- Classify skin images into clinically meaningful condition categories.
- Map predictions to **URGENT** vs **NON_URGENT** triage for referral decisions.
- Support a full clinical workflow: quick scan → consultation → specialist review → appointment booking → teleconsultation.

### 1.2 Core Design

**Two-stage classification:**

1. **Condition classification** — A **MobileNetV2** CNN (Keras) classifies skin images into condition classes (trained on FST V–VI data).
2. **Rule-based urgency mapping** — Predicted condition + confidence (and a two-stage triage logic) determine URGENT or NON_URGENT. Low-confidence predictions or refer-override cases escalate to REFER.

**Tech stack:**

| Layer        | Technology |
|-------------|------------|
| **ML / Data** | Python, TensorFlow/Keras, Fitzpatrick17k + ISIC (FST V–VI), Jupyter notebooks |
| **Backend**   | FastAPI, PostgreSQL (async/asyncpg), SQLAlchemy, Cloudinary (images), LiveKit (video), JWT auth |
| **Frontend**  | Next.js 16 (TypeScript), App Router, React Query, Tailwind v4, PWA-capable |
| **Auth**      | JWT HS256 (access + refresh), role-based: ADMIN, PRACTITIONER, USER |

**Live deployment:**
- Frontend (Vercel): https://dermo.vercel.app/
- Backend API (Render): https://dermoai-24lz.onrender.com
- Swagger UI: https://dermoai-24lz.onrender.com/docs

---

## 2. Data & ML Pipeline

### 2.1 Data Sources

- **Fitzpatrick17k** — ~16,577 images; FST V–VI subset used for training.
- **ISIC Archive** — ~549,590 images; ~1,574 with FST V–VI labels used for representation analysis.

Large assets (`data/raw/*/images/`, `isic_metadata.csv`) are not in git; available via Google Drive.

### 2.2 Data Scripts (`src/data/`)

| Script | Purpose |
|--------|---------|
| **`download.py`** | Ingests Fitzpatrick17k and/or ISIC with retry/backoff. |
| **`filter.py`** | Verifies FST V–VI labels using ITA score (LAB color space) and luminance. Outputs High/Medium/Low confidence tiers. |
| **`augmentation.py`** | Data augmentation reference. |
| **`preprocess.py`** | Preprocessing pipeline. |

### 2.3 Notebooks (`notebooks/`)

| Notebook | Purpose | Outputs |
|----------|---------|---------|
| **`01_data_exploration.ipynb`** | EDA: dataset integrity, label distribution, FST V vs VI, class imbalance, augmentation needs. | `results/eda/` |
| **`02_condition_classification_strategy.ipynb`** | Defines the condition taxonomy (112 diagnoses → condition classes). | `results/classification/` |
| **`03_data_augmentation.ipynb`** | Augmentation strategy: HorizontalFlip, VerticalFlip, Rotate ±15°, RandomBrightnessContrast. | `results/augmentation/augmentation_report.json` |
| **`04_model_training.ipynb`** | MobileNetV2 training with focal loss (α=0.5, γ=2.0), two-phase fine-tuning, malignant threshold. | `models/final/best_model.keras`, `class_names.json` |

### 2.4 ML Model (current: v2.0, 2026-03-05)

- **Architecture:** MobileNetV2, input 224×224 RGB
- **Two-stage triage logic:**
  - Confidence < 0.45 → `STAGE_1_LOW_CONFIDENCE` → REFER
  - Confidence ≥ 0.45 but refer-condition confidence > 0.6 → `STAGE_2_REFER_OVERRIDE` → REFER
  - Otherwise → condition-based mapping from `triage_mapping.json`
- **GradCAM:** Optional explainability overlay on predictions
- **Model files:** `models/final/best_model.keras`, `models/final/class_names.json`, `models/final/triage_mapping.json`

---

## 3. Backend (FastAPI)

### 3.1 Overview

- **Entry:** `backend/app/main.py` — `create_app()`, lifespan: run migrations → seed DB → configure Cloudinary → seed predefined conditions.
- **Database:** PostgreSQL via **asyncpg**; async SQLAlchemy ORM; migrations via Alembic.
- **Auth:** JWT access + refresh tokens. Roles: **ADMIN**, **PRACTITIONER** (GP or SPECIALIST), **USER**.
- **Health check:** `GET /health` → `{"status": "healthy"}`.

### 3.2 Database Models

| Model | Key Fields | Notes |
|-------|-----------|-------|
| **User** | user_id, name, email, phone_number, password_hash, role, is_active | Roles: USER / PRACTITIONER / ADMIN |
| **Practitioner** | practitioner_id, user_id, practitioner_type, approval_status, expertise, is_online, last_active | Types: GP / SPECIALIST; approval: PENDING / APPROVED / REJECTED |
| **Patient** | patient_id, user_id (optional), name, phone_number, district, province | Can be linked to a user account |
| **Consultation** | consultation_id, patient_id, created_by, final_predicted_condition, final_confidence, urgency, status, disposition, got_treatment, outcome_verified | Status: OPEN / CLOSED; Disposition: TREATED_LOCALLY / TELEMEDICINE_ONLY / REFERRED_TO_CLINIC |
| **Image** | image_id, consultation_id (opt), uploaded_by, image_url, storage_key, predicted_condition, confidence, triage_stage, reviewed_label, reviewed_by, source, allowed_review, consent_to_reuse | Source: QUICK_SCAN / CONSULTATION |
| **ClinicalReview** | review_id, consultation_id, practitioner_id, diagnosis, treatment_plan, notes, is_final | Practitioner writes diagnosis & treatment |
| **AppointmentRequest** | request_id, consultation_id (opt), requested_by_user_id, specialist_id, proposed_datetime, status, specialist_proposed_datetime, notes, rejection_reason | Status: PENDING / APPROVED / REJECTED / RESCHEDULED / COMPLETED |
| **Teleconsultation** | teleconsultation_id, consultation_id (opt), practitioner_id, requested_by_user_id, specialist_id, livekit_room_name, status, started_at, ended_at, duration_seconds | LiveKit-backed video call |
| **Notification** | notification_id, consultation_id, recipient_id, message, status | Status: PENDING / SENT |
| **Condition** | condition_id, condition_name (unique), category, is_predefined | Seeded at startup; also user-creatable |
| **RetrainingLog** | log_id, retrained_at, dataset_size, accuracy, model_version | Admin-only ML audit trail |
| **ConsentPin** | pin_id, consultation_id, pin_code (6-digit), phone_number, created_at, expires_at (10 min), verified, verified_at | SMS-based consent verification |

---

### 3.3 API Reference

All routes are prefixed `/api/`. Auth tokens are passed as `Authorization: Bearer <token>`. Role requirements: **any** = any authenticated user; **ADMIN** = admin role; **PRACTITIONER** = approved practitioner; **SPECIALIST** = approved specialist practitioner.

---

#### `/api/auth` — Authentication

| Method | Path | Auth | Request Body | Response | Description |
|--------|------|------|-------------|----------|-------------|
| POST | `/register` | None | `name`, `email`, `password`, `phone_number` (opt), `role` (USER/PRACTITIONER), `practitioner_type` (opt: GP/SPECIALIST), `expertise` (opt) | `access_token`, `refresh_token` | Create account. If PRACTITIONER, creates pending Practitioner record; unapproved practitioners receive a USER-role token until approved. |
| POST | `/login` | None | `email`, `password` | `access_token`, `refresh_token` | Verify credentials. Only APPROVED practitioners receive PRACTITIONER-role tokens. |
| POST | `/refresh` | None | `refresh_token` | `access_token`, `refresh_token` | Rotate tokens. Recomputes role (PRACTITIONER only if still APPROVED and active). |

---

#### `/api/users` — User Management

| Method | Path | Auth | Request | Response | Description |
|--------|------|------|---------|----------|-------------|
| GET | `/me` | any | — | `UserRead` | Current user profile. If practitioner is not APPROVED, returns role as "USER". |
| PUT | `/me` | any | `name`, `email`, `phone_number` | `UserRead` | Update own profile. |
| GET | `/` | ADMIN | — | `list[UserRead]` | List all users. |
| PUT | `/{user_id}/deactivate` | ADMIN | — | `UserRead` | Deactivate a user account (set `is_active=False`). |

---

#### `/api/practitioners` — Practitioner Management

| Method | Path | Auth | Query / Body | Response | Description |
|--------|------|------|-------------|----------|-------------|
| GET | `/available` | any | `practitioner_type` (opt), `online_only` (bool, default `true`) | `list[PractitionerAvailableRead]` | List available practitioners. Excludes current user. Enriches with name/email. |
| PUT | `/me/status` | PRACTITIONER | `is_online` (bool) | `PractitionerRead` | Toggle own online status; updates `last_active`. |
| GET | `/` | any | — | `list[PractitionerAvailableRead]` | List all practitioners with user info. |
| GET | `/pending` | ADMIN | — | `list[PractitionerAvailableRead]` | List practitioners with `approval_status=PENDING`. |
| GET | `/{practitioner_id}` | any | — | `PractitionerRead` | Practitioner detail. |
| PUT | `/{practitioner_id}` | any | `expertise` | `PractitionerRead` | Update practitioner expertise. |
| PUT | `/{practitioner_id}/approve` | ADMIN | `approval_status` (APPROVED/REJECTED) | `PractitionerRead` | Approve or reject practitioner. Approved practitioners can now log in with PRACTITIONER role. |

---

#### `/api/patients` — Patient Records

| Method | Path | Auth | Request | Response | Description |
|--------|------|------|---------|----------|-------------|
| POST | `/` | any | `name`, `phone_number`, `district`, `province`, `user_id` (opt) | `PatientRead` | Create patient. GPs create on behalf; patients create for themselves. |
| GET | `/me` | any | — | `PatientRead` | Patient record linked to current user. |
| GET | `/` | any | — | `list[PatientRead]` | List all patients (accessible to the user). |
| GET | `/{patient_id}` | any | — | `PatientRead` | Patient detail. |
| PUT | `/{patient_id}` | any | `name`, `phone_number`, `district`, `province` | `PatientRead` | Update patient info. |
| POST | `/{patient_id}/link` | any | `user_id` | `PatientRead` | Link an existing patient record to a user account. |

---

#### `/api/triage` — Quick Scan / Triage

| Method | Path | Auth | Request | Response | Description |
|--------|------|------|---------|----------|-------------|
| POST | `/scan` | **Optional** | multipart file, `consent_to_reuse` (bool), `include_gradcam` (bool, default `true`) | `QuickScanResponse` | **Public endpoint.** Upload image → Cloudinary → ML prediction (with optional GradCAM) → save `Image` (source=QUICK_SCAN). Returns `image_id`, `predicted_condition`, `confidence`, `urgency`, `triage_stage`, `gradcam_url`. Authenticated users have the image linked to their account. |
| GET | `/history` | any | — | `list[ImageRead]` | All quick-scan images uploaded by current authenticated user. |

---

#### `/api/consultations` — Consultation Workflow

| Method | Path | Auth | Request | Response | Description |
|--------|------|------|---------|----------|-------------|
| POST | `/` | any | `patient_id` | `ConsultationRead` | Create consultation. Sets `created_by` to current user. Status defaults to OPEN. |
| GET | `/` | any | — | `list[ConsultationRead]` | List consultations visible to user. Enriched with `has_appointments` and `has_teleconsultation` flags. |
| GET | `/{consultation_id}` | any | — | `ConsultationRead` | Consultation detail with `has_appointments`/`has_teleconsultation` flags. |
| GET | `/{consultation_id}/teleconsultations` | any | — | `list[TeleconsultationRead]` | Teleconsultations linked to this consultation. |
| PUT | `/{consultation_id}` | any | `status`, `disposition`, `referral_note`, `got_treatment`, `outcome_verified`, `urgency` | `ConsultationRead` | Update consultation metadata (status, outcome, disposition). |
| PATCH | `/{consultation_id}/images-consent` | any | `consent_to_reuse` (bool) | JSON | **Only creator (patient) can call.** Sets `consent_to_reuse` on all images in the consultation. |
| POST | `/{consultation_id}/request-consent-pin` | any | — | JSON | Generate a 6-digit PIN, send via SMS to patient's phone number. PIN expires in 10 minutes. Used to authorize image reuse consent. |
| POST | `/{consultation_id}/verify-consent-pin` | any | `pin` (string) | JSON | Verify the PIN. On success, sets `consent_to_reuse=True` on all images in the consultation. |
| POST | `/{consultation_id}/close` | any | — | `ConsultationRead` | Set `status=CLOSED`. |
| POST | `/{consultation_id}/reopen` | any | — | `ConsultationRead` | Set `status=OPEN`. |

---

#### `/api/images` — Image Management

| Method | Path | Auth | Request / Query | Response | Description |
|--------|------|------|----------------|----------|-------------|
| POST | `/upload` | any | multipart file, `consultation_id` (UUID), `include_gradcam` (bool, default `true`) | `ImageUploadResponse` | Upload image to consultation → Cloudinary → ML prediction (with GradCAM) → save Image (source=CONSULTATION, `allowed_review=true`) → re-aggregate ML results on consultation → notify if URGENT. Returns full prediction including `gradcam_url`. |
| POST | `/{image_id}/attach` | any | `consultation_id` | `ImageRead` | Attach an existing QUICK_SCAN image to a consultation. Triggers ML re-aggregation and urgent notification if needed. |
| GET | `/unreviewed` | PRACTITIONER | `skip` (int ≥0), `limit` (1–100, default 20) | `ImageListResponse` | Paginated list of images with `allowed_review=true` and no `reviewed_label` (specialist review queue). |
| GET | `/reviewed` | PRACTITIONER | `skip`, `limit` | `ImageListResponse` | Paginated list of images with `reviewed_label` set. |
| GET | `/all` | ADMIN | `skip`, `limit`, `consultation_id`, `uploaded_by`, `date_from`, `date_to`, `consent_to_reuse` | `ImageListResponse` | All images with optional filters. Admin only. |
| GET | `/consultation/{consultation_id}` | any | — | `list[ImageRead]` | All images in a consultation. |
| GET | `/{image_id}` | any | `include_gradcam` (bool, default `true`) | `ImageRead` | Image detail with optional GradCAM regeneration. |
| PATCH | `/{image_id}` | SPECIALIST | `reviewed_label` (string) | `ImageRead` | Set specialist-reviewed label on image. Stores `reviewer_id`. Specialists only. |
| PATCH | `/{image_id}/consent` | any | `consent_to_reuse` (bool) | `ImageRead` | Update image reuse consent. Only the image owner can modify. |
| DELETE | `/{image_id}` | any | — | 204 | Delete image from Cloudinary and database. |

---

#### `/api/clinical-reviews` — Clinical Reviews

| Method | Path | Auth | Request | Response | Description |
|--------|------|------|---------|----------|-------------|
| POST | `/` | PRACTITIONER | `consultation_id`, `diagnosis`, `treatment_plan`, `notes`, `is_final` (bool) | `ClinicalReviewRead` | Create clinical review for a consultation. Requires active approved practitioner. |
| GET | `/consultation/{consultation_id}` | any | — | `list[ClinicalReviewRead]` | Reviews for a consultation. Access control: practitioners/admins see all; patients see only their own consultation's reviews. |
| GET | `/{review_id}` | PRACTITIONER | — | `ClinicalReviewRead` | Review detail. |
| PUT | `/{review_id}` | PRACTITIONER | `diagnosis`, `treatment_plan`, `notes`, `is_final` | `ClinicalReviewRead` | Update review. |

---

#### `/api/appointments` — Appointment Requests

| Method | Path | Auth | Request / Query | Response | Description |
|--------|------|------|----------------|----------|-------------|
| POST | `/request` | any | `consultation_id`, `specialist_id`, `proposed_datetime`, `notes` | `AppointmentRequestRead` | Request appointment with a specialist. Sends SMS notification to specialist (non-blocking). |
| GET | `/my-requests` | any | — | `list[AppointmentRequestRead]` | All outgoing appointment requests made by current user. Enriched with `specialist_name` and `requester_name`. |
| GET | `/incoming` | SPECIALIST | — | `list[AppointmentRequestRead]` | Incoming appointment requests for current specialist. |
| GET | `/pending-count` | PRACTITIONER | — | `{count: int}` | Count of pending requests for current specialist (0 if not a specialist). |
| GET | `/upcoming` | any | `consultation_id` (UUID, opt query param) | `list[AppointmentRequestRead]` | Approved upcoming appointments, optionally filtered by consultation. |
| GET | `/for-my-consultations` | any | — | `list[AppointmentRequestRead]` | All appointment requests across consultations visible to current user. |
| POST | `/{request_id}/start-call` | any | — | `{teleconsultation_id}` | Get or create the LiveKit teleconsultation room for this appointment. Sends SMS to both parties (non-blocking). |
| PATCH | `/{request_id}/approve` | SPECIALIST | — | `AppointmentRequestRead` | Approve appointment. Sets `status=APPROVED`. Sends SMS to requester (non-blocking). |
| PATCH | `/{request_id}/reject` | SPECIALIST | `rejection_reason` (string) | `AppointmentRequestRead` | Reject with reason. Sets `status=REJECTED`. Sends SMS to requester (non-blocking). |
| PATCH | `/{request_id}/propose-time` | SPECIALIST | `specialist_proposed_datetime` | `AppointmentRequestRead` | Propose alternative time. Sets `status=RESCHEDULED`. |
| PATCH | `/{request_id}/complete` | any | — | `AppointmentCompleteResponse` | Mark appointment `status=COMPLETED`. Validates user has access to related consultation. |
| DELETE | `/{request_id}` | any | — | 204 | Delete appointment request. Only the requester can delete. |

---

#### `/api/teleconsultations` — Teleconsultation (LiveKit)

| Method | Path | Auth | Request | Response | Description |
|--------|------|------|---------|----------|-------------|
| POST | `/` | any | `consultation_id` (opt), `specialist_id` (opt), `source` (opt) | `TeleconsultationRead` | Create teleconsultation session. Generates LiveKit room name. GP or patient initiates. |
| POST | `/{teleconsultation_id}/accept` | PRACTITIONER | — | `TeleconsultationRead` | Specialist accepts the call. Updates `specialist_id` and `status`. |
| POST | `/{teleconsultation_id}/end` | any | — | `TeleconsultationRead` | End the teleconsultation. Any participant can end. Records `ended_at` and `duration_seconds`. |
| GET | `/{teleconsultation_id}/token` | any | — | `{token, room_name}` | Generate a LiveKit JWT for joining the room. If caller is PRACTITIONER, broadcasts join event via WebSocket to other practitioners. |
| GET | `/incoming` | PRACTITIONER | — | `list[TeleconsultationRead]` | Pending incoming teleconsultation requests for current specialist. |
| GET | `/{teleconsultation_id}` | any | — | `TeleconsultationRead` | Teleconsultation detail. |

---

#### `/api/notifications` — Notifications

| Method | Path | Auth | Response | Description |
|--------|------|------|----------|-------------|
| GET | `/` | any | `list[NotificationRead]` | Notifications for current user. |

---

#### `/api/stats` — Statistics & Dashboards

| Method | Path | Auth | Response | Description |
|--------|------|------|----------|-------------|
| GET | `/public` | **None** | JSON | Public homepage counters: `patients_served`, `images_analyzed`, `specialists`, `districts_served`. |
| GET | `/admin` | ADMIN | `AdminStatsResponse` | Full admin dashboard: users, practitioners, consultations, images, patients, pending approvals, urgent cases, recent activity, disposition breakdown, location stats, consent stats, outcome stats, ML model stats, teleconsultation stats, top conditions. |
| GET | `/practitioner` | PRACTITIONER | `PractitionerStatsResponse` | My dashboard: `my_reviews`, `pending_consultations`, `urgent_cases`, `patients_seen`, `avg_response_time_hours`. |
| GET | `/user` | any | `UserStatsResponse` | My dashboard: `my_consultations`, `my_scans`, `pending_results`, `urgent_alerts`. |
| GET | `/ml-metrics` | ADMIN | JSON | ML metrics: model version/date, total predictions, condition distribution, confidence distribution, triage breakdown, avg confidence by condition, uncertain predictions, class names, triage mapping. |

---

#### `/api/conditions` — Condition Catalogue

| Method | Path | Auth | Request | Response | Description |
|--------|------|------|---------|----------|-------------|
| GET | `/` | any | — | `list[ConditionRead]` | All conditions (predefined + custom). |
| POST | `/` | any | `condition_name`, `category` | `ConditionRead` | Create a custom condition. |

---

#### `/api/retraining-logs` — ML Retraining Audit

| Method | Path | Auth | Request | Response | Description |
|--------|------|------|---------|----------|-------------|
| POST | `/` | ADMIN | `dataset_size`, `accuracy`, `model_version` | `RetrainingLogRead` | Record a model retraining event. |
| GET | `/` | ADMIN | — | `list[RetrainingLogRead]` | All retraining logs. |
| GET | `/{log_id}` | ADMIN | — | `RetrainingLogRead` | Single retraining log. |

---

#### `/api/ws` — WebSocket

| Path | Auth | Description |
|------|------|-------------|
| `/ws/specialists` | Query param `user_id` (UUID) | Real-time channel for specialists. Receives teleconsultation requests, join events, and notification pushes. Responds with pong on heartbeat. |
| `/ws/users` | Query param `user_id` (UUID) | Real-time channel for patient users. Receives notifications and status updates. |

---

### 3.4 Core Services

| Service | Responsibility |
|---------|----------------|
| **`ml_service`** | Load Keras model at startup. `predict_with_details(url)` → condition, confidence, triage_stage, urgency, all_probabilities, gradcam_url (optional). Two-stage triage: confidence < 0.45 → STAGE_1_LOW_CONFIDENCE → REFER; refer-override threshold 0.6 → STAGE_2_REFER_OVERRIDE. `aggregate_predictions(images)` for consultation majority vote + mean confidence. |
| **`image_service`** | Upload to Cloudinary → ML predict → save Image. Quick scan (source=QUICK_SCAN) vs consultation upload (source=CONSULTATION, `allowed_review=True`). Attach QUICK_SCAN to consultation triggers re-aggregation. List unreviewed/reviewed/all. Update reviewed_label. Delete from Cloudinary + DB. |
| **`consultation_service`** | CRUD consultations. `update_ml_results(consultation_id)`: aggregate image predictions, set `final_predicted_condition`, `final_confidence`, `urgency`. Notify if URGENT. |
| **`cloudinary_service`** | Upload file → returns `(url, storage_key)`. Delete by storage_key. |
| **`notification_service`** | Create Notification records. `notify_urgent_case(consultation_id)` for urgent image uploads. SMS dispatch via MISTA API (non-blocking). |
| **`websocket_service`** | `ConnectionManager` keyed by `practitioner_id`. `broadcast_to_practitioner(id, message)` sends JSON events to connected specialists. |
| **`teleconsultation_service`** | LiveKit room name generation. `create_access_token(room_name, participant)` issues LiveKit JWT. Manages room lifecycle. |
| **`condition_service`** | Seed predefined conditions at startup from embedded list. |

### 3.5 Seed Data (`app/core/seed.py`)

Created on first startup if not present:

| Account | Email | Password | Role |
|---------|-------|----------|------|
| Super Admin | admin@dermoai.rw | Admin@123 | ADMIN |
| GP 1 | dr.mutesi@dermoai.rw | Doctor@123 | PRACTITIONER (GP) |
| GP 2 | dr.uwase@dermoai.rw | Doctor@123 | PRACTITIONER (GP) |
| GP 3 | doctor@dermoai.rw | Doctor@123 | PRACTITIONER (GP) |
| Specialist 1 | specialist@dermoai.rw | Doctor@123 | PRACTITIONER (SPECIALIST) |
| Specialist 2 | dr.kagabo@dermoai.rw | Doctor@123 | PRACTITIONER (SPECIALIST) |
| Specialist 3 | dr.ingabire@dermoai.rw | Doctor@123 | PRACTITIONER (SPECIALIST) |

> Change passwords before production deployment.

---

## 4. Frontend (Next.js 16)

### 4.1 Structure

- **App Router** with three route groups: `(auth)/`, `(dashboard)/`, `(admin)/`.
- **Layout:** 72px icon sidebar (desktop) + `DashboardHeader` + `BottomNav` (5 items, mobile).
- **Auth:** Tokens stored in localStorage. `AuthProvider` context with auto-refresh via Axios interceptor. `AuthGuard` and `RoleGate` protect routes.
- **API client:** `lib/api/client.ts` — Axios instance with Bearer token auto-attach, 401 → refresh token + retry queue.

### 4.2 Pages & Features

| Route | Roles | Feature |
|-------|-------|---------|
| `/` | Public | Landing page with quick-scan upload and `GET /api/stats/public` counters |
| `/login`, `/register` | Public | Authentication |
| `/dashboard` | All authenticated | Role-specific dashboard (user / practitioner / admin stats cards) |
| `/scan-history` | USER | Quick-scan history list (`GET /api/triage/history`) |
| `/consultations` | All | Consultation list with `has_appointments` / `has_teleconsultation` flags |
| `/consultations/new` | All | Create consultation (patient select + `POST /api/consultations/`) |
| `/consultations/[consultationId]` | All | Detail: images, upload, attach scan, aggregated ML result, consent PIN flow, clinical reviews, appointment/teleconsult links |
| `/review-queue` | PRACTITIONER | Unreviewed / reviewed tabs; assign `reviewed_label` via `PATCH /api/images/{id}` |
| `/patients` | PRACTITIONER | Patient list |
| `/patients/[patientId]` | PRACTITIONER | Patient detail + consultations |
| `/appointments` | All | Appointment requests (outgoing / incoming) |
| `/notifications` | All | Notification list |
| `/profile` | All | User profile (`GET/PUT /api/users/me`) |
| `/telemedicine` | PRACTITIONER | Incoming teleconsultation requests; `TeleconsultationListener` WebSocket |
| `/teleconsultations/[id]` | All | LiveKit video call (token from `GET /api/teleconsultations/{id}/token`) |
| `/admin` | ADMIN | Admin stats dashboard |
| `/admin/users` | ADMIN | User table + deactivate |
| `/admin/practitioners` | ADMIN | Practitioner list + approve/reject pending |
| `/admin/images` | ADMIN | Image list with filters (`GET /api/images/all`) |
| `/admin/retraining-logs` | ADMIN | ML retraining log table + create |
| `/admin/ml-metrics` | ADMIN | ML model metrics from `GET /api/stats/ml-metrics` |

---

## 5. End-to-End Flows

### 5.1 Quick Scan (public / patient)

```
User uploads image
  → POST /api/triage/scan (optional auth, optional consent)
  → Cloudinary upload
  → ML predict (condition, confidence, triage_stage, urgency, gradcam_url)
  → Save Image (source=QUICK_SCAN)
  → Return: condition, urgency badge, GradCAM overlay
User sees result; appears in GET /api/triage/history
```

### 5.2 GP Consultation Workflow

```
GP creates patient         → POST /api/patients/
GP opens consultation      → POST /api/consultations/
GP uploads image           → POST /api/images/upload?consultation_id=...
  → Cloudinary + ML predict + save Image (source=CONSULTATION, allowed_review=true)
  → consultation_service.update_ml_results() → majority vote urgency
  → if URGENT → notification_service.notify_urgent_case()
GP reviews aggregated result on consultation detail
  → final_predicted_condition, final_confidence, urgency shown

  Path A — Treat locally:
    GP writes clinical review     → POST /api/clinical-reviews/ (is_final=false)
    GP closes consultation        → PUT /api/consultations/{id} (disposition=TREATED_LOCALLY, status=CLOSED)

  Path B — Telemedicine:
    GP requests appointment       → POST /api/appointments/request (specialist_id, proposed_datetime)
      → SMS sent to specialist (non-blocking)
    Specialist approves           → PATCH /api/appointments/{id}/approve
      → SMS sent to GP
    GP starts call                → POST /api/appointments/{id}/start-call
      → creates Teleconsultation (LiveKit room)
      → SMS sent to both parties
    Both join call                → GET /api/teleconsultations/{id}/token
      → WebSocket notifies specialist of GP joining
    Call ends                     → POST /api/teleconsultations/{id}/end
    Specialist completes appt     → PATCH /api/appointments/{id}/complete
    Specialist writes final review → POST /api/clinical-reviews/ (is_final=true)
    GP closes consultation        → PUT /api/consultations/{id} (disposition=TELEMEDICINE_ONLY, status=CLOSED)

  Path C — Refer to clinic:
    GP writes clinical review     → POST /api/clinical-reviews/ (is_final=false)
    GP closes consultation        → PUT /api/consultations/{id} (disposition=REFERRED_TO_CLINIC, status=CLOSED)
```

### 5.3 Patient Self-Service Flow

```
Patient registers             → POST /api/auth/register (role=USER)
Patient creates own record    → POST /api/patients/ (with own user_id)
Patient opens consultation    → POST /api/consultations/
Patient uploads image         → POST /api/images/upload?consultation_id=...
Patient sees urgency result
  → if MANAGE LOCALLY → consultation closes automatically
  → if REFER          → consultation stays open; patient can initiate teleconsult
Patient initiates direct teleconsult → POST /api/teleconsultations/ (specialist_id, source=DIRECT)
  → specialist notified via WebSocket
Specialist accepts            → POST /api/teleconsultations/{id}/accept
Both join                     → GET /api/teleconsultations/{id}/token (LiveKit)
Call ends                     → POST /api/teleconsultations/{id}/end
```

### 5.4 Image Consent & Review Flow

```
After consultation, patient grants consent:
  Option A — Self-consent via UI:
    PATCH /api/consultations/{id}/images-consent (consent_to_reuse=true)
  Option B — PIN-based consent (GP-initiated):
    POST /api/consultations/{id}/request-consent-pin
      → 6-digit PIN sent via SMS to patient phone
      → PIN expires in 10 minutes (stored in ConsentPin table)
    Patient receives PIN, enters it:
    POST /api/consultations/{id}/verify-consent-pin (pin=XXXXXX)
      → if valid + not expired → all consultation images set consent_to_reuse=true

Specialist reviews consented images in queue:
  GET /api/images/unreviewed (skip, limit)
  PATCH /api/images/{id} (reviewed_label = condition)
    → stored with reviewer_id
Reviewed images visible at:
  GET /api/images/reviewed
Admin sees full image dataset:
  GET /api/images/all (with filters: date, user, consent, consultation)
```

### 5.5 Admin Workflow

```
Approve practitioners:
  GET /api/practitioners/pending → list
  PUT /api/practitioners/{id}/approve (approval_status=APPROVED)

Monitor system:
  GET /api/stats/admin → full dashboard stats
  GET /api/stats/ml-metrics → model performance & prediction distribution

Manage users:
  GET /api/users/
  PUT /api/users/{id}/deactivate

Log retraining events:
  POST /api/retraining-logs/ (dataset_size, accuracy, model_version)
  GET /api/retraining-logs/
```

---

## 6. Feature Status

| Area | Status |
|------|--------|
| **ML pipeline** | Download, filter, augmentation, training notebooks complete; model exported to `models/final/`. |
| **ML inference** | Backend loads Keras model at startup; two-stage triage; GradCAM explainability; consultation aggregation. |
| **Auth** | JWT access + refresh; PBKDF2 password hash; role-based access control; practitioner approval gate. |
| **Users / Practitioners** | Full CRUD; online status; approval workflow. |
| **Patients** | Full CRUD; user-linking. |
| **Triage / Quick Scan** | Public endpoint; Cloudinary + ML + optional GradCAM; scan history. |
| **Consultations** | Full lifecycle (OPEN → CLOSED); disposition tracking; ML aggregation; consent PIN flow. |
| **Images** | Upload, attach, consent, specialist review queue, admin list with filters. |
| **Clinical Reviews** | Create, read, update; is_final flag; access-controlled by role. |
| **Appointments** | Full request/approve/reject/reschedule/complete flow; SMS notifications. |
| **Teleconsultation** | LiveKit integration; appointment-linked and direct; WebSocket notifications; token generation. |
| **Notifications** | DB-stored; WebSocket push; SMS via MISTA API (non-blocking). |
| **Stats** | Public counters; admin dashboard; practitioner dashboard; user dashboard; ML metrics. |
| **Conditions** | Predefined seeded catalogue; user-creatable. |
| **Retraining Logs** | Admin-only audit trail for model versions. |
| **Frontend** | All flows implemented; PWA offline indicator; responsive with mobile BottomNav. |
| **Deployment** | Vercel (frontend) + Render (backend) + Supabase PostgreSQL (production). |

---

## 7. File and Directory Reference

```
dermoai/
├── CLAUDE.md                        # Dev/AI guidance
├── README.md                        # Setup, datasets, deployment
├── docs/
│   └── PROJECT_REPORT.md            # This document
├── notebooks/                       # 01_data_exploration → 04_model_training
├── src/data/                        # download.py, filter.py, augmentation.py
├── results/                         # eda/, classification/, augmentation/
├── models/
│   └── final/                       # best_model.keras, class_names.json, triage_mapping.json
├── data/                            # raw/ processed/ augmented/ test/
├── mockups/                         # UI screenshots/mockups
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI factory + lifespan
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic Settings (env vars)
│   │   │   ├── database.py          # async SQLAlchemy engine + session
│   │   │   ├── security.py          # JWT create/verify, password hash
│   │   │   ├── deps.py              # Auth dependency injection
│   │   │   ├── migrate.py           # Alembic migration runner
│   │   │   └── seed.py              # Admin + practitioner seed
│   │   ├── models/                  # 13 SQLAlchemy ORM models
│   │   ├── schemas/                 # Pydantic v2 request/response schemas
│   │   ├── routers/                 # 16 FastAPI routers
│   │   └── services/                # All business logic
│   │       ├── ml_service.py        # Keras inference + GradCAM + triage
│   │       ├── image_service.py     # Cloudinary + ML + review queue
│   │       ├── consultation_service.py
│   │       ├── cloudinary_service.py
│   │       ├── notification_service.py
│   │       ├── websocket_service.py # ConnectionManager
│   │       ├── teleconsultation_service.py  # LiveKit tokens + rooms
│   │       └── condition_service.py
│   ├── alembic/                     # DB migrations
│   ├── scripts/
│   │   └── populate_data.py         # Demo data seeding script
│   └── .env                         # Backend environment variables
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/              # login, register
    │   │   ├── (dashboard)/         # all practitioner/patient views
    │   │   └── (admin)/             # admin management views
    │   ├── components/              # UI components
    │   ├── hooks/                   # React Query data hooks
    │   ├── lib/api/                 # Axios client + API functions
    │   ├── providers/               # AuthProvider, QueryProvider
    │   └── types/api.ts             # Canonical TypeScript types
    └── .env.local                   # Frontend environment variables
```

---

## 8. How to Run

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Set .env (DATABASE_URL, SECRET_KEY, CLOUDINARY_*, LIVEKIT_*, CORS_ORIGINS)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Migrations and seed run automatically on startup. Swagger UI at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
# Set .env.local (NEXT_PUBLIC_API_URL, NEXT_PUBLIC_LIVEKIT_URL)
npm run dev
```

App at `http://localhost:3000`.

### Populate demo data (requires running backend)

```bash
cd backend
source .venv/bin/activate
python scripts/populate_data.py
```

Creates 37 GP patients, 6 self-registered patient users, 43 consultations, 7 quick scans, appointment and teleconsultation samples across all GPs and specialists.

### ML model

Place trained model outputs from `notebooks/04_model_training.ipynb` into `models/final/`:
- `best_model.keras`
- `class_names.json`
- `triage_mapping.json`

Backend expects these at startup; without them, `/api/triage/scan` and `/api/images/upload` will fail.

---

## 9. Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@host:5432/dbname` |
| `SECRET_KEY` | JWT signing secret (change in production) |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | e.g. `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | e.g. `7` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CORS_ORIGINS` | JSON array of allowed origins, e.g. `["http://localhost:3000"]` |
| `LIVEKIT_URL` | LiveKit WebSocket URL (`wss://...`) |
| `LIVEKIT_API_KEY` | LiveKit API key |
| `LIVEKIT_API_SECRET` | LiveKit API secret |
| `MISTA_API_KEY` | MISTA SMS gateway API key |
| `SEED_ADMIN_EMAIL` | (Optional) Admin email for first-run seed |
| `SEED_ADMIN_PASSWORD` | (Optional) Admin password for first-run seed |
| `SEED_ADMIN_NAME` | (Optional) Admin display name |
| `API_BASE_URL` | Used by populate_data.py script |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend base URL |
| `NEXT_PUBLIC_LIVEKIT_URL` | LiveKit WebSocket URL |

---

This document is the authoritative project reference for DermoAI covering data pipeline, ML model, all API endpoints with full request/response details, clinical workflow flows, and deployment.
