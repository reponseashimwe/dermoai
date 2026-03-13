# DermoAI

AI-assisted dermatological triage for resource-limited settings. DermoAI classifies skin images into clinically meaningful condition categories and maps predictions to REFER or MANAGE LOCALLY triage decisions, with a focus on **Fitzpatrick Skin Types (FST) V–VI** to address known performance gaps in dermatology AI on darker skin tones.

**Repository:** https://github.com/reponseashimwe/dermoai

**Live application:**

- Frontend (Vercel): https://dermo.vercel.app/
- Backend API (Render): https://dermoai-24lz.onrender.com
- API docs (Swagger): https://dermoai-24lz.onrender.com/docs

## **Video demo:** [DermoAI Video Demo (Google Drive)](https://drive.google.com/drive/folders/1xOsam4Ctrd44eHeENncgpYg6180lFXp7)

## Description

DermoAI is a full-stack clinical workflow application combining:

1. **Condition classification** — An EfficientNetB0 CNN (Keras/TensorFlow) trained on FST V–VI data classifies skin images into condition classes with optional GradCAM explainability overlays. When confidence across all classes falls below 0.35, the system returns **UNCERTAIN** instead of a forced prediction.
2. **Two-stage urgency triage** — Confidence threshold (0.35) and refer-override logic (0.6) map predictions to REFER / MANAGE LOCALLY with a `triage_stage` indicator.
3. **Clinical workflow** — Quick scan → GP consultation with image upload → specialist appointment booking → LiveKit teleconsultation → clinical review → image consent management → specialist review queue.

**Tech stack:**

| Layer    | Technologies                                                                                             |
| -------- | -------------------------------------------------------------------------------------------------------- |
| ML/Data  | Python, TensorFlow/Keras, Jupyter, Fitzpatrick17k + ISIC (FST V–VI), Pandas, OpenCV, Albumentations      |
| Backend  | FastAPI, PostgreSQL (asyncpg), SQLAlchemy, Alembic, Cloudinary (images), LiveKit (video), JWT, MISTA SMS |
| Frontend | Next.js 16 (App Router), TypeScript, React Query, Axios, Tailwind v4, LiveKit SDK, PWA                   |

---

## How It Works

- **Quick Scan** — any user uploads a skin image, gets immediate REFER or MANAGE LOCALLY triage with GradCAM explainability. No account required. If confidence is below 0.35 across all classes, UNCERTAIN is returned with a retake recommendation.
- **GP Consultation** — authenticated practitioners create patient consultations, upload images for ML triage, and refer via telemedicine or treat locally.
- **Teleconsultation** — REFER cases trigger specialist appointment requests. Approved appointments launch LiveKit video calls with SMS notifications to both parties.
- **Specialist Review Queue** — specialists review consented images, assign verified labels, and write clinical reviews.

Full API documentation: https://dermoai-24lz.onrender.com/docs
Environment variables: copy `backend/.env.example` and `frontend/.env.local.example` and fill in your credentials.

---

## Installation & Setup

Requirements: Python 3.10+, Node.js 18+, PostgreSQL 14+.

### 1. Clone

```bash
git clone https://github.com/reponseashimwe/dermoai.git
cd dermoai
```

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env` (copy `backend/.env.example` and fill in values). Then:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API starts at `http://localhost:8000`. Migrations and seed data run automatically. Swagger UI: `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
```

```bash
npm run dev
```

App at `http://localhost:3000`.

### 4. ML Model

Place trained model files in `models/final/` (produced by `notebooks/04_model_training_efficientnet.ipynb`):

```
models/final/best_model.keras
models/final/class_names.json
models/final/triage_mapping.json
```

Without these files, the triage scan and image upload endpoints will fail at startup.

### 5. ML Notebooks (optional — training pipeline)

Run in order from the project root after downloading data:

```bash
pip install -r requirements.txt
jupyter notebook notebooks/01_data_exploration.ipynb
```

| Notebook                                                                                           | Purpose                                              |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [01_data_exploration.ipynb](notebooks/01_data_exploration.ipynb)                                   | EDA: distribution, class imbalance, FST coverage     |
| [02_condition_classification_strategy.ipynb](notebooks/02_condition_classification_strategy.ipynb) | Condition taxonomy: 112 diagnoses → 5 classes        |
| [03_data_augmentation.ipynb](notebooks/03_data_augmentation.ipynb)                                 | Augmentation strategy and split statistics           |
| [04_model_training_efficientnet.ipynb](notebooks/04_model_training_efficientnet.ipynb)             | EfficientNetB0 training, focal loss, GradCAM, export |

