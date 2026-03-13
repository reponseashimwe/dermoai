# DermoAI

AI-assisted dermatological triage for resource-limited settings. DermoAI classifies skin images into clinically meaningful condition categories and maps predictions to REFER or MANAGE LOCALLY triage decisions, with a focus on **Fitzpatrick Skin Types (FST) V–VI** to address known performance gaps in dermatology AI on darker skin tones.

**Repository:** https://github.com/reponseashimwe/dermoai

**Live application:**

- Frontend (Vercel): https://dermo.vercel.app/
- Backend API (Render): https://dermoai-24lz.onrender.com
- API docs (Swagger): https://dermoai-24lz.onrender.com/docs

**Video demo:** [DermoAI Video Demo (Google Drive)](https://drive.google.com/drive/folders/1xOsam4Ctrd44eHeENncgpYg6180lFXp7)

## Description

DermoAI is a full-stack clinical workflow application combining:

1. **Condition classification** — An EfficientNetB0 CNN (Keras/TensorFlow) trained on FST V–VI data classifies skin images into condition classes with optional GradCAM explainability overlays. When confidence across all classes falls below 0.35, the system returns **UNCERTAIN** instead of a forced prediction.
2. **Two-stage triage mapping (REFER / MANAGE LOCALLY)** — Confidence threshold (0.35) and refer-override logic (0.6) map predictions to REFER / MANAGE LOCALLY with a `triage_stage` indicator.
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

## Analysis

### Dataset Analysis & FST V–VI Augmentation

**Objective:** Analyze Fitzpatrick17k and ISIC datasets to quantify representation gaps for Fitzpatrick Skin Types V–VI and apply targeted data augmentation techniques that improve model performance on African phenotypes.

✅ **Achieved.**

- Fitzpatrick17k and ISIC analyzed across all FST types — FST V–VI images were significantly under-represented relative to FST I–IV
- 112 raw diagnoses mapped; 5 conditions selected for viability (≥50 FST V–VI images) and clinical relevance for Sub-Saharan Africa
- Dropped: vitiligo (42 images), squamous cell carcinoma (44 images), lichen planus (diagnostic ambiguity on dark skin)
- **448 original FST V–VI images** collected across 5 classes before augmentation
- Targeted augmentation applied (rotation, flipping, brightness/contrast, zoom) → **250 images/class → 1,250 total training images** (balanced)
- Stratified 60/20/20 split: **1,250 train / 90 val / 90 test** — FST subgroup distribution preserved across all splits

### Skin Condition Classification Model

**Objective:** Develop a deep learning classification model that identifies common dermatological conditions with an accuracy of at least 70% on Fitzpatrick Skin Types V–VI. The proposal specified MobileNetV2; EfficientNetB0 was selected instead after comparative evaluation showed superior FST V–VI performance on this dataset size.

✅ **Primary target achieved (76.67%). 80% stretch target not met.**

Overall performance on FST V–VI test set (90 samples):

| Metric           | Result     |
| ---------------- | ---------- |
| Overall accuracy | **76.67%** |
| Macro recall     | **76.49%** |
| Macro precision  | **80.25%** |
| Macro F1-score   | **77.33%** |

Per-class breakdown:

| Condition                | Recall | Precision | F1    |
| ------------------------ | ------ | --------- | ----- |
| Lupus Erythematosus      | 83.3%  | 93.8%     | 88.2% |
| Neurofibromatosis        | 80.0%  | 75.0%     | 77.4% |
| Pityriasis Rubra Pilaris | 76.0%  | 76.0%     | 76.0% |
| Psoriasis                | 76.5%  | 56.5%     | 65.0% |
| Scabies                  | 66.7%  | 100.0%    | 80.0% |

All classes achieved recall ≥50%. The 80% stretch target was not met — psoriasis precision (56.5%) was the weakest result, caused by visual overlap with pityriasis rubra pilaris on FST V–VI images, a known challenge in dark-skin dermatology. The limited pre-augmentation dataset size (448 images) was the primary constraint.

### Triage Mapping (REFER vs MANAGE LOCALLY)

**Objective:** Implement rule-based triage mapping that translates predicted conditions into binary recommendations (REFER / MANAGE LOCALLY), achieving a recall of approximately 75% on REFER cases for Fitzpatrick Skin Types V–VI.

✅ **Achieved. REFER recall of 95.35% significantly exceeds the 75% target.**

| Metric                                 | Result          | Target  |
| -------------------------------------- | --------------- | ------- |
| Combined REFER recall                  | **95.35%**      | ≥75% ✅ |
| Lupus Erythematosus REFER recall       | **88.9%**       | —       |
| Pityriasis Rubra Pilaris REFER recall  | **88.0%**       | —       |
| Critical errors (REFER→MANAGE LOCALLY) | **2 out of 90** | ≤3 ✅   |
| FST V vs FST VI accuracy gap           | **11.36%**      | <15% ✅ |

Two-stage safety logic: confidence threshold (0.35) routes low-confidence predictions to UNCERTAIN → REFER; a REFER override threshold (0.60) forces escalation when any REFER class probability exceeds 0.60. Only 2 critical misclassifications occurred (both pityriasis rubra pilaris cases predicted as MANAGE LOCALLY).

### Telemedicine Referral Interface

**Objective:** Implement a telemedicine referral interface enabling rural health center staff to connect flagged refer cases with urban-based dermatologists for remote consultation, with integrated case documentation to enable continuous system improvement.

✅ **Achieved.** Full end-to-end workflow deployed at [https://dermo.vercel.app](https://dermo.vercel.app):

- GP creates patient consultation → uploads skin image → AI triage result in ~1.5–3s
- REFER outcome triggers specialist appointment request with SMS notification
- Specialist approves → LiveKit video teleconsultation launched, SMS sent to both parties
- Post-call: specialist writes clinical review → case closed with disposition recorded
- Specialist review queue allows post-hoc label correction for continuous model improvement
- Consent PIN workflow (via SMS) gates image entry into the admin retraining dataset

### Clinical Utility Evaluation

**Objective:** Evaluate the system's clinical utility through simulated validation with medical consultants, comparing AI triage performance against the established general practitioner baseline of 58–70% sensitivity, and assessing telemedicine workflow feasibility.

⏳ **In progress.** Validation sessions with medical consultants are scheduled. The system is fully deployed and ready at [https://dermo.vercel.app](https://dermo.vercel.app).

## Testing Results

### Functional Testing — Authentication

| Screen             | Screenshot                                     |
| ------------------ | ---------------------------------------------- |
| Sign in            | <img src="mockups/new/login.png" width="600">  |
| Sign up / Register | <img src="mockups/new/signup.png" width="600"> |

---

### Functional Testing — Quick Scan (public, no login required)

| Screen                         | Screenshot                                             |
| ------------------------------ | ------------------------------------------------------ |
| Landing page — desktop         | <img src="mockups/new/homepage.png" width="600">       |
| Homepage with scan upload form | <img src="mockups/new/homepage-scan.png" width="600">  |
| Landing page — mobile (PWA)    | <img src="mockups/new/mobile/landing.png" width="280"> |

---

### Functional Testing — All Conditions (different data values)

#### Lupus Erythematosus — REFER · 79.3% confidence · GradCAM heatmap

| Desktop                                                   | Mobile                                                           |
| --------------------------------------------------------- | ---------------------------------------------------------------- |
| <img src="mockups/new/scan-result-lupus.png" width="600"> | <img src="mockups/new/mobile/scan-result-lupus.png" width="280"> |

#### Neurofibromatosis — Manage Locally · 77.5% confidence · GradCAM heatmap

| Desktop                                                               | Mobile                                                                       |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| <img src="mockups/new/scan-result-neurofibromatosis.png" width="600"> | <img src="mockups/new/mobile/scan-result-neurofibromatosis.png" width="280"> |

#### Pityriasis Rubra Pilaris — REFER · 90.0% confidence · GradCAM heatmap

| Desktop                                                        | Mobile                                                                |
| -------------------------------------------------------------- | --------------------------------------------------------------------- |
| <img src="mockups/new/scan-result-pityriasis.png" width="600"> | <img src="mockups/new/mobile/scan-result-pityriasis.png" width="280"> |

#### Psoriasis — Manage Locally · 51.2% confidence · GradCAM heatmap

| Desktop                                                       | Mobile                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------- |
| <img src="mockups/new/scan-result-psoriasis.png" width="600"> | <img src="mockups/new/mobile/scan-result-psoriais.png" width="280"> |

#### Scabies — Manage Locally · 88.3% confidence · GradCAM heatmap

| Desktop                                                     | Mobile                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| <img src="mockups/new/scan-result-scabies.png" width="600"> | <img src="mockups/new/mobile/scan-result-scabies.png" width="280"> |

#### UNCERTAIN — non-skin / low-confidence image · no confidence score · no GradCAM

| Desktop                                                       | Mobile                                                   |
| ------------------------------------------------------------- | -------------------------------------------------------- |
| <img src="mockups/new/scan-result-uncertain.png" width="600"> | <img src="mockups/new/mobile/uncertain.png" width="280"> |

---

### Functional Testing — Clinical Workflow

| Screen                                             | Screenshot                                                      |
| -------------------------------------------------- | --------------------------------------------------------------- |
| GP (General Practitioner) Dashboard                | <img src="mockups/new/doctor-dashboard.png" width="600">        |
| Available Practitioners — Telemedicine             | <img src="mockups/new/available-practitioners.png" width="600"> |
| Book Appointment — request specialist consultation | <img src="mockups/new/book-form.png" width="600">               |

---

### Functional Testing — Admin

| Screen                                                  | Screenshot                                                 |
| ------------------------------------------------------- | ---------------------------------------------------------- |
| Admin Dashboard — national system overview              | <img src="mockups/new/admin-dashboard.png" width="600">    |
| Admin Images — consented images for model retraining    | <img src="mockups/new/admin-images.png" width="600">       |
| Practitioners management — approve/reject registrations | <img src="mockups/new/practitioners-page.png" width="600"> |

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
