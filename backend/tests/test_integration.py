"""
Integration tests for the DermoAI triage pipeline.

These tests validate the full logic chain from preprocessing through
inference and triage decision, as well as the HTTP surface from upload
to final response. All external I/O (Cloudinary, DB, real model inference)
is mocked; the triage logic itself runs as real code.
"""
import uuid
from unittest.mock import AsyncMock, patch

import numpy as np
import pytest


# ---------------------------------------------------------------------------
# Logic-level integration (no HTTP, no DB)
# ---------------------------------------------------------------------------


class TestTriageLogicPipeline:
    """
    Exercise the pipeline: _get_predictions mock → predict_with_details →
    classify_urgency, verifying the two-stage logic works end-to-end.
    """

    def test_manage_locally_pipeline_neurofibromatosis(self):
        """High-confidence neurofibromatosis → normal path → MANAGE LOCALLY."""
        from app.services.ml_service import predict_with_details, classify_urgency

        probs = np.array([0.05, 0.80, 0.05, 0.05, 0.05], dtype=np.float32)
        with patch("app.services.ml_service._get_predictions", return_value=probs):
            details = predict_with_details("fake://image.jpg")

        assert details["predicted_condition"] == "neurofibromatosis"
        assert details["triage_stage"] == "NORMAL_PREDICTION"

        urgency = classify_urgency(details["predicted_condition"], details["confidence"])
        assert urgency == "MANAGE LOCALLY"

    def test_manage_locally_pipeline_scabies(self):
        """High-confidence scabies → MANAGE LOCALLY."""
        from app.services.ml_service import predict_with_details

        probs = np.array([0.05, 0.05, 0.05, 0.05, 0.80], dtype=np.float32)
        with patch("app.services.ml_service._get_predictions", return_value=probs):
            details = predict_with_details("fake://image.jpg")

        assert details["predicted_condition"] == "scabies"
        assert details["urgency"] == "MANAGE LOCALLY"

    def test_refer_pipeline_stage2_override(self):
        """lupus > 0.60 → Stage 2 override → REFER without going through Stage 1."""
        from app.services.ml_service import predict_with_details

        probs = np.array([0.65, 0.10, 0.10, 0.10, 0.05], dtype=np.float32)
        with patch("app.services.ml_service._get_predictions", return_value=probs):
            details = predict_with_details("fake://image.jpg")

        assert details["predicted_condition"] == "lupus_erythematosus"
        assert details["triage_stage"] == "STAGE_2_REFER_OVERRIDE"
        assert details["urgency"] == "REFER"

    def test_stage1_fires_before_stage2(self):
        """
        When max prob < 0.35, Stage 1 fires and returns UNCERTAIN even if a REFER
        class would otherwise trigger Stage 2 (it can't since values are too low).
        """
        from app.services.ml_service import predict_with_details

        # All values below 0.35 — Stage 1 fires first
        probs = np.array([0.30, 0.15, 0.15, 0.20, 0.20], dtype=np.float32)
        with patch("app.services.ml_service._get_predictions", return_value=probs):
            details = predict_with_details("fake://image.jpg")

        assert details["predicted_condition"] == "UNCERTAIN"
        assert details["triage_stage"] == "STAGE_1_LOW_CONFIDENCE"
        assert details["urgency"] == "REFER"

    def test_stage2_does_not_fire_below_override_threshold(self):
        """REFER class at 0.55 (below 0.60 override threshold) → normal prediction."""
        from app.services.ml_service import predict_with_details

        # lupus at 0.55: above Stage 1 threshold (0.35) but below override threshold (0.60)
        probs = np.array([0.55, 0.10, 0.15, 0.10, 0.10], dtype=np.float32)
        with patch("app.services.ml_service._get_predictions", return_value=probs):
            details = predict_with_details("fake://image.jpg")

        # argmax=0 (lupus), Stage 2 not triggered (0.55 < 0.60), normal prediction
        assert details["predicted_condition"] == "lupus_erythematosus"
        assert details["triage_stage"] == "NORMAL_PREDICTION"

    def test_aggregation_pipeline_majority_vote(self):
        """Aggregate multiple predictions: majority condition + mean confidence."""
        from app.services.ml_service import aggregate_predictions

        images = [
            {"predicted_condition": "psoriasis", "confidence": 0.80},
            {"predicted_condition": "psoriasis", "confidence": 0.72},
            {"predicted_condition": "neurofibromatosis", "confidence": 0.65},
        ]
        result = aggregate_predictions(images)

        assert result["final_predicted_condition"] == "psoriasis"
        assert result["final_confidence"] == pytest.approx((0.80 + 0.72 + 0.65) / 3, abs=1e-3)
        assert result["urgency"] == "MANAGE LOCALLY"

    def test_aggregation_refer_majority_overrides_manage_locally(self):
        """If REFER condition wins the majority vote, urgency is REFER."""
        from app.services.ml_service import aggregate_predictions

        images = [
            {"predicted_condition": "pityriasis_rubra_pilaris", "confidence": 0.72},
            {"predicted_condition": "pityriasis_rubra_pilaris", "confidence": 0.68},
            {"predicted_condition": "scabies", "confidence": 0.80},
        ]
        result = aggregate_predictions(images)

        assert result["final_predicted_condition"] == "pityriasis_rubra_pilaris"
        assert result["urgency"] == "REFER"