---

## Model Performance

- **Architecture:** EfficientNetB0 (ImageNet pretrained), input 224×224 RGB
- **Training:** Two-phase (frozen base → fine-tuned last 30 layers), focal loss, class weighting
- **Dataset:** Fitzpatrick17k FST V–VI, 5 conditions, 1,250 images (250/class), 60/20/20 split
- **Conditions & triage:**

| Condition                | Triage         |
| ------------------------ | -------------- |
| Lupus Erythematosus      | REFER          |
| Pityriasis Rubra Pilaris | REFER          |
| Psoriasis                | MANAGE LOCALLY |
| Neurofibromatosis        | MANAGE LOCALLY |
| Scabies                  | MANAGE LOCALLY |

- **Confidence threshold:** 0.35 — below this returns UNCERTAIN → REFER
- **REFER override threshold:** 0.60

See [notebooks/04_model_training_efficientnet.ipynb](notebooks/04_model_training_efficientnet.ipynb) for full metrics.

---

## Analysis — Objectives vs Results

### Objective 1: FST V–VI Dataset Analysis & Augmentation

✅ **Achieved.** Fitzpatrick17k and ISIC datasets analyzed to quantify FST V–VI representation gaps. 5 conditions selected based on dataset viability (≥50 images per class) and clinical relevance for Sub-Saharan Africa. Conditions with insufficient representation were dropped (vitiligo: 42 images, squamous cell carcinoma: 44 images). Targeted augmentation applied to FST V–VI images → 250 images/class → 1,250 total training images. 60/20/20 stratified split maintained FST subgroup distribution across train/val/test sets.

### Objective 2: AI Classification Model — Accuracy Target on FST V–VI

✅ **Achieved.** A deep learning classification model was developed and fine-tuned on the augmented FST V–VI dataset. Two-phase training strategy applied: frozen base for feature extraction followed by selective unfreezing of top layers for fine-tuning. Focal loss with class weighting addressed class imbalance. Model achieves classification performance on FST V–VI test set exceeding the 70% accuracy target. See [notebooks/04_model_training_efficientnet.ipynb](notebooks/04_model_training_efficientnet.ipynb) for full per-class metrics, confusion matrix, and FST V vs FST VI equity analysis.

### Objective 3: Rule-Based Triage Mapping — REFER Recall Target

✅ **Achieved.** Rule-based triage mapping translates predicted conditions into binary recommendations: **REFER** (lupus erythematosus, pityriasis rubra pilaris) and **MANAGE LOCALLY** (psoriasis, neurofibromatosis, scabies). Two-stage safety logic implemented: confidence threshold (0.35) routes low-confidence predictions to UNCERTAIN → REFER, and a REFER override threshold (0.60) forces escalation when any REFER class probability exceeds 0.60. Combined REFER recall on FST V–VI test set meets the ≥75% target. See notebook for full triage evaluation.

### Objective 4: Telemedicine Referral Interface

✅ **Achieved.** Full telemedicine referral interface implemented and deployed. Rural health center staff (GP role) can create patient consultations, upload skin images for AI triage, and escalate REFER cases to urban-based dermatologists via appointment requests with SMS notifications. Approved appointments launch LiveKit video teleconsultations. Specialist review queue captures clinician-verified labels for continuous model improvement. Case documentation stored per consultation with consent-gated image archival.

### Objective 5: Simulated Clinical Validation

## ⏳ **In progress.** Simulated validation with medical consultants comparing AI triage performance against the established GP baseline of 58–70% sensitivity is scheduled for the coming weeks. The system and all evaluation workflows are fully deployed and ready for consultant testing at [https://dermo.vercel.app](https://dermo.vercel.app). Results will be documented upon completion.

## Testing Results

### Functional Testing — Authentication

**Sign in**
<img src="mockups/new/login.png" alt="Login" width="700" />

**Sign up / Register**
<img src="mockups/new/signup.png" alt="Sign up" width="700" />

---

### Functional Testing — Quick Scan (public, no login required)

**Landing page — desktop**
<img src="mockups/new/homepage.png" alt="Homepage" width="700" />

**Homepage with scan form**
<img src="mockups/new/homepage-scan.png" alt="Homepage scan" width="700" />

**Landing page — mobile (PWA)**
<img src="mockups/new/mobile/landing.png" alt="Homepage mobile" width="700" />

---

### Functional Testing — All Conditions (different data values)

#### Lupus Erythematosus — REFER (79.3% confidence, GradCAM)

<img src="mockups/new/scan-result-lupus.png" alt="Scan result lupus desktop" width="700" />

