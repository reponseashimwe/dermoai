# DermoAI — Project Documentation & Report

**Version:** 0.1.0 (MVP)  
**Last updated:** February 2025

---

## 1. Project Overview

### 1.1 What is DermoAI?

**DermoAI** is an AI-assisted dermatological triage framework designed for **resource-limited settings in Rwanda**. It addresses a known problem: existing dermatology AI often performs 30–40% worse on **Fitzpatrick Skin Types (FST) V–VI** (darker skin tones). The system is built to:

- Classify skin images into clinically meaningful condition categories.
- Map predictions to **URGENT** vs **NON_URGENT** triage for referral decisions.
- Support a full workflow: quick scan → consultation → specialist review → teleconsultation.

### 1.2 Core Design

**Two-stage classification:**

1. **Condition classification** — A **MobileNetV2** CNN (Keras) classifies skin images into **8 condition classes** (trained on FST V–VI data).
2. **Rule-based urgency mapping** — Predicted condition + confidence (and a malignant probability threshold) determine URGENT or NON_URGENT.

**Tech stack (implemented):**

| Layer        | Technology |
|-------------|------------|
| **ML / Data** | Python, TensorFlow/Keras, Fitzpatrick17k + ISIC (FST V–VI), Jupyter notebooks |
| **Backend**   | FastAPI, PostgreSQL (async), SQLAlchemy, Cloudinary (images), LiveKit (video) |
| **Frontend**  | Next.js 14+ (TypeScript), PWA-capable, React Query, Axios-style client |
| **Auth**      | JWT (access + refresh), role-based (ADMIN, PRACTITIONER, USER) |

---

## 2. Data & ML Pipeline

### 2.1 Data Sources

- **Fitzpatrick17k** — ~16,577 images; FST V–VI subset used for training (~1,000–1,500, then filtered).
- **ISIC Archive** — ~549,590 images; ~1,574 with FST V–VI labels (~0.29%); used for representation analysis.

Large assets (`data/raw/*/images/`, `isic_metadata.csv`) are not in git; they are documented in the README and available via Google Drive.

### 2.2 Data Scripts (`src/data/`)

| Script          | Purpose |
|-----------------|--------|
| **`download.py`** | Ingests Fitzpatrick17k and/or ISIC with retry/backoff. Run: `python src/data/download.py`, optional `--dataset fitzpatrick17k` or `isic`, `--retry-failed`. |
| **`filter.py`**   | Verifies FST V–VI labels using **ITA score** (LAB color space: FST VI &lt; 10°, FST V = 10–19°) and **luminance** (mean &lt; 120). Outputs High (≥0.8) / Medium (0.5–0.8) / Low (&lt;0.5) confidence tiers. Run: `python src/data/filter.py` (optionally `--dataset fitzpatrick17k` or `isic`). |
| **`augmentation.py`** | Data augmentation (stub/reference). |
| **`preprocess.py`**   | Preprocessing pipeline (stub). |

### 2.3 Notebooks (`notebooks/`)

| Notebook | Purpose |
|----------|--------|
| **`01_data_exploration.ipynb`** | EDA on Fitzpatrick17k and ISIC: dataset integrity, label distribution, FST V vs VI, class imbalance, augmentation needs, malignant vs non-malignant balance; ISIC FST coverage; cross-dataset synthesis. Outputs go to `results/eda/`. |
| **`02_condition_classification_strategy.ipynb`** | Defines the **9 → 8 category** condition mapping from 112 original diagnoses. Rules: ≥50 train samples → independent class; 40–49 with clinical priority/distinctiveness → independent; else grouped by taxonomy. Produces condition inventory and classification mapping used in training. |
| **`03_data_augmentation.ipynb`** | Augmentation strategy for class imbalance: policy (e.g. horizontal/vertical flip, rotation ±15°, brightness/contrast), scope (training only), and split statistics. Outputs `results/augmentation/augmentation_report.json`. |
| **`04_model_training.ipynb`** | **Capstone training:** Recall-optimized MobileNetV2 for FST V–VI. Uses **focal loss** (α=0.5, γ=2.0), two-phase fine-tuning (frozen backbone → unfreeze last 20–30 layers), and malignant-specific threshold at inference. **8 classes:** malignant, benign_neoplastic, eczematous_dermatitis, papulosquamous, autoimmune, genetic_neurocutaneous, pigmentary, parasitic. Target: **malignant recall ≥80%**. Exports best model to `models/final/` (e.g. `best_model.keras`, `class_names.json`). |

### 2.4 Results (`results/`)

