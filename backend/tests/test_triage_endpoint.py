"""
Tests for the triage API endpoints:
  POST /api/triage/scan   — public, optional auth
  GET  /api/triage/history — requires auth

All external I/O (DB, Cloudinary, ML model) is mocked so the tests run
without a live database or network.
"""
import uuid
from unittest.mock import AsyncMock, patch

import pytest


# Canonical mock response matching QuickScanResponse schema
_IMAGE_ID = uuid.uuid4()
MOCK_SCAN_RESPONSE = {
    "image_id": _IMAGE_ID,
    "image_url": "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    "predicted_condition": "psoriasis",
    "confidence": 0.85,
    "urgency": "MANAGE LOCALLY",
    "consent_to_reuse": False,
    "all_probabilities": {
        "lupus_erythematosus": 0.05,
        "neurofibromatosis": 0.05,
        "pityriasis_rubra_pilaris": 0.05,
        "psoriasis": 0.85,
        "scabies": 0.00,
    },
    "model_version": "2.0",
    "model_date": "2026-03-05",
    "triage_stage": "NORMAL_PREDICTION",
    "gradcam_base64": None,
    "gradcam_metrics": None,
}


# ---------------------------------------------------------------------------
# POST /api/triage/scan
# ---------------------------------------------------------------------------