<img src="mockups/new/mobile/scan-result-lupus.png" alt="Scan result lupus mobile" width="700" />

#### Neurofibromatosis — Manage Locally (77.5% confidence, GradCAM)

<img src="mockups/new/scan-result-neurofibromatosis.png" alt="Scan result neurofibromatosis desktop" width="700" />

<img src="mockups/new/mobile/scan-result-neurofibromatosis.png" alt="Scan result neurofibromatosis mobile" width="700" />

#### Pityriasis Rubra Pilaris — REFER (90.0% confidence, GradCAM)

<img src="mockups/new/scan-result-pityriasis.png" alt="Scan result pityriasis desktop" width="700" />

<img src="mockups/new/mobile/scan-result-pityriasis.png" alt="Scan result pityriasis mobile" width="700" />

#### Psoriasis — Manage Locally (51.2% confidence, GradCAM)

<img src="mockups/new/scan-result-psoriasis.png" alt="Scan result psoriasis desktop" width="700" />

<img src="mockups/new/mobile/scan-result-psoriais.png" alt="Scan result psoriasis mobile" width="700" />

#### Scabies — Manage Locally (88.3% confidence, GradCAM)

<img src="mockups/new/scan-result-scabies.png" alt="Scan result scabies desktop" width="700" />

<img src="mockups/new/mobile/scan-result-scabies.png" alt="Scan result scabies mobile" width="700" />

#### UNCERTAIN — non-skin / low-confidence image (no confidence score, no GradCAM)

<img src="mockups/new/scan-result-uncertain.png" alt="Scan result uncertain desktop" width="700" />

<img src="mockups/new/mobile/uncertain.png" alt="Scan result uncertain mobile" width="700" />

---

### Functional Testing — Clinical Workflow

**GP (General Practitioner) Dashboard**
<img src="mockups/new/doctor-dashboard.png" alt="GP dashboard" width="700" />

**Available Practitioners — Telemedicine**
<img src="mockups/new/available-practitioners.png" alt="Available practitioners" width="700" />

**Book Appointment — request specialist consultation**
<img src="mockups/new/book-form.png" alt="Book appointment" width="700" />

---

### Functional Testing — Admin

**Admin Dashboard — national system overview**
<img src="mockups/new/admin-dashboard.png" alt="Admin dashboard" width="700" />

**Admin Images — consented images for model retraining**
<img src="mockups/new/admin-images.png" alt="Admin images" width="700" />

**Practitioners management — approve/reject doctor registrations**
<img src="mockups/new/practitioners-page.png" alt="Practitioners page" width="700" />

---

### Performance Testing — Hardware & Software Specifications

| Environment                                 | Result                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Backend — Render free tier (cold start)** | ~30s cold start; ~1.5–3s warm inference per image (Cloudinary upload + EfficientNetB0 forward pass + GradCAM) |
| **Frontend — Vercel (global CDN)**          | Static/SSR pages <1s; React Query caching eliminates redundant API calls                                      |
| **Mobile — Android mid-range (PWA)**        | Installable via browser prompt; camera capture and file upload tested on mid-range Android devices            |
| **Mobile — iOS Safari (PWA)**               | Camera upload and scan result rendering confirmed on iOS Safari                                               |
| **Model size**                              | `best_model.keras` ~20MB; loaded once at backend startup, all subsequent inference in-memory                  |
| **Database — Render PostgreSQL**            | Async SQLAlchemy (asyncpg); all queries non-blocking; connection pooling configured                           |

---

## Discussion

DermoAI demonstrates that a focused FST V–VI dataset combined with EfficientNetB0 and two-stage triage logic can be deployed end-to-end as a clinical workflow tool in resource-limited settings. Key design decisions and their impact:

**UNCERTAIN output:** Rather than routing low-confidence predictions to an arbitrary class, the system returns UNCERTAIN when max class probability is below 0.35. This prevents false reassurance and prompts patients to retake the photo or seek clinical evaluation — a safety-first approach validated with non-skin images and poor-quality uploads.

**GradCAM explainability:** Providing a visual heatmap of model attention builds clinician trust and supports the GP in contextualising the AI prediction. UNCERTAIN cases skip GradCAM entirely since there is no meaningful class to explain.

**Two-role practitioner model:** Separating GP (consultation creator) from SPECIALIST (reviewer, teleconsultation approver) mirrors real referral chains in Sub-Saharan African health systems where dermatology specialists are concentrated in cities.

**SMS integration (MISTA):** Appointment requests, approvals, and consent PINs are delivered via SMS, ensuring the workflow functions even without smartphone apps or stable internet on the patient side.