| Directory / File | Content |
|------------------|--------|
| **`eda/`** | EDA outputs: `eda_summary_report.json`, augmentation strategy CSVs, risk/ethics flags. |
| **`classification/`** | Condition mapping and decisions: `condition_classification_mapping.csv`, `final_class_statistics.csv`, `rwanda_priority_conditions.csv`, malignant/inflammatory breakdowns, etc. |
| **`augmentation/`** | `augmentation_report.json`: split stats (train/val/test/augmented), per-class counts, augmentation policy (transforms, scope, max factor). |

**Example EDA summary (from `eda_summary_report.json`):** 2,155 samples (FST V: 1,527, FST VI: 628), 112 conditions → 9-partition categories; 70/15/15 split; stratification by FST + three_partition_label.

**Example augmentation report:** 2,155 original images → 8 classes; train 1,507 → augmented 3,147; val/test 324 each; transforms: HorizontalFlip, VerticalFlip, Rotate ±15°, RandomBrightnessContrast.

---

## 3. Backend (FastAPI)

### 3.1 Overview

- **Entry:** `backend/app/main.py` — `create_app()`, lifespan: run migrations → seed DB → configure Cloudinary → seed predefined conditions.
- **Database:** PostgreSQL via **asyncpg**; migrations via `app/core/migrate.py`.
- **Auth:** JWT access + refresh; roles: **ADMIN**, **PRACTITIONER**, **USER**.

### 3.2 API Routers (all under `/api/`)

