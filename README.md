# DermoAI

AI-assisted dermatological triage for resource-limited settings. The system classifies skin images into clinically meaningful condition categories and maps predictions to URGENT or NON-URGENT triage, with a focus on Fitzpatrick Skin Types (FST) V–VI to address known performance gaps in dermatology AI on darker skin tones.

**Repository:** [https://github.com/reponseashimwe/dermoai](https://github.com/reponseashimwe/dermoai)

**Live application:**

- Frontend (Vercel): [https://dermo.vercel.app/](https://dermo.vercel.app/)
- Backend API (Render): [https://dermoai-24lz.onrender.com](https://dermoai-24lz.onrender.com)

---

## Description

DermoAI is a full-stack application that combines:

1. **Condition classification** — A MobileNetV2 CNN (Keras/TensorFlow) trained on FST V–VI data classifies skin images into eight condition classes (e.g. malignant, benign neoplastic, eczematous dermatitis).
2. **Rule-based urgency mapping** — Predicted condition, confidence, and a malignant probability threshold determine URGENT vs NON_URGENT for referral decisions.
3. **Clinical workflow** — Quick scan, consultations with image upload/attach, practitioner review queue, clinical reviews, and teleconsultation (LiveKit).

**Tools and technologies:**

| Layer   | Technologies |
|--------|----------------|
| ML/Data | Python, TensorFlow/Keras, Jupyter, Fitzpatrick17k and ISIC (FST V–VI), Pandas, OpenCV, Albumentations |
| Backend | FastAPI, PostgreSQL (asyncpg), SQLAlchemy, Cloudinary (images), LiveKit (video), JWT auth |
| Frontend | Next.js 14+, TypeScript, React Query, Axios, Tailwind CSS, PWA-capable |

---

## Development Environment Setup

Requirements:

- **Python 3.10+** (backend and ML/data scripts)
- **Node.js 18+** and npm (frontend)
- **PostgreSQL 14+** (local or remote)
- **Git**

### 1. Clone the repository

```bash
git clone https://github.com/reponseashimwe/dermoai.git
cd dermoai
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/` (copy from `backend/.env.example`). Required and optional variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection (asyncpg driver) | `postgresql+asyncpg://postgres:password@localhost:5432/dermoai` |
| `SECRET_KEY` | JWT signing secret | `your-secret-key-change-in-production` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime | `7` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | From [Cloudinary](https://cloudinary.com) dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary API key | |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | |
| `CORS_ORIGINS` | Allowed frontend origins (JSON array) | `["http://localhost:3000"]` |
| `LIVEKIT_URL` | LiveKit server URL (WebSocket) | `wss://your-project.livekit.cloud` |
| `LIVEKIT_API_KEY` | LiveKit API key | From [LiveKit Cloud](https://cloud.livekit.io) |
| `LIVEKIT_API_SECRET` | LiveKit API secret | |
| `SEED_ADMIN_EMAIL` | (Optional) Admin email to seed on first run | `admin@example.com` or leave empty |
| `SEED_ADMIN_PASSWORD` | (Optional) Admin password for seed | |
| `SEED_ADMIN_NAME` | (Optional) Admin display name | `Admin` |

Run migrations and start the API (migrations run on startup):

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be at `http://localhost:8000`. Health check: `GET http://localhost:8000/health`.

### 3. Frontend setup

From the project root:

```bash
cd frontend
npm install
```

Create `.env.local` (or `.env`) in `frontend/` (copy from `frontend/.env.example`):

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000` (local) or `https://dermoai-24lz.onrender.com` (production) |
| `NEXT_PUBLIC_LIVEKIT_URL` | LiveKit WebSocket URL for teleconsultation | `wss://your-project.livekit.cloud` (from LiveKit Cloud) |

Start the development server:

```bash
npm run dev
```

The app will be at `http://localhost:3000`.

### 4. ML model (for triage/scan)

The backend expects a trained Keras model for inference. Place the exported model and class names in the repository as:

- `models/final/best_model.keras` (or `dermoai_final_model.keras`)
- `models/final/class_names.json`

These are produced by running the training notebook `notebooks/04_model_training.ipynb`. Without these files, the scan/triage endpoints will fail at startup.

### 5. Optional: data and notebooks (ML pipeline)

For dataset download, filtering, and training:

```bash
# From project root
pip install -r requirements.txt
python src/data/download.py --dataset fitzpatrick17k
python src/data/filter.py --dataset fitzpatrick17k
```

Then run the Jupyter notebooks in order: `01_data_exploration.ipynb`, `02_condition_classification_strategy.ipynb`, `03_data_augmentation.ipynb`, `04_model_training.ipynb`. See `docs/PROJECT_REPORT.md` for details.

**Note:** ISIC metadata (`data/raw/isic/isic_metadata.csv`) is large (~112 MB) and not in the repo; see the [data README](data/raw/isic/README.md) or the project Google Drive folder for full data.

---

## Designs and Screenshots

Application interfaces and flows are captured in the [screenshots](screenshots) directory.

| File | Description |
|------|-------------|
| `01-homepage.png` | Landing / home page and quick scan entry |
| `02-scan.png` | Quick scan upload |
| `03-scan-result.png` | Scan result with condition and urgency |
| `04-sign-in.png`, `05-sign-up.png` | Authentication |
| `06-dashboard-practitioner.png`, `07-dashboard-specialist.png` | Practitioner and specialist dashboards |
| `08-create-consultation.png`, `09-consultation.png`, `10-consultation.png` | Consultations |
| `11-available-practitioners.png` | Available practitioners |
| `12-incoming-call.png` | Incoming teleconsultation request |
| `13-video-call.png` | Video call (LiveKit) |
| `14-review-queue.png`, `15-review.png`, `add-review.png` | Review queue and clinical review |

**Home**

![Home](screenshots/01-homepage.png)

**Scan result**

![Scan result](screenshots/03-scan-result.png)

**Video call (teleconsultation)**

![Video call](screenshots/13-video-call.png)

**Review queue**

![Review queue](screenshots/14-review-queue.png)

**Video demo (5–10 minutes):** A walkthrough of the application and its functionalities is available here:

- [DermoAI Video Demo](https://drive.google.com/drive/folders/1xOsam4Ctrd44eHeENncgpYg6180lFXp7)

The video focuses on demonstrating app functionality rather than extended research description.

---

## Deployment Plan

### Frontend (Vercel)

1. Connect the GitHub repository [reponseashimwe/dermoai](https://github.com/reponseashimwe/dermoai) to Vercel.
2. Set the **Root Directory** to `frontend`.
3. Configure environment variables in Vercel:
   - `NEXT_PUBLIC_API_URL` = `https://dermoai-24lz.onrender.com` (or your backend URL)
   - `NEXT_PUBLIC_LIVEKIT_URL` = your LiveKit WebSocket URL (e.g. `wss://your-project.livekit.cloud`)
4. Build command: `npm run build`. Output: default Next.js (no override needed).
5. Deploy; the live frontend is [https://dermo.vercel.app/](https://dermo.vercel.app/).

### Backend (Render)

1. Create a **Web Service** on Render linked to the same GitHub repo.
2. Set **Root Directory** to `backend` (if applicable).
3. Build: `pip install -r requirements.txt` (or leave empty if Render infers from root).
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Add a **PostgreSQL** database on Render and use its URL in `DATABASE_URL`.
6. Set environment variables in the Render dashboard (see `backend/.env.example` for the full list):
   - `DATABASE_URL` (from Render PostgreSQL; use `postgresql+asyncpg://...` format)
   - `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `CORS_ORIGINS` = `["https://dermo.vercel.app"]`
   - `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` (required for teleconsultation; use your LiveKit Cloud URL)
   - Optional: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` to seed an admin on first deploy
7. The backend is deployed at [https://dermoai-24lz.onrender.com](https://dermoai-24lz.onrender.com).

### Model artifact

The backend needs `models/final/best_model.keras` and `models/final/class_names.json` at runtime. Options:

- Commit the model artifacts to the repo (if size allows), or
- Build them in a CI step and attach as build artifacts, or
- Store in cloud storage and download at container startup.

Ensure the Render service has access to these files (or the path configured in the app) so `/api/triage/scan` and consultation image uploads work.

---

## Video Demo

A video demonstration (minimum 5 minutes, maximum 10 minutes) of DermoAI is provided in the following folder:

**[DermoAI – Video Demo (Google Drive)](https://drive.google.com/drive/folders/1xOsam4Ctrd44eHeENncgpYg6180lFXp7)**

Content emphasizes a practical walkthrough of app functionalities (quick scan, consultations, review queue, telemedicine, admin) rather than lengthy introductory or research material.

---

## Repository structure (summary)

```
dermoai/
├── backend/          # FastAPI app (API, auth, DB, ML inference, Cloudinary, LiveKit)
├── frontend/         # Next.js app (dashboard, scan, consultations, review, admin)
├── notebooks/       # 01 EDA, 02 condition strategy, 03 augmentation, 04 training
├── src/data/        # download.py, filter.py (FST V–VI datasets)
├── results/         # EDA, classification, augmentation outputs
├── models/final/    # best_model.keras, class_names.json (from notebook 04)
├── screenshots/     # App interface screenshots
└── docs/            # PROJECT_REPORT.md (detailed documentation)
```

---

## Citations

**Fitzpatrick17k:** Groh, M., et al. (2021). Evaluating Deep Neural Networks Trained on Clinical Images in Dermatology with the Fitzpatrick 17k Dataset. CVPR 2021.

**ISIC:** Combalia, M., et al. (2019). BCN20000: Dermoscopic Lesions in the Wild. arXiv:1908.02288.

**LiveKit:** LiveKit. Open-source real-time communication platform for voice and video. [https://livekit.io](https://livekit.io). Used for teleconsultation (specialist video calls).

---

## License

Scripts and application code: MIT License. Datasets: see individual dataset licenses (research use only).
