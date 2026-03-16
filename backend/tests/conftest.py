"""Shared pytest fixtures for DermoAI test suite."""
import io
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest
from PIL import Image


# ---------------------------------------------------------------------------
# Image helpers
# ---------------------------------------------------------------------------


def _make_png_bytes(width: int = 10, height: int = 10) -> bytes:
    """Create a minimal valid RGB PNG as bytes."""
    img = Image.new("RGB", (width, height), color=(100, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def png_bytes() -> bytes:
    """Minimal 10×10 RGB PNG as raw bytes."""
    return _make_png_bytes()


@pytest.fixture
def png_file_obj(png_bytes):
    """BytesIO wrapping a valid PNG image."""
    return io.BytesIO(png_bytes)


@pytest.fixture
def tmp_png_path(tmp_path, png_bytes):
    """PNG file written to a temp directory; returns the path as a string."""
    p = tmp_path / "test_image.png"
    p.write_bytes(png_bytes)
    return str(p)


# ---------------------------------------------------------------------------
# Probability-vector fixtures
#   CLASS_NAMES order (from class_names.json):
#     0 = lupus_erythematosus    (REFER)
#     1 = neurofibromatosis      (MANAGE LOCALLY)
#     2 = pityriasis_rubra_pilaris (REFER)
#     3 = psoriasis              (MANAGE LOCALLY)
#     4 = scabies                (MANAGE LOCALLY)
#
#   Thresholds: CONFIDENCE_THRESHOLD = 0.35, REFER_OVERRIDE_THRESHOLD = 0.60
# ---------------------------------------------------------------------------


@pytest.fixture
def probs_normal():
    """psoriasis = 0.80 — high confidence, normal prediction path."""
    return np.array([0.05, 0.05, 0.05, 0.80, 0.05], dtype=np.float32)


@pytest.fixture
def probs_uncertain():
    """All equal at 0.20 — max < 0.35, Stage 1 fires → UNCERTAIN."""
    return np.array([0.20, 0.20, 0.20, 0.20, 0.20], dtype=np.float32)


@pytest.fixture
def probs_refer_override_lupus():
    """lupus = 0.75 > 0.60 — Stage 2 REFER override fires."""
    return np.array([0.75, 0.05, 0.10, 0.05, 0.05], dtype=np.float32)


@pytest.fixture
def probs_refer_override_pityriasis():
    """pityriasis = 0.70 > 0.60 — Stage 2 REFER override fires."""
    return np.array([0.05, 0.05, 0.70, 0.10, 0.10], dtype=np.float32)


@pytest.fixture
def probs_boundary_at_threshold():
    """lupus = 0.36 — safely above threshold (float32(0.35) rounds down to ~0.3499,
    which would trigger Stage 1, so use 0.36 to reliably test the non-uncertain path)."""
    return np.array([0.36, 0.16, 0.16, 0.16, 0.16], dtype=np.float32)


@pytest.fixture
def probs_just_below_threshold():
    """lupus = 0.34 — strictly below threshold, Stage 1 fires → UNCERTAIN."""
    return np.array([0.34, 0.17, 0.17, 0.17, 0.15], dtype=np.float32)


# ---------------------------------------------------------------------------
# Mock user
# ---------------------------------------------------------------------------


class MockUser:
    user_id = uuid.uuid4()
    role = "PRACTITIONER"
    is_active = True
    name = "Test Practitioner"


@pytest.fixture
def mock_user():
    return MockUser()


# ---------------------------------------------------------------------------
# FastAPI TestClient with mocked startup
# ---------------------------------------------------------------------------


@pytest.fixture
def client():
    """
    Sync TestClient with lifespan startup mocked out (no migrations, no
    Cloudinary config, no real DB). Cleans up dependency overrides after
    each test.
    """
    from app.main import app
    from app.core.database import get_db

    async def override_get_db():
        yield AsyncMock()

    app.dependency_overrides[get_db] = override_get_db

    with (
        patch("app.main.run_migrations", new_callable=AsyncMock),
        patch("app.main.run_seed", new_callable=AsyncMock),
        patch("app.main.configure_cloudinary"),
    ):
        from fastapi.testclient import TestClient
        with TestClient(app) as c:
            yield c

    app.dependency_overrides.clear()


@pytest.fixture
def auth_client(client, mock_user):
    """
    TestClient where get_current_user and get_optional_user both return
    mock_user (i.e. the request is authenticated).
    """
    from app.main import app
    from app.core.deps import get_current_user, get_optional_user

    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_optional_user] = lambda: mock_user

    yield client

    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_optional_user, None)
