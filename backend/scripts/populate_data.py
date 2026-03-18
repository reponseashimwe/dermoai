#!/usr/bin/env python3
"""
Demo data population script for DermoAI.

Run from backend/ with the virtualenv activated:
    cd backend && source .venv/bin/activate && python scripts/populate_data.py

Uses real HTTP API calls (so all business logic fires) then backdates
timestamps via SQLAlchemy so data appears spread over the last 7 days.
"""

import asyncio
import os
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import time

import httpx

# ── Path setup ────────────────────────────────────────────────────────────────
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load .env explicitly before importing app modules (handles running from any CWD)
_env_path = Path(__file__).parent.parent / ".env"
if _env_path.exists():
    with open(_env_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _, _v = _line.partition("=")
                if _k.strip() and _k.strip() not in os.environ:
                    os.environ[_k.strip()] = _v.strip()

from sqlalchemy import select  # noqa: E402

from app.core.database import async_session  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.models.appointment_request import AppointmentRequest  # noqa: E402
from app.models.clinical_review import ClinicalReview  # noqa: E402
from app.models.consent_pin import ConsentPin  # noqa: E402
from app.models.consultation import Consultation  # noqa: E402
from app.models.image import Image  # noqa: E402
from app.models.notification import Notification  # noqa: E402
from app.models.patient import Patient  # noqa: E402
from app.models.teleconsultation import Teleconsultation  # noqa: E402

# ── Config ────────────────────────────────────────────────────────────────────
BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
DATA_DIR = Path(__file__).parent.parent.parent / "data" / "test"


def _parse_freeze_time(value: str) -> datetime | None:
    """Parse Settings.FREEZE_TIME (ISO date or datetime) into an aware UTC datetime."""
    v = (value or "").strip()
    if not v:
        return None
    try:
        dt = datetime.fromisoformat(v)
    except ValueError:
        # Allow plain YYYY-MM-DD
        if len(v) == 10:
            dt = datetime.fromisoformat(v + "T23:59:59")
        else:
            raise
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


# Single source of truth for "current time" in demo data.
# If FREEZE_TIME is set, all timestamps are capped at that value. Otherwise, cap at real now.
MAX_TIME_UTC: datetime = _parse_freeze_time(settings.FREEZE_TIME) or datetime.now(timezone.utc)

# ── Triage mapping (mirrors models/final/triage_mapping.json) ─────────────────
TRIAGE_MAPPING = {
    "lupus_erythematosus":      "REFER",
    "pityriasis_rubra_pilaris": "REFER",
    "UNCERTAIN":                "REFER",
    "neurofibromatosis":        "MANAGE LOCALLY",
    "psoriasis":                "MANAGE LOCALLY",
    "scabies":                  "MANAGE LOCALLY",
}

DIAGNOSIS_MAP = {
    "psoriasis":                "Psoriasis vulgaris",
    "scabies":                  "Scabies infestation",
    "lupus_erythematosus":      "Discoid lupus erythematosus",
    "pityriasis_rubra_pilaris": "Pityriasis rubra pilaris",
    "neurofibromatosis":        "Neurofibromatosis type 1",
    "UNCERTAIN":                "Uncertain — differential diagnosis pending",
}

TREATMENT_MAP = {
    "psoriasis":                "Topical corticosteroids (betamethasone 0.1%) twice daily × 4 weeks. Moisturise daily.",
    "scabies":                  "Permethrin 5% cream overnight. Treat all household contacts simultaneously.",
    "neurofibromatosis":        "No immediate treatment. Annual monitoring. Patient education provided.",
    "lupus_erythematosus":      "Hydroxychloroquine 200mg daily. Sun protection. Follow-up in 4 weeks.",
    "pityriasis_rubra_pilaris": "Topical emollients and corticosteroids. Referral for acitretin if no improvement.",
    "UNCERTAIN":                "Watchful waiting. Topical emollient applied. Follow-up scheduled in 2 weeks.",
}

# ── Seeded practitioners (from seed.py) ───────────────────────────────────────
GPs = [
    {"email": "dr.mutesi@dermoai.rw", "password": "Doctor@123"},
    {"email": "dr.uwase@dermoai.rw",  "password": "Doctor@123"},
    {"email": "doctor@dermoai.rw",    "password": "Doctor@123"},
]
SPECIALISTS = [
    {"email": "specialist@dermoai.rw",  "password": "Doctor@123"},
    {"email": "dr.kagabo@dermoai.rw",   "password": "Doctor@123"},
    {"email": "dr.ingabire@dermoai.rw", "password": "Doctor@123"},
]

# ── Patient users (6, self-registered) ───────────────────────────────────────
PATIENT_USERS = [
    {"name": "Alice Uwimana",   "email": "alice@dermoai.rw",   "password": "Patient@123",
     "phone": "+250781000001", "district": "Huye",      "province": "Southern"},
    {"name": "Bob Nkurunziza",  "email": "bob@dermoai.rw",     "password": "Patient@123",
     "phone": "+250781000002", "district": "Musanze",   "province": "Northern"},
    {"name": "Claire Mukamana", "email": "claire@dermoai.rw",  "password": "Patient@123",
     "phone": "+250781000003", "district": "Rubavu",    "province": "Western"},
    {"name": "David Habimana",  "email": "david@dermoai.rw",   "password": "Patient@123",
     "phone": "+250781000004", "district": "Rwamagana", "province": "Eastern"},
    {"name": "Eva Kageruka",    "email": "eva@dermoai.rw",     "password": "Patient@123",
     "phone": "+250781000005", "district": "Nyanza",    "province": "Southern"},
    {"name": "Frank Bizimana",  "email": "frank@dermoai.rw",   "password": "Patient@123",
     "phone": "+250781000006", "district": "Karongi",   "province": "Western"},
]

# ── Balanced locations across all 5 provinces (no Kigali bias) ───────────────
RWANDA_LOCATIONS = [
    # Kigali (3)
    {"district": "Nyarugenge", "province": "Kigali"},
    {"district": "Gasabo",     "province": "Kigali"},
    {"district": "Kicukiro",   "province": "Kigali"},
    # Eastern (5)
    {"district": "Rwamagana",  "province": "Eastern"},
    {"district": "Bugesera",   "province": "Eastern"},
    {"district": "Ngoma",      "province": "Eastern"},
    {"district": "Nyagatare",  "province": "Eastern"},
    {"district": "Kayonza",    "province": "Eastern"},
    # Northern (4)
    {"district": "Musanze",    "province": "Northern"},
    {"district": "Rulindo",    "province": "Northern"},
    {"district": "Gakenke",    "province": "Northern"},
    {"district": "Gicumbi",    "province": "Northern"},
    # Southern (5)
    {"district": "Huye",       "province": "Southern"},
    {"district": "Nyamagabe",  "province": "Southern"},
    {"district": "Muhanga",    "province": "Southern"},
    {"district": "Nyanza",     "province": "Southern"},
    {"district": "Ruhango",    "province": "Southern"},
    # Western (4)
    {"district": "Rubavu",     "province": "Western"},
    {"district": "Karongi",    "province": "Western"},
    {"district": "Rusizi",     "province": "Western"},
    {"district": "Nyabihu",    "province": "Western"},
]

# 37 GP patients (GP1=13, GP2=12, GP3=12)
PATIENTS_PER_GP = [13, 12, 12]

PATIENT_NAMES_GP = [
    # GP 1 — 13 patients
    "Jean Mutabazi",           "Marie Uwimana",          "Pierre Nkurunziza",
    "Sophie Mukamana",         "Emmanuel Habimana",       "Grace Kageruka",
    "Patrick Bizimana",        "Diane Uwase",             "Felix Niyonzima",
    "Consolata Mukamurenzi",   "Théodore Nsengimana",     "Bernadette Mukagasana",
    "Alain Ndahiro",
    # GP 2 — 12 patients
    "Théophile Ndayishimiye",  "Beatrice Ingabire",       "Joseph Ntakirutimana",
    "Agnes Mukashyaka",        "Cyprien Nzeyimana",       "Immaculée Uwera",
    "Sylvain Habyarimana",     "Odette Mukamazimpaka",    "Etienne Habiyambere",
    "Françoise Nikuze",        "Léon Ndorukwigira",       "Jacqueline Uwamungu",
    # GP 3 — 12 patients
    "Donatien Bizumuremyi",    "Vestine Uwingabire",      "Faustin Nzabanita",
    "Yvonne Mukagahana",       "Célestin Habimana",       "Julienne Mukantagara",
    "Rémy Nshimiyimana",       "Annonciate Uwase",        "Valens Bizimana",
    "Clarisse Nyiraminani",    "Modeste Habineza",        "Solange Mukamuganga",
]

PHONE_NUMBERS_GP = [
    "+250788000001", "+250788000002", "+250788000003", "+250788000004", "+250788000005",
    "+250788000006", "+250788000007", "+250788000008", "+250788000009", "+250788000010",
    "+250788000011", "+250788000012", "+250788000013", "+250788000014", "+250788000015",
    "+250788000016", "+250788000017", "+250788000018", "+250788000019", "+250788000020",
    "+250788000021", "+250788000022", "+250788000023", "+250788000024", "+250788000025",
    "+250788000026", "+250788000027", "+250788000028", "+250788000029", "+250788000030",
    "+250788000031", "+250788000032", "+250788000033", "+250788000034", "+250788000035",
    "+250788000036", "+250788000037",
]

assert len(PATIENT_NAMES_GP) == sum(PATIENTS_PER_GP), \
    f"Need {sum(PATIENTS_PER_GP)} names, got {len(PATIENT_NAMES_GP)}"
assert len(PHONE_NUMBERS_GP) == sum(PATIENTS_PER_GP), \
    f"Need {sum(PATIENTS_PER_GP)} phones, got {len(PHONE_NUMBERS_GP)}"

# 43 consultations total (37 GP + 6 patient), 1 image each
IMG_COUNTS = [1] * (sum(PATIENTS_PER_GP) + len(PATIENT_USERS))
assert sum(IMG_COUNTS) == 43, f"IMG_COUNTS sums to {sum(IMG_COUNTS)}, expected 43"

# ── Consultation path assignment (index-based, deterministic) ─────────────────
# Cycle of 10: 5 TELEMEDICINE, 4 LOCAL, 1 REFERRED
# mod in {0,1,4,5,8} → TELEMEDICINE (~50%)
# mod in {2,3,6,7}   → LOCAL        (~40%)
# mod == 9            → REFERRED     (~10%)
_TELE_MODS  = {0, 1, 4, 5, 8}
_LOCAL_MODS = {2, 3, 6, 7}


def get_path(gp_consult_index: int) -> str:
    """Return TELEMEDICINE, LOCAL, or REFERRED for a GP consultation index."""
    mod = gp_consult_index % 10
    if mod in _TELE_MODS:
        return "TELEMEDICINE"
    elif mod in _LOCAL_MODS:
        return "LOCAL"
    else:
        return "REFERRED"


# ── Urgency derivation (mirrors ml_service.classify_urgency logic) ────────────
def derive_urgency(condition: str | None, triage_stage: str | None) -> str:
    if triage_stage in ("STAGE_1_LOW_CONFIDENCE", "STAGE_2_REFER_OVERRIDE"):
        return "REFER"
    if condition is None:
        return "REFER"
    return TRIAGE_MAPPING.get(condition, "REFER")


# ── HTTP helpers ──────────────────────────────────────────────────────────────
_RETRYABLE = (httpx.ReadTimeout, httpx.ConnectTimeout, httpx.ReadError, httpx.ConnectError)
_RETRY_STATUS = {502, 503, 504}


def _retry(fn, *args, retries: int = 8, delay: float = 15.0, **kwargs):
    """Call fn(*args, **kwargs), retrying on transient network errors or 5xx gateway responses."""
    for attempt in range(retries):
        try:
            r = fn(*args, **kwargs)
        except _RETRYABLE as exc:
            if attempt == retries - 1:
                raise
            wait = delay * (attempt + 1)
            print(f"    ↺ {type(exc).__name__} — retrying in {wait:.0f}s ({attempt + 1}/{retries - 1})")
            time.sleep(wait)
            continue
        if r.status_code in _RETRY_STATUS and attempt < retries - 1:
            wait = delay * (attempt + 1)
            print(f"    ↺ HTTP {r.status_code} — retrying in {wait:.0f}s ({attempt + 1}/{retries - 1})")
            time.sleep(wait)
            continue
        return r
    return r  # last attempt result


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def login(client: httpx.Client, email: str, password: str) -> str:
    r = _retry(client.post, f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    r.raise_for_status()
    return r.json()["access_token"]


def register_user(client: httpx.Client, name: str, email: str, password: str,
                  phone: str | None = None) -> str:
    payload: dict = {"name": name, "email": email, "password": password, "role": "USER"}
    if phone:
        payload["phone_number"] = phone
    r = _retry(client.post, f"{BASE_URL}/api/auth/register", json=payload)
    if r.status_code in (400, 409, 422):
        return login(client, email, password)
    r.raise_for_status()
    return r.json()["access_token"]


def get_me(client: httpx.Client, token: str) -> dict:
    r = _retry(client.get, f"{BASE_URL}/api/users/me", headers=_auth(token))
    r.raise_for_status()
    return r.json()


def get_specialists(client: httpx.Client, token: str) -> list[dict]:
    r = _retry(
        client.get,
        f"{BASE_URL}/api/practitioners/available",
        params={"practitioner_type": "SPECIALIST", "online_only": "false"},
        headers=_auth(token),
    )
    r.raise_for_status()
    return r.json()


def create_patient(client: httpx.Client, token: str, name: str, phone: str,
                   district: str, province: str, user_id: str | None = None) -> dict:
    payload: dict = {"name": name, "phone_number": phone,
                     "district": district, "province": province}
    if user_id:
        payload["user_id"] = user_id
    r = _retry(client.post, f"{BASE_URL}/api/patients/", json=payload, headers=_auth(token))
    r.raise_for_status()
    return r.json()


def create_consultation(client: httpx.Client, token: str, patient_id: str) -> dict:
    r = _retry(
        client.post,
        f"{BASE_URL}/api/consultations/",
        json={"patient_id": patient_id},
        headers=_auth(token),
    )
    r.raise_for_status()
    return r.json()


def upload_image(client: httpx.Client, token: str, consultation_id: str,
                 img_path: Path) -> dict:
    r = None
    for attempt in range(5):
        try:
            with open(img_path, "rb") as f:
                r = client.post(
                    f"{BASE_URL}/api/images/upload",
                    params={"consultation_id": consultation_id, "include_gradcam": "false"},
                    files={"file": (img_path.name, f, "image/jpeg")},
                    headers=_auth(token),
                    timeout=300.0,
                )
        except _RETRYABLE as exc:
            if attempt == 4:
                raise
            wait = 8.0 * (attempt + 1)
            print(f"    ↺ upload {type(exc).__name__} — retrying in {wait:.0f}s ({attempt + 1}/4)")
            time.sleep(wait)
            continue
        if r.status_code in _RETRY_STATUS and attempt < 4:
            wait = 8.0 * (attempt + 1)
            print(f"    ↺ upload HTTP {r.status_code} — retrying in {wait:.0f}s ({attempt + 1}/4)")
            time.sleep(wait)
            continue
        break
    if r is None or r.status_code >= 500:
        print(f"    ⚠ upload failed ({r.status_code if r else 'no response'}) for {img_path.name} — skipping")
        return {}
    r.raise_for_status()
    return r.json()


def quick_scan(client: httpx.Client, token: str | None, img_path: Path,
               consent: bool = False) -> dict:
    headers = _auth(token) if token else {}
    r = None
    for attempt in range(5):
        try:
            with open(img_path, "rb") as f:
                r = client.post(
                    f"{BASE_URL}/api/triage/scan",
                    params={"include_gradcam": "false", "consent_to_reuse": str(consent).lower()},
                    files={"file": (img_path.name, f, "image/jpeg")},
                    headers=headers,
                    timeout=300.0,
                )
        except _RETRYABLE as exc:
            if attempt == 4:
                raise
            wait = 8.0 * (attempt + 1)
            print(f"    ↺ scan {type(exc).__name__} — retrying in {wait:.0f}s ({attempt + 1}/4)")
            time.sleep(wait)
            continue
        if r.status_code in _RETRY_STATUS and attempt < 4:
            wait = 8.0 * (attempt + 1)
            print(f"    ↺ scan HTTP {r.status_code} — retrying in {wait:.0f}s ({attempt + 1}/4)")
            time.sleep(wait)
            continue
        break
    if r is None or r.status_code >= 500:
        print(f"    ⚠ quick scan failed ({r.status_code if r else 'no response'}) for {img_path.name} — skipping")
        return {}
    r.raise_for_status()
    return r.json()


def create_review(client: httpx.Client, token: str, consultation_id: str,
                  diagnosis: str, treatment_plan: str | None,
                  notes: str, is_final: bool) -> dict:
    r = _retry(
        client.post,
        f"{BASE_URL}/api/clinical-reviews/",
        json={"consultation_id": consultation_id, "diagnosis": diagnosis,
              "treatment_plan": treatment_plan, "notes": notes, "is_final": is_final},
        headers=_auth(token),
    )
    r.raise_for_status()
    return r.json()


def update_consultation(client: httpx.Client, token: str, cid: str, **fields) -> dict:
    r = _retry(
        client.put,
        f"{BASE_URL}/api/consultations/{cid}",
        json=fields,
        headers=_auth(token),
    )
    r.raise_for_status()
    return r.json()


def create_appointment(client: httpx.Client, token: str, consultation_id: str,
                       specialist_id: str, proposed_datetime: str, notes: str) -> dict:
    r = _retry(
        client.post,
        f"{BASE_URL}/api/appointments/request",
        json={"consultation_id": consultation_id, "specialist_id": specialist_id,
              "proposed_datetime": proposed_datetime, "notes": notes},
        headers=_auth(token),
    )
    r.raise_for_status()
    return r.json()


def approve_appointment(client: httpx.Client, spec_token: str, request_id: str) -> dict:
    r = _retry(
        client.patch,
        f"{BASE_URL}/api/appointments/{request_id}/approve",
        headers=_auth(spec_token),
    )
    r.raise_for_status()
    return r.json()


def reject_appointment(client: httpx.Client, spec_token: str,
                       request_id: str, reason: str) -> dict:
    r = _retry(
        client.patch,
        f"{BASE_URL}/api/appointments/{request_id}/reject",
        json={"rejection_reason": reason},
        headers=_auth(spec_token),
    )
    r.raise_for_status()
    return r.json()


def start_call(client: httpx.Client, gp_token: str, request_id: str) -> str:
    r = _retry(
        client.post,
        f"{BASE_URL}/api/appointments/{request_id}/start-call",
        headers=_auth(gp_token),
    )
    r.raise_for_status()
    return str(r.json()["teleconsultation_id"])


def accept_teleconsult(client: httpx.Client, spec_token: str, tcid: str) -> dict:
    r = _retry(
        client.post,
        f"{BASE_URL}/api/teleconsultations/{tcid}/accept",
        headers=_auth(spec_token),
    )
    r.raise_for_status()
    return r.json()


def end_teleconsult(client: httpx.Client, token: str, tcid: str) -> dict:
    r = _retry(
        client.post,
        f"{BASE_URL}/api/teleconsultations/{tcid}/end",
        headers=_auth(token),
    )
    r.raise_for_status()
    return r.json()


def complete_appointment(client: httpx.Client, spec_token: str, request_id: str) -> dict:
    r = _retry(
        client.patch,
        f"{BASE_URL}/api/appointments/{request_id}/complete",
        headers=_auth(spec_token),
    )
    r.raise_for_status()
    return r.json()


def set_image_consent(client: httpx.Client, token: str, image_id: str) -> None:
    try:
        r = _retry(
            client.patch,
            f"{BASE_URL}/api/images/{image_id}/consent",
            json={"consent_to_reuse": True},
            headers=_auth(token),
        )
        if r.status_code >= 400:
            pass  # non-fatal
    except _RETRYABLE:
        pass  # non-fatal


def create_direct_teleconsult(client: httpx.Client, token: str,
                               consultation_id: str | None,
                               specialist_id: str) -> dict:
    payload: dict = {"specialist_id": specialist_id, "source": "DIRECT"}
    if consultation_id:
        payload["consultation_id"] = consultation_id
    r = _retry(
        client.post,
        f"{BASE_URL}/api/teleconsultations/",
        json=payload,
        headers=_auth(token),
    )
    r.raise_for_status()
    return r.json()


def list_unreviewed_images(client: httpx.Client, token: str) -> list[dict]:
    """Fetch all images in the review queue (allowed_review=True, no reviewed_label)."""
    results = []
    skip = 0
    limit = 100
    while True:
        r = _retry(
            client.get,
            f"{BASE_URL}/api/images/unreviewed",
            params={"skip": skip, "limit": limit},
            headers=_auth(token),
        )
        r.raise_for_status()
        data = r.json()
        items = data.get("items", [])
        results.extend(items)
        if len(results) >= data.get("total", 0) or not items:
            break
        skip += limit
    return results


def review_image(client: httpx.Client, token: str, image_id: str, label: str) -> None:
    try:
        r = _retry(
            client.patch,
            f"{BASE_URL}/api/images/{image_id}",
            json={"reviewed_label": label},
            headers=_auth(token),
        )
        if r.status_code >= 400:
            pass  # non-fatal
    except _RETRYABLE:
        pass  # non-fatal


# ── Data cleanup ─────────────────────────────────────────────────────────────
async def cleanup_data() -> None:
    """Delete all demo data (teleconsultations, appointments, reviews, images, consultations, patients)."""
    from sqlalchemy import delete as _delete
    async with async_session() as session:
        # Delete in FK-safe order (children before parents)
        await session.execute(_delete(Teleconsultation))
        await session.execute(_delete(AppointmentRequest))
        await session.execute(_delete(ClinicalReview))
        await session.execute(_delete(Image))
        await session.execute(_delete(Notification))
        await session.execute(_delete(ConsentPin))
        await session.execute(_delete(Consultation))
        await session.execute(_delete(Patient))
        await session.commit()
    print("✓ Cleaned up existing demo data")


# ── Timestamp backdating ──────────────────────────────────────────────────────
async def backdate_timestamps() -> None:
    random.seed(99)
    async with async_session() as session:
        now = MAX_TIME_UTC
        week_ago = now - timedelta(days=7)

        for Model, time_col in [
            (Patient,            "created_at"),
            (Consultation,       "created_at"),
            (Image,              "uploaded_at"),
            (ClinicalReview,     "created_at"),
            (AppointmentRequest, "created_at"),
            (Teleconsultation,   "created_at"),
        ]:
            rows = (await session.execute(select(Model))).scalars().all()
            for i, row in enumerate(rows):
                base = week_ago + timedelta(
                    seconds=(i / max(len(rows), 1)) * 7 * 24 * 3600
                )
                jitter = timedelta(minutes=random.randint(-90, 90))
                setattr(row, time_col, base + jitter)

        for appt in (await session.execute(select(AppointmentRequest))).scalars().all():
            appt.proposed_datetime = week_ago + timedelta(
                seconds=random.uniform(0.3, 0.95) * 7 * 24 * 3600
            )

        await session.commit()
    print("✓ Timestamps backdated across last 7 days")


# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    random.seed(42)

    print("── Cleaning up existing data ──")
    asyncio.run(cleanup_data())
    # Dispose the connection pool so the next asyncio.run() gets a fresh pool on its loop
    from app.core.database import engine as _engine
    _engine.sync_engine.dispose()

    if not DATA_DIR.exists():
        print(f"✗ Test data directory not found: {DATA_DIR}")
        sys.exit(1)

    all_images = sorted(DATA_DIR.rglob("*.jpg"))
    if not all_images:
        print(f"✗ No .jpg images found in {DATA_DIR}")
        sys.exit(1)
    if len(all_images) < 50:
        print(f"⚠ Only {len(all_images)} images found (expected 50); proceeding anyway")

    random.shuffle(all_images)
    QUICK_SCAN_COUNT = 7
    consultation_images = all_images[:-QUICK_SCAN_COUNT]  # 43 images
    quick_scan_images   = all_images[-QUICK_SCAN_COUNT:]   # 7 images
    img_iter = iter(consultation_images)

    total_gp_consults    = sum(PATIENTS_PER_GP)   # 37
    total_consults       = total_gp_consults + len(PATIENT_USERS)  # 43
    print(f"✓ Found {len(all_images)} images  ({len(consultation_images)} for consultations, "
          f"{len(quick_scan_images)} for quick scans)")
    print(f"✓ Planned: {total_gp_consults} GP consultations + {len(PATIENT_USERS)} patient = {total_consults} total")

    with httpx.Client(timeout=300.0) as client:

        # ── Login practitioners ───────────────────────────────────────────────
        print("\n── Logging in practitioners ──")
        gp_tokens: list[str] = []
        for gp in GPs:
            t = login(client, gp["email"], gp["password"])
            gp_tokens.append(t)
            print(f"  ✓ GP: {gp['email']}")

        spec_tokens: list[str] = []
        for sp in SPECIALISTS:
            t = login(client, sp["email"], sp["password"])
            spec_tokens.append(t)
            print(f"  ✓ Specialist: {sp['email']}")

        # ── Get specialist practitioner IDs ───────────────────────────────────
        spec_list = get_specialists(client, gp_tokens[0])
        email_to_prac_id = {s["email"]: s["practitioner_id"] for s in spec_list}
        # Keep the same order as SPECIALISTS so spec_prac_ids[i] matches spec_tokens[i]
        spec_prac_ids = [
            email_to_prac_id[sp["email"]]
            for sp in SPECIALISTS
            if sp["email"] in email_to_prac_id
        ]
        if not spec_prac_ids:
            print("✗ No specialists returned — ensure the server is seeded and running")
            sys.exit(1)
        print(f"\n  ✓ {len(spec_prac_ids)} specialist(s) available")

        # ── Register patient users (6) ────────────────────────────────────────
        print("\n── Registering patient users ──")
        patient_tokens: list[str] = []
        patient_user_ids: list[str] = []
        for pu in PATIENT_USERS:
            t = register_user(client, pu["name"], pu["email"], pu["password"], phone=pu["phone"])
            patient_tokens.append(t)
            me = get_me(client, t)
            patient_user_ids.append(me["user_id"])
            print(f"  ✓ {pu['email']}")

        # ── GP: 37 patients + 37 consultations ───────────────────────────────
        print(f"\n── GP patients & consultations ({len(GPs)} GPs, {PATIENTS_PER_GP} patients each) ──")
        appointments_queue: list[dict] = []
        consented_images: list[tuple[str, str]] = []
        loc_idx  = 0
        name_idx = 0
        gp_consult_index = 0   # used for path assignment

        for gp_idx, (gp_token, gp) in enumerate(zip(gp_tokens, GPs)):
            gp_label   = gp["email"].split("@")[0]
            n_patients = PATIENTS_PER_GP[gp_idx]

            gp_patients = []
            for _ in range(n_patients):
                loc = RWANDA_LOCATIONS[loc_idx % len(RWANDA_LOCATIONS)]
                loc_idx += 1
                pat = create_patient(
                    client, gp_token,
                    name=PATIENT_NAMES_GP[name_idx],
                    phone=PHONE_NUMBERS_GP[name_idx],
                    district=loc["district"],
                    province=loc["province"],
                )
                gp_patients.append(pat)
                name_idx += 1

            for local_idx in range(n_patients):
                patient = gp_patients[local_idx]
                consult = create_consultation(client, gp_token, patient["patient_id"])
                cid     = consult["consultation_id"]

                # Upload 1 image
                res = {}
                try:
                    img_path = next(img_iter)
                    res = upload_image(client, gp_token, cid, img_path)
                    if res:
                        consented_images.append((res["image_id"], gp_token))
                except StopIteration:
                    print("  ⚠ Ran out of consultation images!")

                condition    = res.get("predicted_condition") or "UNCERTAIN" if res else "UNCERTAIN"
                confidence   = res.get("confidence") or 0.0 if res else 0.0
                triage_stage = res.get("triage_stage") if res else None
                diagnosis    = DIAGNOSIS_MAP.get(condition, DIAGNOSIS_MAP["UNCERTAIN"])
                treatment    = TREATMENT_MAP.get(condition)

                # Deterministic path assignment
                path = get_path(gp_consult_index)
                gp_consult_index += 1

                if path == "LOCAL":
                    notes = "Managed locally. Diagnosis based on clinical presentation and AI analysis. Treatment initiated."
                    create_review(client, gp_token, cid, diagnosis, treatment, notes, is_final=False)
                    update_consultation(
                        client, gp_token, cid,
                        urgency="NON_URGENT",
                        disposition="TREATED_LOCALLY",
                        got_treatment=True,
                        status="CLOSED",
                    )

                elif path == "TELEMEDICINE":
                    notes = "Teleconsultation recommended. Patient briefed. Specialist appointment arranged."
                    create_review(client, gp_token, cid, diagnosis, treatment, notes, is_final=False)
                    update_consultation(client, gp_token, cid, urgency="NON_URGENT")
                    spec_id    = spec_prac_ids[gp_consult_index % len(spec_prac_ids)]
                    spec_token = spec_tokens[gp_consult_index % len(spec_tokens)]
                    appointments_queue.append({
                        "cid":        cid,
                        "gp_token":   gp_token,
                        "gp_label":   gp_label,
                        "spec_id":    spec_id,
                        "spec_token": spec_token,
                        "condition":  condition,
                        "diagnosis":  diagnosis,
                        "treatment":  treatment,
                    })

                else:  # REFERRED_TO_CLINIC — physical clinic referral
                    notes = "Patient referred to specialist clinic for in-person assessment. Referral letter issued."
                    create_review(client, gp_token, cid, diagnosis, treatment, notes, is_final=False)
                    update_consultation(
                        client, gp_token, cid,
                        urgency="REFER",
                        disposition="REFERRED_TO_CLINIC",
                        status="CLOSED",
                    )

                print(
                    f"  ✓ [{gp_label}] consult={cid[:8]} | "
                    f"{condition} ({confidence * 100:.0f}%) | {path} | "
                    + ("1 image" if res else "no image")
                )

        # ── Patient users: self-create patient records + consultations (6) ────
        print("\n── Patient user consultations (6) ──")
        for i, (pu, pt_token) in enumerate(zip(PATIENT_USERS, patient_tokens)):
            pat = create_patient(
                client, pt_token,
                name=pu["name"], phone=pu["phone"],
                district=pu["district"], province=pu["province"],
                user_id=patient_user_ids[i],
            )
            consult = create_consultation(client, pt_token, pat["patient_id"])
            cid     = consult["consultation_id"]

            res = {}
            try:
                img_path = next(img_iter)
                res = upload_image(client, pt_token, cid, img_path)
                if res:
                    consented_images.append((res["image_id"], pt_token))
            except StopIteration:
                print("  ⚠ Ran out of consultation images!")

            if res:
                condition    = res.get("predicted_condition") or "UNCERTAIN"
                confidence   = res.get("confidence") or 0.0
                triage_stage = res.get("triage_stage")
                urgency      = derive_urgency(condition, triage_stage)
                if urgency == "MANAGE LOCALLY":
                    update_consultation(
                        client, pt_token, cid,
                        urgency="NON_URGENT",
                        disposition="TREATED_LOCALLY",
                        got_treatment=True,
                        status="CLOSED",
                    )
                else:
                    update_consultation(client, pt_token, cid, urgency="REFER")
                print(
                    f"  ✓ [{pu['email'].split('@')[0]}] consult={cid[:8]} | "
                    f"{condition} ({confidence * 100:.0f}%) | {urgency}"
                )
            else:
                print(f"  ✓ [{pu['email'].split('@')[0]}] consult={cid[:8]} | no image")

        # ── Process telemedicine appointments ─────────────────────────────────
        n_total = len(appointments_queue)
        print(f"\n── Processing {n_total} telemedicine appointment(s) ──")

        # Outcome distribution: ~70% completed, ~20% pending, ~10% rejected
        n_rejected = max(1, round(n_total * 0.10))
        n_pending  = max(1, round(n_total * 0.20))
        n_complete = n_total - n_rejected - n_pending

        reject_set  = set(range(n_total - n_rejected, n_total))
        pending_set = set(range(n_total - n_rejected - n_pending, n_total - n_rejected))

        now_utc = MAX_TIME_UTC
        for i, info in enumerate(appointments_queue):
            proposed_dt = (now_utc + timedelta(hours=24 + i * 2)).isoformat()
            appt = create_appointment(
                client, info["gp_token"], info["cid"],
                info["spec_id"], proposed_dt,
                notes="Patient referred for teleconsultation.",
            )
            request_id = appt["request_id"]

            if i in reject_set:
                reject_appointment(
                    client, info["spec_token"], request_id,
                    reason="Specialist unavailable — please reschedule.",
                )
                print(f"  ✗ [{info['gp_label']}] appt={request_id[:8]} REJECTED")
                continue

            if i in pending_set:
                print(f"  ⏳ [{info['gp_label']}] appt={request_id[:8]} PENDING")
                continue

            # Full flow: approve → start call → accept → end → complete
            approve_appointment(client, info["spec_token"], request_id)
            tcid = start_call(client, info["gp_token"], request_id)
            accept_teleconsult(client, info["spec_token"], tcid)
            end_teleconsult(client, info["gp_token"], tcid)
            complete_appointment(client, info["spec_token"], request_id)

            # Specialist writes final review
            spec_notes = (
                "Specialist teleconsultation completed. "
                "Diagnosis reviewed and confirmed. Treatment plan updated."
            )
            create_review(
                client, info["spec_token"], info["cid"],
                info["diagnosis"], info["treatment"],
                spec_notes, is_final=True,
            )
            update_consultation(
                client, info["gp_token"], info["cid"],
                disposition="TELEMEDICINE_ONLY",
                status="CLOSED",
            )
            print(
                f"  ✓ [{info['gp_label']}] appt={request_id[:8]} COMPLETED"
                f" → tc={tcid[:8]}"
            )

        # ── Direct patient teleconsultations (3) ─────────────────────────────
        print("\n── Direct patient teleconsultations (3) ──")
        direct_spec_id    = spec_prac_ids[0]
        direct_spec_token = spec_tokens[0]

        for i in range(3):
            pt_token = patient_tokens[i]
            pt_label = PATIENT_USERS[i]["email"].split("@")[0]
            tc   = create_direct_teleconsult(client, pt_token, None, direct_spec_id)
            tcid = tc["teleconsultation_id"]

            if i == 0:
                accept_teleconsult(client, direct_spec_token, tcid)
                end_teleconsult(client, pt_token, tcid)
                print(f"  ✓ [{pt_label}] direct tc {tcid[:8]} → COMPLETED")
            else:
                print(f"  ✓ [{pt_label}] direct tc {tcid[:8]} → PENDING")

        # ── Quick scans (7 images) ────────────────────────────────────────────
        print("\n── Quick scans (7 images) ──")
        for i, img in enumerate(quick_scan_images):
            token = patient_tokens[i % len(patient_tokens)] if i >= 3 else None
            label = PATIENT_USERS[i % len(patient_tokens)]["email"].split("@")[0] if i >= 3 else "anonymous"
            give_consent = token is not None and (i % 3 != 2)
            result = quick_scan(client, token, img, consent=give_consent)
            if result:
                cond = result.get("predicted_condition", "?")
                conf = result.get("confidence", 0.0)
                urg  = result.get("urgency", "?")
                print(f"  ✓ [{label}] {img.name[:28]} → {cond} ({conf * 100:.0f}%) | {urg}"
                      + (" [consented]" if give_consent else ""))

        # ── Consent on consultation images (~75%) ─────────────────────────────
        random.seed(77)
        consent_targets = [item for item in consented_images if random.random() < 0.75]
        print(f"\n── Setting consent on {len(consent_targets)}/{len(consented_images)} images (75%) ──")
        for image_id, owner_token in consent_targets:
            set_image_consent(client, owner_token, image_id)
        print(f"  ✓ Consent granted on {len(consent_targets)} images")

        # ── Review queue: review 70% of unreviewed images ─────────────────────
        print("\n── Reviewing images in review queue (70%) ──")
        reviewer_token = spec_tokens[0]
        unreviewed = list_unreviewed_images(client, reviewer_token)
        random.seed(55)
        random.shuffle(unreviewed)
        review_count = round(len(unreviewed) * 0.70)
        for img in unreviewed[:review_count]:
            label = img.get("predicted_condition") or "UNCERTAIN"
            review_image(client, reviewer_token, str(img["image_id"]), label)
        print(f"  ✓ Reviewed {review_count}/{len(unreviewed)} images in queue")

    # ── Backdate timestamps ───────────────────────────────────────────────────
    print("\n── Backdating timestamps ──")
    asyncio.run(backdate_timestamps())

    print("\n" + "=" * 60)
    print("✓ Demo data population complete!")
    print(f"  Patients (GP-created):   {sum(PATIENTS_PER_GP)}  ({len(GPs)} GPs × {PATIENTS_PER_GP})")
    print(f"  Patients (self-linked):   {len(PATIENT_USERS)}")
    print(f"  Total patients:          {sum(PATIENTS_PER_GP) + len(PATIENT_USERS)}")
    print(f"  Consultations:           {total_consults}  (1 image each)")
    print(f"    LOCAL (TREATED_LOCALLY):  ~{round(total_gp_consults * 0.4)}")
    print(f"    TELEMEDICINE:             ~{n_total}  ({n_complete} completed, {n_pending} pending, {n_rejected} rejected)")
    print(f"    REFERRED_TO_CLINIC:        ~{round(total_gp_consults * 0.1)}")
    print(f"  Images (total):          50  (43 consult + 7 quick scan)")
    print(f"  Direct teleconsults:      3  (1 completed, 2 pending)")
    print("=" * 60)


if __name__ == "__main__":
    main()