# ---------------------------------------------------------------------------
# HTTP-level integration (endpoint → service mock → response)
# ---------------------------------------------------------------------------


class TestHttpIntegrationFlow:
    def test_upload_to_manage_locally_response(self, client, png_bytes):
        """
        End-to-end HTTP flow: PNG upload → mock service returns psoriasis →
        response carries MANAGE LOCALLY urgency and NORMAL_PREDICTION stage.
        """
        scan_result = {
            "image_id": uuid.uuid4(),
            "image_url": "https://cdn.example.com/img.jpg",
            "predicted_condition": "psoriasis",
            "confidence": 0.82,
            "urgency": "MANAGE LOCALLY",
            "consent_to_reuse": False,
            "all_probabilities": {
                "lupus_erythematosus": 0.05,
                "neurofibromatosis": 0.05,
                "pityriasis_rubra_pilaris": 0.05,
                "psoriasis": 0.82,
                "scabies": 0.03,
            },
            "model_version": "2.0",
            "model_date": "2026-03-05",
            "triage_stage": "NORMAL_PREDICTION",
            "gradcam_base64": None,
            "gradcam_metrics": None,
        }
        with patch("app.services.image_service.quick_scan", new=AsyncMock(return_value=scan_result)):
            resp = client.post(
                "/api/triage/scan",
                files={"file": ("skin.png", png_bytes, "image/png")},
            )

        assert resp.status_code == 200
        data = resp.json()
        assert data["urgency"] == "MANAGE LOCALLY"
        assert data["triage_stage"] == "NORMAL_PREDICTION"
        assert data["confidence"] == pytest.approx(0.82, abs=1e-3)

    def test_upload_to_urgent_refer_response(self, client, png_bytes):
        """
        End-to-end HTTP flow: PNG upload → Stage 2 REFER override →
        response carries REFER urgency.
        """
        scan_result = {
            "image_id": uuid.uuid4(),
            "image_url": "https://cdn.example.com/urgent.jpg",
            "predicted_condition": "lupus_erythematosus",
            "confidence": 0.75,
            "urgency": "REFER",
            "consent_to_reuse": True,
            "all_probabilities": {
                "lupus_erythematosus": 0.75,
                "neurofibromatosis": 0.10,
                "pityriasis_rubra_pilaris": 0.05,
                "psoriasis": 0.05,
                "scabies": 0.05,
            },
            "model_version": "2.0",
            "model_date": "2026-03-05",
            "triage_stage": "STAGE_2_REFER_OVERRIDE",
            "gradcam_base64": None,
            "gradcam_metrics": None,
        }
        with patch("app.services.image_service.quick_scan", new=AsyncMock(return_value=scan_result)):
            resp = client.post(
                "/api/triage/scan?consent_to_reuse=true",
                files={"file": ("urgent.png", png_bytes, "image/png")},
            )

        assert resp.status_code == 200
        data = resp.json()
        assert data["urgency"] == "REFER"
        assert data["triage_stage"] == "STAGE_2_REFER_OVERRIDE"

    def test_upload_uncertain_low_confidence(self, client, png_bytes):
        """
        Low-confidence image → Stage 1 UNCERTAIN → response urgency REFER
        (safety-first referral), gradcam_base64 is null.
        """
        scan_result = {
            "image_id": uuid.uuid4(),
            "image_url": "https://cdn.example.com/blurry.jpg",
            "predicted_condition": "UNCERTAIN",
            "confidence": 0.22,
            "urgency": "REFER",
            "consent_to_reuse": False,
            "all_probabilities": {
                "lupus_erythematosus": 0.22,
                "neurofibromatosis": 0.20,
                "pityriasis_rubra_pilaris": 0.20,
                "psoriasis": 0.20,
                "scabies": 0.18,
            },
            "model_version": "2.0",
            "model_date": "2026-03-05",
            "triage_stage": "STAGE_1_LOW_CONFIDENCE",
            "gradcam_base64": None,
            "gradcam_metrics": None,
        }
        with patch("app.services.image_service.quick_scan", new=AsyncMock(return_value=scan_result)):
            resp = client.post(
                "/api/triage/scan",
                files={"file": ("blurry.png", png_bytes, "image/png")},
            )

        assert resp.status_code == 200
        data = resp.json()
        assert data["predicted_condition"] == "UNCERTAIN"
        assert data["urgency"] == "REFER"
        assert data["triage_stage"] == "STAGE_1_LOW_CONFIDENCE"
        assert data["gradcam_base64"] is None

    def test_history_requires_login(self, client):
        """History endpoint rejects unauthenticated requests with 401."""
        resp = client.get("/api/triage/history")

        assert resp.status_code == 401

    def test_authenticated_history_returns_list(self, auth_client):
        """Authenticated history request returns a JSON array."""
        with patch("app.services.image_service.list_for_user", new=AsyncMock(return_value=[])):
            resp = auth_client.get("/api/triage/history")

        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