class TestQuickScanEndpoint:
    def test_returns_200_when_unauthenticated(self, client, png_bytes):
        """Scan endpoint is public — no token required."""
        with patch(
            "app.services.image_service.quick_scan",
            new=AsyncMock(return_value=MOCK_SCAN_RESPONSE),
        ):
            resp = client.post(
                "/api/triage/scan",
                files={"file": ("skin.png", png_bytes, "image/png")},
            )

        assert resp.status_code == 200

    def test_response_contains_required_fields(self, client, png_bytes):
        with patch(
            "app.services.image_service.quick_scan",
            new=AsyncMock(return_value=MOCK_SCAN_RESPONSE),
        ):
            resp = client.post(
                "/api/triage/scan",
                files={"file": ("skin.png", png_bytes, "image/png")},
            )

        data = resp.json()
        for field in ("image_id", "image_url", "predicted_condition", "confidence", "urgency"):
            assert field in data, f"Missing field: {field}"

    def test_response_condition_and_urgency_match(self, client, png_bytes):
        with patch(
            "app.services.image_service.quick_scan",
            new=AsyncMock(return_value=MOCK_SCAN_RESPONSE),
        ):
            resp = client.post(
                "/api/triage/scan",
                files={"file": ("skin.png", png_bytes, "image/png")},
            )

        data = resp.json()
        assert data["predicted_condition"] == "psoriasis"
        assert data["urgency"] == "MANAGE LOCALLY"
        assert data["triage_stage"] == "NORMAL_PREDICTION"

    def test_consent_to_reuse_param_is_forwarded(self, client, png_bytes):
        """consent_to_reuse=true in the query string reaches image_service."""
        mock_qs = AsyncMock(return_value={**MOCK_SCAN_RESPONSE, "consent_to_reuse": True})
        with patch("app.services.image_service.quick_scan", new=mock_qs):
            client.post(
                "/api/triage/scan?consent_to_reuse=true",
                files={"file": ("skin.png", png_bytes, "image/png")},
            )

        mock_qs.assert_called_once()
        assert mock_qs.call_args.kwargs["consent_to_reuse"] is True

    def test_include_gradcam_false_is_forwarded(self, client, png_bytes):
        """include_gradcam=false in query string is forwarded to image_service."""
        mock_qs = AsyncMock(return_value=MOCK_SCAN_RESPONSE)
        with patch("app.services.image_service.quick_scan", new=mock_qs):
            client.post(
                "/api/triage/scan?include_gradcam=false",
                files={"file": ("skin.png", png_bytes, "image/png")},
            )

        assert mock_qs.call_args.kwargs["include_gradcam"] is False

    def test_missing_file_returns_422(self, client):
        """Omitting the file upload should return 422 Unprocessable Entity."""
        resp = client.post("/api/triage/scan")

        assert resp.status_code == 422

    def test_urgent_condition_refer_urgency(self, client, png_bytes):
        """ML predicts REFER class → response urgency is 'REFER'."""
        refer_response = {
            **MOCK_SCAN_RESPONSE,
            "predicted_condition": "lupus_erythematosus",
            "urgency": "REFER",
            "triage_stage": "STAGE_2_REFER_OVERRIDE",
        }
        with patch(
            "app.services.image_service.quick_scan",
            new=AsyncMock(return_value=refer_response),
        ):
            resp = client.post(
                "/api/triage/scan",
                files={"file": ("lesion.png", png_bytes, "image/png")},
            )

        data = resp.json()
        assert data["urgency"] == "REFER"
        assert data["predicted_condition"] == "lupus_erythematosus"
        assert data["triage_stage"] == "STAGE_2_REFER_OVERRIDE"

    def test_uncertain_result_no_gradcam(self, client, png_bytes):
        """Stage 1 uncertain prediction: urgency REFER, gradcam_base64 None."""
        uncertain_response = {
            **MOCK_SCAN_RESPONSE,
            "predicted_condition": "UNCERTAIN",
            "confidence": 0.22,
            "urgency": "REFER",
            "triage_stage": "STAGE_1_LOW_CONFIDENCE",
            "gradcam_base64": None,
        }
        with patch(
            "app.services.image_service.quick_scan",
            new=AsyncMock(return_value=uncertain_response),
        ):
            resp = client.post(
                "/api/triage/scan",
                files={"file": ("blurry.png", png_bytes, "image/png")},
            )

        data = resp.json()
        assert data["predicted_condition"] == "UNCERTAIN"
        assert data["urgency"] == "REFER"
        assert data["gradcam_base64"] is None

    def test_all_probabilities_in_response(self, client, png_bytes):
        with patch(
            "app.services.image_service.quick_scan",
            new=AsyncMock(return_value=MOCK_SCAN_RESPONSE),
        ):
            resp = client.post(
                "/api/triage/scan",
                files={"file": ("skin.png", png_bytes, "image/png")},
            )

        data = resp.json()
        assert data["all_probabilities"] is not None
        assert "psoriasis" in data["all_probabilities"]

    def test_model_metadata_in_response(self, client, png_bytes):
        with patch(
            "app.services.image_service.quick_scan",
            new=AsyncMock(return_value=MOCK_SCAN_RESPONSE),
        ):
            resp = client.post(
                "/api/triage/scan",
                files={"file": ("skin.png", png_bytes, "image/png")},
            )

        data = resp.json()
        assert data["model_version"] == "2.0"
        assert data["model_date"] == "2026-03-05"

    def test_authenticated_scan_succeeds(self, auth_client, png_bytes):
        """Authenticated scans work the same way (optional auth)."""
        with patch(
            "app.services.image_service.quick_scan",
            new=AsyncMock(return_value=MOCK_SCAN_RESPONSE),
        ):
            resp = auth_client.post(
                "/api/triage/scan",
                files={"file": ("skin.png", png_bytes, "image/png")},
            )

        assert resp.status_code == 200

    def test_authenticated_scan_passes_user_id(self, auth_client, mock_user, png_bytes):
        """When authenticated, user_id is forwarded to image_service."""
        mock_qs = AsyncMock(return_value=MOCK_SCAN_RESPONSE)
        with patch("app.services.image_service.quick_scan", new=mock_qs):
            auth_client.post(
                "/api/triage/scan",
                files={"file": ("skin.png", png_bytes, "image/png")},
            )

        assert mock_qs.call_args.kwargs["user_id"] == mock_user.user_id

    def test_image_service_called_once(self, client, png_bytes):
        mock_qs = AsyncMock(return_value=MOCK_SCAN_RESPONSE)
        with patch("app.services.image_service.quick_scan", new=mock_qs):
            client.post(
                "/api/triage/scan",
                files={"file": ("skin.png", png_bytes, "image/png")},
            )

        mock_qs.assert_called_once()


# ---------------------------------------------------------------------------
# GET /api/triage/history
# ---------------------------------------------------------------------------


class TestScanHistoryEndpoint:
    def test_unauthenticated_returns_401(self, client):
        """History endpoint requires a valid Bearer token."""
        resp = client.get("/api/triage/history")

        assert resp.status_code == 401

    def test_authenticated_returns_200(self, auth_client):
        with patch(
            "app.services.image_service.list_for_user",
            new=AsyncMock(return_value=[]),
        ):
            resp = auth_client.get("/api/triage/history")

        assert resp.status_code == 200

    def test_empty_history_is_list(self, auth_client):
        with patch(
            "app.services.image_service.list_for_user",
            new=AsyncMock(return_value=[]),
        ):
            resp = auth_client.get("/api/triage/history")

        assert resp.json() == []

    def test_history_calls_list_for_user_with_correct_user_id(self, auth_client, mock_user):
        mock_list = AsyncMock(return_value=[])
        with patch("app.services.image_service.list_for_user", new=mock_list):
            auth_client.get("/api/triage/history")

        mock_list.assert_called_once()
        assert mock_list.call_args.args[0] == mock_user.user_id