| Prefix | Tag | Main endpoints |
|--------|-----|-----------------|
| `/api/auth` | auth | `POST /register`, `POST /login`, `POST /refresh` |
| `/api/users` | users | `GET /me`, `PUT /me`, `GET /`, `PUT /{user_id}/deactivate` |
| `/api/patients` | patients | `POST /`, `GET /me`, `GET /`, `GET /{id}`, `PUT /{id}`, `POST /{id}/link` |
| `/api/practitioners` | practitioners | `GET /available`, `PUT /me/status`, `GET /`, `GET /pending`, `GET /{id}`, `PUT /{id}`, `PUT /{id}/approve` |
| `/api/consultations` | consultations | `POST /`, `GET /`, `GET /{id}`, `PUT /{id}`, `PATCH /{id}/images-consent` |
| `/api/images` | images | `POST /upload`, `POST /{id}/attach`, `GET /unreviewed`, `GET /reviewed`, `GET /all`, `GET /consultation/{id}`, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}` |
| `/api/triage` | triage | `POST /scan`, `GET /history` |
| `/api/clinical-reviews` | clinical-reviews | `POST /`, `GET /` (filtered), `GET /{id}` |
| `/api/notifications` | notifications | `GET /` |
| `/api/retraining-logs` | retraining-logs | `POST /`, `GET /`, `GET /{id}` |
| `/api/stats` | stats | `GET /admin`, `GET /practitioner`, `GET /user` |
| `/api/conditions` | conditions | `GET /`, `POST /` |
| `/api/teleconsultations` | teleconsultations | `POST /`, `POST /{id}/accept`, `POST /{id}/end`, `GET /{id}/token`, `GET /incoming`, `GET /{id}` |
| `/api/ws` | websocket | `WS /specialists` |

- **Health:** `GET /health` → `{"status": "healthy"}`.

### 3.3 Core Services

| Service | Responsibility |
|---------|----------------|
| **`ml_service`** | Loads Keras model from `models/final/` (e.g. `best_model.keras`). `predict_with_details(url)` → condition, confidence, urgency, all_probabilities, malignant_probability. Malignant threshold override (default 0.20). `aggregate_predictions(images)` for consultation-level majority vote + mean confidence + urgency. |
| **`image_service`** | **Quick scan:** upload to Cloudinary → ML predict → save `Image` (source=QUICK_SCAN). **Consultation upload:** same + attach to consultation → `update_ml_results` → notify if URGENT. **Attach:** link QUICK_SCAN image to consultation, then re-aggregate and optionally notify. List unreviewed/reviewed/all; update reviewed_label; delete (Cloudinary + DB). |
| **`consultation_service`** | CRUD consultations. **`update_ml_results(consultation_id)`:** aggregate image predictions via `ml_service.aggregate_predictions`, set consultation `final_predicted_condition`, `final_confidence`, `urgency`. |
| **`cloudinary_service`** | Upload/delete images; returns URL and storage key. |
| **`notification_service`** | Notify on urgent cases (e.g. after consultation urgency set to URGENT). |
| **`condition_service`** | Seed predefined conditions (used at startup). |

### 3.4 Seed Data (`app/core/seed.py`)

Find-or-create on startup: **Super Admin** (admin@dermoai.rw), **General practitioners** (e.g. dr.mutesi@dermoai.rw, dr.uwase@dermoai.rw, doctor@dermoai.rw), **Specialists** (specialist@dermoai.rw, dr.kagabo@dermoai.rw, dr.ingabire@dermoai.rw). Passwords like `Admin@123` / `Doctor@123` (change in production).

### 3.5 Configuration (`app/core/config.py`)

From `.env`: `DATABASE_URL`, `SECRET_KEY`, token expiry, **Cloudinary** (cloud name, API key/secret), **CORS_ORIGINS**, **LiveKit** (API key, secret, URL) for video, optional seed admin.

---

## 4. Frontend (Next.js)

### 4.1 Structure

- **App Router:** `app/(auth)/`, `app/(dashboard)/`, `app/(admin)/`.
- **Auth:** Login, Register; `AuthGuard`, `RoleGate`; auth state via `AuthProvider`; tokens in memory/localStorage.
- **API client:** Central `fetchClient` / `api` (axios-style) with base URL from env; calls to `/api/*` as above.

### 4.2 Main Pages & Features

| Route | Role | Feature |
|-------|------|--------|
| `/`, `/login`, `/register` | All | Landing, login, register |
| `/dashboard` | USER / PRACTITIONER / ADMIN | Role-specific dashboard (user vs practitioner vs admin) |
| `/scan-history` | USER | Quick-scan history (triage scan list) |
| `/consultations` | USER / PRACTITIONER | List consultations; link to new/detail |
| `/consultations/new` | USER / PRACTITIONER | Create consultation (e.g. patient select) |
| `/consultations/[consultationId]` | USER / PRACTITIONER | Consultation detail: images, upload, attach scan, aggregated ML result, consent, status |
| `/review-queue` | PRACTITIONER / ADMIN | Unreviewed vs reviewed images; assign reviewed label (condition select); pagination |
| `/patients` | PRACTITIONER | Patient list |
| `/patients/[patientId]` | PRACTITIONER | Patient detail |
| `/notifications` | All | Notification list |
| `/profile` | All | Profile (e.g. /me) |
| `/telemedicine` | PRACTITIONER | Teleconsultation UI; incoming requests |
| `/teleconsultations/[id]` | PRACTITIONER | Call interface (LiveKit token from backend) |
| `/admin`, `/admin/users`, `/admin/practitioners`, `/admin/images`, `/admin/retraining-logs` | ADMIN | Admin stats, user table, practitioner approval, image list, retraining logs |

### 4.3 Key Components (summary)

- **Layout:** Sidebar, DashboardHeader, BottomNav, TeleconsultationListener (WebSocket for specialists).
- **Scan:** ScanUploadForm, ImageDropzone, ScanResultCard, UrgencyBadge, ConditionInfoPanel, ConsentCheckbox, ScanHistoryList.
- **Consultations:** ConsultationList, ConsultationCard, ConsultationDetail, ConsultationCreateForm, ConsultationStatusBadge; AttachScanModal; ImageGallery, ImageCard, AggregatedResultCard.
- **Review queue:** Pending/reviewed tabs; ConditionSelect; update reviewed label via `PATCH /api/images/{id}`.
- **Telemedicine:** RequestCallButton, SpecialistCallNotification, CallInterface, UrgentConsultationBanner.
- **Practitioners:** PractitionerCard, PendingPractitionerList, ApprovalStatusBadge.
- **Patients:** PatientForm, PatientCard, PatientSelect.
- **Admin:** AdminStatsCards, UserTable, RetrainingLogTable/Form.
- **PWA:** OfflineIndicator, InstallPrompt.
- **UI:** Button, Card, Modal, Badge, Input, Select, Skeleton, Toast, etc.

### 4.4 WebSocket

- **`/api/ws/specialists`** — Specialists (practitioners) receive real-time teleconsultation/notification updates; frontend uses `use-websocket.tsx` and `TeleconsultationListener`.

---

## 5. Flow of Operations

### 5.1 Quick Scan (User)

1. User uploads image on **Quick Scan** (e.g. from dashboard or scan flow).
2. Frontend → `POST /api/triage/scan` (with optional consent).
3. Backend: upload to Cloudinary → `ml_service.predict_with_details(url)` → save `Image` (source=QUICK_SCAN) → return image_id, condition, confidence, urgency, consent.
4. User sees result (condition, urgency badge). Scan appears in **Scan history** (`GET /api/triage/history`).

### 5.2 Consultation Creation and Upload

1. User/Practitioner creates consultation: `POST /api/consultations/` (e.g. patient_id).
2. On consultation detail page: upload new image → `POST /api/images/upload?consultation_id=...` → backend uploads to Cloudinary → ML predict → save Image (source=CONSULTATION, allowed_review=true) → `consultation_service.update_ml_results` (majority vote + urgency) → if URGENT, `notification_service.notify_urgent_case`.
3. Optionally **attach** existing QUICK_SCAN image: `POST /api/images/{image_id}/attach` with consultation_id → same re-aggregation and optional urgent notification.
4. Consultation shows aggregated condition, confidence, urgency; user can set images-consent via `PATCH /api/consultations/{id}/images-consent`.

### 5.3 Review Queue (Practitioner / Admin)

1. `GET /api/images/unreviewed` (paginated) — images eligible for review (allowed_review or in consultation or consent_to_reuse, no reviewed_label).
2. Practitioner selects condition (e.g. from predefined list) and submits → `PATCH /api/images/{image_id}` with `reviewed_label`.
3. Reviewed images appear under “Reviewed” tab: `GET /api/images/reviewed`.

### 5.4 Clinical Review and Specialist

1. Specialist (or practitioner) creates **clinical review** for a consultation: `POST /api/clinical-reviews/` (consultation_id, outcome, etc.).
2. Images in that consultation can be marked as “final” (reviewed_as_final) in the workflow (e.g. via queue or detail flow).

### 5.5 Teleconsultation

1. Request call (e.g. from consultation/UI) → `POST /api/teleconsultations/` (consultation_id, etc.).
2. Specialist gets real-time cue via WebSocket (`/api/ws/specialists`).
3. Specialist accepts → `POST /api/teleconsultations/{id}/accept`; frontend gets LiveKit token via `GET /api/teleconsultations/{id}/token` and joins call.
4. End call → `POST /api/teleconsultations/{id}/end`.

### 5.6 Admin

- **Stats:** `GET /api/stats/admin` (counts, etc.).
- **Users:** list, deactivate.
- **Practitioners:** list, pending, approve (`PUT /api/practitioners/{id}/approve`).
- **Images:** list all (`GET /api/images/all`), filters.
- **Retraining logs:** create/list (`POST/GET /api/retraining-logs`).

---

## 6. What Is Working (Summary)

| Area | Status |
|------|--------|
| **Data pipeline** | Download (Fitzpatrick17k, ISIC) and filter (FST V–VI verification) scripts runnable; augmentation report generated. |
| **Notebooks** | EDA, condition strategy, augmentation, and model training (04) implemented; model export to `models/final/`. |
| **ML inference** | Backend loads Keras model; predicts condition + confidence + urgency; malignant threshold; aggregation for consultations. |
| **Backend API** | Auth, users, patients, practitioners, consultations, images, triage (scan + history), clinical reviews, notifications, stats, conditions, teleconsultations, retraining logs, WebSocket. |
| **Image flow** | Upload (Cloudinary), quick scan, consultation upload, attach scan to consultation, re-aggregation, urgent notification. |
| **Frontend** | Login/register, role-based dashboards, scan history, consultations (list/new/detail), review queue (pending/reviewed), patients, notifications, profile, telemedicine (request/accept/call/end), admin (users, practitioners, images, retraining logs). |
| **PWA** | Offline indicator and install prompt present. |
| **Database** | PostgreSQL with migrations and seed (users, practitioners, conditions). |

---

## 7. File and Directory Reference

```
dermoai/
├── CLAUDE.md              # AI/dev guidance
├── README.md               # Setup, data, filtering, citations
├── docs/
│   └── PROJECT_REPORT.md   # This document
├── src/
│   ├── data/               # download.py, filter.py, augmentation.py, preprocess.py
│   ├── models/             # (stubs; training in notebooks)
│   └── utils/
├── notebooks/              # 01–04 as above
├── results/
│   ├── eda/
│   ├── classification/
│   └── augmentation/
├── models/
│   └── final/              # best_model.keras, class_names.json (from 04 notebook)
├── data/                   # raw/processed/augmented (gitignored where large)
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/           # config, database, migrate, seed, security
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic
│   │   ├── routers/        # All API routers
│   │   └── services/       # ml, image, consultation, cloudinary, notification, etc.
│   └── .env
└── frontend/
    ├── src/
    │   ├── app/            # (auth), (dashboard), (admin) routes
    │   ├── components/
    │   ├── hooks/
    │   ├── lib/            # api client, utils
    │   └── types/
    └── .env
```

---

## 8. How to Run (Recap)

**Backend:** From `backend/`: install deps, set `.env` (DB, Cloudinary, LiveKit if needed), run migrations (on startup) and app (e.g. `uvicorn app.main:app`).

**Frontend:** From `frontend/`: install deps, set `.env` (e.g. `NEXT_PUBLIC_API_URL`), `npm run dev`.

**ML model:** Ensure `models/final/best_model.keras` (or `dermoai_final_model.keras`) and `class_names.json` exist (from notebook `04_model_training.ipynb`). Backend expects them at repo root under `models/final/`.

**Data/notebooks:** `pip install -r requirements.txt`, run `src/data/download.py` and `filter.py` as needed; run notebooks in order 01 → 02 → 03 → 04 for full pipeline.

---

This document serves as the **current project documentation** for DermoAI: what the project is, which features are implemented, how data/notebooks/results fit in, and how the frontend and backend operate end to end.