# ---------------------------------------------------------------------------
# Edge-case integration
# ---------------------------------------------------------------------------


class TestEdgeCases:
    def test_probabilities_with_all_equal_values_is_uncertain(self):
        """Perfectly uniform distribution (1/5 each) is below threshold → UNCERTAIN."""
        from app.services.ml_service import predict_with_details

        probs = np.array([0.2, 0.2, 0.2, 0.2, 0.2], dtype=np.float32)
        with patch("app.services.ml_service._get_predictions", return_value=probs):
            result = predict_with_details("fake://image")

        assert result["predicted_condition"] == "UNCERTAIN"
        assert result["urgency"] == "REFER"

    def test_single_class_dominates_with_certainty(self):
        """Near-certain single-class prediction returns that class."""
        from app.services.ml_service import predict_with_details

        probs = np.array([0.001, 0.001, 0.001, 0.996, 0.001], dtype=np.float32)
        with patch("app.services.ml_service._get_predictions", return_value=probs):
            result = predict_with_details("fake://image")

        assert result["predicted_condition"] == "psoriasis"
        assert result["confidence"] > 0.99

    def test_refer_override_threshold_boundary_not_triggered(self):
        """REFER class at exactly 0.60 is NOT strictly greater than 0.60 → no override."""
        from app.services.ml_service import predict_with_details

        # lupus at exactly 0.60 — should NOT trigger Stage 2 (threshold is strict >)
        probs = np.array([0.60, 0.10, 0.10, 0.10, 0.10], dtype=np.float32)
        with patch("app.services.ml_service._get_predictions", return_value=probs):
            result = predict_with_details("fake://image")

        # Normal prediction: argmax=0 (lupus), triage_stage is NORMAL_PREDICTION
        assert result["predicted_condition"] == "lupus_erythematosus"
        assert result["triage_stage"] == "NORMAL_PREDICTION"

    def test_refer_override_just_above_threshold(self):
        """REFER class at 0.601 > 0.60 → Stage 2 fires."""
        from app.services.ml_service import predict_with_details

        probs = np.array([0.601, 0.10, 0.099, 0.10, 0.10], dtype=np.float32)
        with patch("app.services.ml_service._get_predictions", return_value=probs):
            result = predict_with_details("fake://image")

        assert result["predicted_condition"] == "lupus_erythematosus"
        assert result["triage_stage"] == "STAGE_2_REFER_OVERRIDE"

    def test_aggregation_single_none_confidence_excluded(self):
        """Entries missing confidence are excluded from the mean calculation."""
        from app.services.ml_service import aggregate_predictions

        images = [
            {"predicted_condition": "psoriasis", "confidence": 0.80},
            {"predicted_condition": "psoriasis", "confidence": None},
        ]
        result = aggregate_predictions(images)

        # Mean should use only the valid confidence
        assert result["final_confidence"] == pytest.approx(0.80, abs=1e-3)

    def test_no_file_in_scan_request_gives_validation_error(self, client):
        resp = client.post("/api/triage/scan", data={})

        assert resp.status_code == 422
        error_body = resp.json()
        assert "detail" in error_body