**Consent-gated retraining pipeline:** Images only enter the admin retraining dataset after explicit patient consent verified by PIN — a critical ethical safeguard for a system trained on under-represented skin types.

---

## Recommendations

1. **Expand training classes:** The current 5-class model covers high-burden FST V–VI conditions but excludes malignancies. Future work should incorporate ISIC dermoscopy data for malignant classes to enable REFER recall comparison against published benchmarks.

2. **Offline-first mobile app:** The PWA currently requires network access for inference. Deploying a quantised TFLite model on-device would make the tool viable in zero-connectivity settings (rural clinics, community health workers).

3. **Federated learning for retraining:** The consent-gated image pool enables retraining but centralises sensitive health data. A federated learning approach would allow hospital sites to contribute model updates without sharing raw images.

4. **FST equity monitoring in production:** The admin ML metrics endpoint exposes per-class confidence distributions but not per-FST-subgroup performance. Adding FST metadata at upload time (self-reported or model-predicted) would enable continuous equity monitoring.

5. **Clinical validation study:** Deployment as a decision-support tool requires a prospective validation against GP + specialist ground truth in at least two clinic sites. The specialist review queue is already designed to collect this ground truth at scale.

---

## Deployment

### Environments

| Component     | Platform          | URL                               |
| ------------- | ----------------- | --------------------------------- |
| Frontend      | Vercel            | https://dermo.vercel.app          |
| Backend API   | Render            | https://dermoai-24lz.onrender.com |
| Database      | Render PostgreSQL | Managed add-on                    |
| Image Storage | Cloudinary        | CDN delivery                      |
| Video Calls   | LiveKit Cloud     | WebRTC                            |
| SMS Alerts    | MISTA             | Rwanda SMS gateway                |

### Frontend — Vercel

1. Connect GitHub repo to Vercel
2. Set root directory to `frontend`
3. Build command: `npm run build`
4. Add environment variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_LIVEKIT_URL`
5. Deploy — auto-deploys on every push to main

### Backend — Render

1. Create new Web Service on Render
2. Set root directory to `backend`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add PostgreSQL addon — `DATABASE_URL` auto-injected
5. Copy all variables from `backend/.env.example` and fill in values
6. Upload model files to `models/final/` before deploying (commit or mount as persistent disk)
7. Deploy — migrations and seed data run automatically on startup

### Verify deployment

- Frontend live: https://dermo.vercel.app
- Backend health: https://dermoai-24lz.onrender.com/docs
- End-to-end: upload any skin image on the landing page → condition + triage result + GradCAM returned

---

## Repository Structure

```
dermoai/
├── backend/          # FastAPI app (API, auth, ML inference, Cloudinary, LiveKit, SMS)
│   ├── app/
│   │   ├── core/     # config, database, security, deps, seed, migrate
│   │   ├── models/   # SQLAlchemy ORM (13 entities)
│   │   ├── schemas/  # Pydantic v2 request/response models
│   │   ├── routers/  # 16 FastAPI routers
│   │   └── services/ # ml, image, consultation, cloudinary, notification, websocket, teleconsultation
│   ├── alembic/      # DB migrations
│   └── scripts/      # populate_data.py (demo data seeding)
├── frontend/         # Next.js 16 app
│   └── src/
│       ├── app/      # (auth)/, (dashboard)/, (admin)/
│       ├── components/
│       ├── hooks/    # React Query data hooks
│       ├── lib/api/  # Axios client + typed API functions
│       └── types/    # api.ts canonical TypeScript types
├── notebooks/        # 01_data_exploration → 04_model_training_efficientnet
├── src/data/         # download.py, filter.py
├── data/             # raw/, processed/, augmented/, test/
├── results/          # eda/, classification/, augmentation/
├── models/final/     # best_model.keras, class_names.json, triage_mapping.json
├── mockups/          # UI screenshots (new/ = final, new/mobile/ = responsive)
└── docs/             # PROJECT_REPORT.md (full technical documentation)
```

---

## Citations

**Fitzpatrick17k:** Groh, M., et al. (2021). Evaluating Deep Neural Networks Trained on Clinical Images in Dermatology with the Fitzpatrick 17k Dataset. CVPR 2021.

**ISIC:** Combalia, M., et al. (2019). BCN20000: Dermoscopic Lesions in the Wild. arXiv:1908.02288.

**EfficientNet:** Tan, M. & Le, Q. V. (2019). EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks. ICML 2019.

**LiveKit:** Open-source real-time communication platform. https://livekit.io

---

## License

Scripts and application code: MIT License. Datasets: see individual dataset licenses (research use only).
