# DermoAI — Backend

FastAPI backend for the DermoAI clinical decision-support system.

Full project documentation and setup context: [root README](../README.md).

**Live API:** https://dermoai-24lz.onrender.com
**Swagger UI:** https://dermoai-24lz.onrender.com/docs

## Quick start

Requirements: Python 3.10+, PostgreSQL 14+.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env` (copy `.env.example` and fill in values):

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/dermoai
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

MISTA_API_KEY=

CORS_ORIGINS=http://localhost:3000

SEED_ADMIN_EMAIL=admin@dermoai.com
SEED_ADMIN_PASSWORD=changeme
SEED_ADMIN_NAME=Admin
```

Place model files in `../models/final/` before starting:

```
models/final/best_model.keras
models/final/class_names.json
models/final/triage_mapping.json
```

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Migrations and seed data (admin account + demo data) run automatically on startup. Swagger UI at `http://localhost:8000/docs`.

## Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI app factory; lifespan runs migrations + seeding
│   ├── core/
│   │   ├── config.py    # Pydantic Settings (reads .env)
│   │   ├── database.py  # Async SQLAlchemy engine + session factory
│   │   ├── security.py  # JWT HS256 sign / verify
│   │   └── deps.py      # Auth dependency injection: get_current_user, require_role
│   ├── models/          # 13 SQLAlchemy ORM entities
│   ├── schemas/         # Pydantic v2 request / response models
│   ├── routers/         # 16 FastAPI routers (all prefixed /api/{resource})
│   └── services/        # Business logic
│       ├── ml_service.py              # EfficientNetB0 inference + GradCAM
│       ├── image_service.py           # Upload, triage, review queue
│       ├── consultation_service.py    # GP consultation lifecycle
│       ├── teleconsultation_service.py# LiveKit room management
│       ├── consent_service.py         # PIN-based SMS consent flow
│       ├── sms_service.py             # MISTA SMS gateway
│       ├── cloudinary_service.py      # Image upload / delete
│       └── notification_service.py    # Urgent-case alerts
├── alembic/             # DB migration scripts
├── scripts/
│   └── populate_data.py # Demo data seeding
├── tests/
├── requirements.txt
└── requirements-test.txt
```

## API overview

| Resource            | Prefix                      | Notes                                      |
| ------------------- | --------------------------- | ------------------------------------------ |
| Auth                | `/api/auth`                 | register, login, refresh token             |
| Users               | `/api/users`                | me, update, list (admin), deactivate       |
| Patients            | `/api/patients`             | CRUD, link to consultation                 |
| Practitioners       | `/api/practitioners`        | profile, pending approvals, approve/reject |
| Consultations       | `/api/consultations`        | CRUD, ML result aggregation                |
| Images              | `/api/images`               | upload, quick scan attach, review queue    |
| Triage              | `/api/triage`               | public quick scan, history                 |
| Clinical Reviews    | `/api/clinical-reviews`     | post-consultation specialist write-up      |
| Teleconsultations   | `/api/teleconsultations`    | LiveKit room lifecycle, SMS notifications  |
| Appointments        | `/api/appointments`         | booking, approval, cancellation            |
| Consent             | `/api/consent`              | PIN generation, PIN verification           |
| Notifications       | `/api/notifications`        | per-user alert feed                        |
| Stats               | `/api/stats`                | admin system metrics                       |
| Conditions          | `/api/conditions`           | ML class metadata                          |
| Retraining Logs     | `/api/retraining-logs`      | admin retraining pipeline records          |
| WebSocket           | `/ws`                       | real-time broadcast (teleconsultation)     |

Full interactive docs: `http://localhost:8000/docs`

## Tests

```bash
pip install -r requirements-test.txt
pytest
```

| File | Coverage |
| ---- | -------- |
| `test_ml_service.py` | Two-stage triage logic — UNCERTAIN threshold, REFER override, per-class routing |
| `test_preprocessing.py` | Image loading from file and URL, RGBA/greyscale → RGB coercion, output tensor shape |
| `test_triage_endpoint.py` | `POST /api/triage/scan` and `GET /api/triage/history` — auth, schema validation, mocked I/O |
| `test_integration.py` | Full pipeline: preprocessing → inference → triage decision → HTTP response |

All external I/O (database, Cloudinary, ML model) is mocked. Tests run without a live database or network connection.

## Database migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Auto-generate a new migration after model changes
alembic revision --autogenerate -m "description"
```

## ML model

- **Architecture:** EfficientNetB0 (ImageNet pretrained), 224×224 RGB input
- **Classes:** Lupus Erythematosus, Neurofibromatosis, Pityriasis Rubra Pilaris, Psoriasis, Scabies
- **Triage:** REFER / MANAGE LOCALLY via confidence thresholds; below 0.35 → UNCERTAIN → REFER
- **GradCAM:** generated on-the-fly per request via `ml_service.predict_with_gradcam()`
- Loaded once at startup; all inference is in-memory

## Auth

JWT HS256. Access tokens expire after 30 minutes; refresh tokens after 7 days.
Payload: `{ sub: user_id, role, type: "access"|"refresh", exp }`.

Roles: `USER`, `PRACTITIONER` (sub-types: `GENERAL`, `SPECIALIST`), `ADMIN`.
Practitioner accounts require admin approval before login is permitted.
