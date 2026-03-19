"""
Tests for ML inference and two-stage triage decision logic in ml_service.

Two-stage triage recap:
  Stage 1: max(probabilities) < 0.35  → UNCERTAIN → REFER
  Stage 2: any REFER-class prob > 0.60 → force that class → REFER

REFER classes (from triage_mapping.json): lupus_erythematosus,
pityriasis_rubra_pilaris.

CLASS_NAMES order (from class_names.json):
  0 = lupus_erythematosus    (REFER)
  1 = neurofibromatosis      (MANAGE LOCALLY)
  2 = pityriasis_rubra_pilaris (REFER)
  3 = psoriasis              (MANAGE LOCALLY)
  4 = scabies                (MANAGE LOCALLY)
"""
from unittest.mock import patch

import numpy as np
import pytest


# Local constant so tests don't depend on importing the live module for labels
CLASS_NAMES = [
    "lupus_erythematosus",
    "neurofibromatosis",
    "pityriasis_rubra_pilaris",
    "psoriasis",
    "scabies",
]
REFER_CLASSES = {"lupus_erythematosus", "pityriasis_rubra_pilaris"}
MANAGE_LOCALLY_CLASSES = {"neurofibromatosis", "psoriasis", "scabies"}


# ---------------------------------------------------------------------------
# predict()
# ---------------------------------------------------------------------------


class TestPredict:
    def test_normal_prediction_returns_class_name(self, probs_normal):
        """psoriasis = 0.80: high confidence, no REFER override → 'psoriasis'."""
        with patch("app.services.ml_service._get_predictions", return_value=probs_normal):
            from app.services.ml_service import predict
            result = predict("fake://image")

        assert result == "psoriasis"

    def test_stage1_low_confidence_returns_uncertain(self, probs_uncertain):
        """Max prob 0.20 < 0.35 → Stage 1 fires → 'UNCERTAIN'."""
        with patch("app.services.ml_service._get_predictions", return_value=probs_uncertain):
            from app.services.ml_service import predict
            result = predict("fake://image")

        assert result == "UNCERTAIN"

    def test_stage2_refer_override_lupus(self, probs_refer_override_lupus):
        """lupus = 0.75 > 0.60 → Stage 2 override → 'lupus_erythematosus'."""
        with patch("app.services.ml_service._get_predictions", return_value=probs_refer_override_lupus):
            from app.services.ml_service import predict
            result = predict("fake://image")

        assert result == "lupus_erythematosus"

    def test_stage2_refer_override_pityriasis(self, probs_refer_override_pityriasis):
        """pityriasis = 0.70 > 0.60 → Stage 2 override → 'pityriasis_rubra_pilaris'."""
        with patch("app.services.ml_service._get_predictions", return_value=probs_refer_override_pityriasis):
            from app.services.ml_service import predict
            result = predict("fake://image")

        assert result == "pityriasis_rubra_pilaris"

    def test_boundary_exactly_at_threshold_passes_stage1(self, probs_boundary_at_threshold):
        """
        Max prob == 0.36 (safely above 0.35) → Stage 1 does NOT fire.
        Note: float32(0.35) rounds down to ~0.3499, which would trigger Stage 1;
        the fixture uses 0.36 to reliably test the non-uncertain path.
        argmax = 0 (lupus at 0.36); lupus 0.36 is not > 0.60, so normal prediction.
        """
        with patch("app.services.ml_service._get_predictions", return_value=probs_boundary_at_threshold):
            from app.services.ml_service import predict
            result = predict("fake://image")

        assert result == "lupus_erythematosus"

    def test_just_below_threshold_is_uncertain(self, probs_just_below_threshold):
        """Max prob 0.34 < 0.35 → Stage 1 fires → 'UNCERTAIN'."""
        with patch("app.services.ml_service._get_predictions", return_value=probs_just_below_threshold):
            from app.services.ml_service import predict
            result = predict("fake://image")

        assert result == "UNCERTAIN"

    def test_returns_string_type(self, probs_normal):
        with patch("app.services.ml_service._get_predictions", return_value=probs_normal):
            from app.services.ml_service import predict
            result = predict("fake://image")

        assert isinstance(result, str)

    def test_result_is_valid_class_or_uncertain(self, probs_normal):
        valid = set(CLASS_NAMES) | {"UNCERTAIN"}
        with patch("app.services.ml_service._get_predictions", return_value=probs_normal):
            from app.services.ml_service import predict
            result = predict("fake://image")

        assert result in valid

    @pytest.mark.parametrize("idx,expected", [
        (0, "lupus_erythematosus"),
        (1, "neurofibromatosis"),
        (2, "pityriasis_rubra_pilaris"),
        (3, "psoriasis"),
        (4, "scabies"),
    ])
    def test_normal_prediction_each_class(self, idx, expected):
        """When a non-REFER class has the highest confident score, it is returned."""
        probs = np.zeros(5, dtype=np.float32)
        probs[idx] = 0.80
        probs[(idx + 1) % 5] = 0.20
        # Avoid triggering REFER override for REFER classes
        if expected in REFER_CLASSES:
            probs[idx] = 0.50  # above Stage1 threshold but below REFER_OVERRIDE_THRESHOLD
            probs[(idx + 1) % 5] = 0.50

        with patch("app.services.ml_service._get_predictions", return_value=probs):
            from app.services.ml_service import predict
            result = predict("fake://image")

        if expected not in REFER_CLASSES:
            assert result == expected
        else:
            # REFER class at 0.50 is above Stage1 but below Stage2 override,
            # so argmax wins → still that class
            assert result == expected


# ---------------------------------------------------------------------------
# get_confidence()
# ---------------------------------------------------------------------------


class TestGetConfidence:
    def test_returns_max_probability(self, probs_normal):
        with patch("app.services.ml_service._get_predictions", return_value=probs_normal):
            from app.services.ml_service import get_confidence
            conf = get_confidence("fake://image")

        assert conf == pytest.approx(0.80, abs=1e-3)

    def test_returns_python_float(self, probs_uncertain):
        with patch("app.services.ml_service._get_predictions", return_value=probs_uncertain):
            from app.services.ml_service import get_confidence
            conf = get_confidence("fake://image")

        assert isinstance(conf, float)

    def test_confidence_within_unit_interval(self, probs_normal):
        with patch("app.services.ml_service._get_predictions", return_value=probs_normal):
            from app.services.ml_service import get_confidence
            conf = get_confidence("fake://image")

        assert 0.0 <= conf <= 1.0

    def test_uncertain_image_has_low_confidence(self, probs_uncertain):
        with patch("app.services.ml_service._get_predictions", return_value=probs_uncertain):
            from app.services.ml_service import get_confidence
            conf = get_confidence("fake://image")

        assert conf < 0.35


# ---------------------------------------------------------------------------
# classify_urgency()
# ---------------------------------------------------------------------------


class TestClassifyUrgency:
    """Pure-logic tests — no mocking required."""

    @pytest.mark.parametrize("condition,confidence,expected", [
        # UNCERTAIN always → REFER
        ("UNCERTAIN", 0.80, "REFER"),
        ("UNCERTAIN", 0.20, "REFER"),
        # Low confidence always → REFER (regardless of condition)
        ("psoriasis", 0.20, "REFER"),
        ("neurofibromatosis", 0.10, "REFER"),
        ("scabies", 0.34, "REFER"),  # 0.34 < 0.35
        # Exactly at threshold → NOT low confidence → uses mapping
        ("psoriasis", 0.35, "MANAGE LOCALLY"),
        # REFER-mapped conditions
        ("lupus_erythematosus", 0.80, "REFER"),
        ("pityriasis_rubra_pilaris", 0.80, "REFER"),
        # MANAGE LOCALLY-mapped conditions
        ("neurofibromatosis", 0.80, "MANAGE LOCALLY"),
        ("psoriasis", 0.80, "MANAGE LOCALLY"),
        ("scabies", 0.80, "MANAGE LOCALLY"),
        # Unknown condition → defaults to REFER
        ("unknown_xyz", 0.90, "REFER"),
    ])
    def test_urgency_classification(self, condition, confidence, expected):
        from app.services.ml_service import classify_urgency
        assert classify_urgency(condition, confidence) == expected

    def test_return_value_is_refer_or_manage_locally(self):
        from app.services.ml_service import classify_urgency
        valid = {"REFER", "MANAGE LOCALLY"}
        for cls in CLASS_NAMES + ["UNCERTAIN"]:
            result = classify_urgency(cls, 0.80)
            assert result in valid


# ---------------------------------------------------------------------------
# predict_with_details()
# ---------------------------------------------------------------------------


class TestPredictWithDetails:
    def test_returns_all_required_keys(self, probs_normal):
        required = {
            "predicted_condition", "confidence", "urgency",
            "all_probabilities", "model_version", "model_date", "triage_stage",
        }
        with patch("app.services.ml_service._get_predictions", return_value=probs_normal):
            from app.services.ml_service import predict_with_details
            result = predict_with_details("fake://image")

        assert required.issubset(result.keys())

    def test_normal_path_predicted_condition(self, probs_normal):
        with patch("app.services.ml_service._get_predictions", return_value=probs_normal):
            from app.services.ml_service import predict_with_details
            result = predict_with_details("fake://image")

        assert result["predicted_condition"] == "psoriasis"
        assert result["triage_stage"] == "NORMAL_PREDICTION"
        assert result["urgency"] == "MANAGE LOCALLY"

    def test_normal_path_confidence_value(self, probs_normal):
        with patch("app.services.ml_service._get_predictions", return_value=probs_normal):
            from app.services.ml_service import predict_with_details
            result = predict_with_details("fake://image")

        assert result["confidence"] == pytest.approx(0.80, abs=1e-3)

    def test_stage1_low_confidence_path(self, probs_uncertain):
        with patch("app.services.ml_service._get_predictions", return_value=probs_uncertain):
            from app.services.ml_service import predict_with_details
            result = predict_with_details("fake://image")

        assert result["predicted_condition"] == "UNCERTAIN"
        assert result["triage_stage"] == "STAGE_1_LOW_CONFIDENCE"
        assert result["urgency"] == "REFER"
        assert result["confidence"] < 0.35

    def test_stage2_refer_override_path_lupus(self, probs_refer_override_lupus):
        with patch("app.services.ml_service._get_predictions", return_value=probs_refer_override_lupus):
            from app.services.ml_service import predict_with_details
            result = predict_with_details("fake://image")

        assert result["predicted_condition"] == "lupus_erythematosus"
        assert result["triage_stage"] == "STAGE_2_REFER_OVERRIDE"
        assert result["urgency"] == "REFER"
        assert result["confidence"] == pytest.approx(0.75, abs=1e-3)

    def test_stage2_refer_override_path_pityriasis(self, probs_refer_override_pityriasis):
        with patch("app.services.ml_service._get_predictions", return_value=probs_refer_override_pityriasis):
            from app.services.ml_service import predict_with_details
            result = predict_with_details("fake://image")

        assert result["predicted_condition"] == "pityriasis_rubra_pilaris"
        assert result["triage_stage"] == "STAGE_2_REFER_OVERRIDE"
        assert result["urgency"] == "REFER"

    def test_all_probabilities_contains_all_classes(self, probs_normal):
        with patch("app.services.ml_service._get_predictions", return_value=probs_normal):
            from app.services.ml_service import predict_with_details
            result = predict_with_details("fake://image")

        assert set(result["all_probabilities"].keys()) == set(CLASS_NAMES)

    def test_all_probabilities_sum_to_one(self, probs_normal):
        with patch("app.services.ml_service._get_predictions", return_value=probs_normal):
            from app.services.ml_service import predict_with_details
            result = predict_with_details("fake://image")

        total = sum(result["all_probabilities"].values())
        assert total == pytest.approx(1.0, abs=0.01)

    def test_model_metadata_is_present(self, probs_normal):
        with patch("app.services.ml_service._get_predictions", return_value=probs_normal):
            from app.services.ml_service import predict_with_details
            result = predict_with_details("fake://image")

        assert result["model_version"] == "2.0"
        assert result["model_date"] == "2026-03-05"

    def test_confidence_rounded_to_four_decimals(self, probs_normal):
        probs = np.array([0.05, 0.05, 0.05, 0.80123456, 0.04876544], dtype=np.float32)
        with patch("app.services.ml_service._get_predictions", return_value=probs):
            from app.services.ml_service import predict_with_details
            result = predict_with_details("fake://image")

        # str representation should have at most 4 decimal places
        conf_str = f"{result['confidence']:.10f}".rstrip("0")
        decimal_digits = conf_str.split(".")[-1] if "." in conf_str else ""
        assert len(decimal_digits) <= 4

    def test_normal_manage_locally_urgency(self, probs_normal):
        with patch("app.services.ml_service._get_predictions", return_value=probs_normal):
            from app.services.ml_service import predict_with_details
            result = predict_with_details("fake://image")

        assert result["urgency"] == "MANAGE LOCALLY"

    def test_neurofibromatosis_normal_prediction(self):
        probs = np.array([0.05, 0.80, 0.05, 0.05, 0.05], dtype=np.float32)
        with patch("app.services.ml_service._get_predictions", return_value=probs):
            from app.services.ml_service import predict_with_details
            result = predict_with_details("fake://image")

        assert result["predicted_condition"] == "neurofibromatosis"
        assert result["urgency"] == "MANAGE LOCALLY"
        assert result["triage_stage"] == "NORMAL_PREDICTION"

    def test_scabies_normal_prediction(self):
        probs = np.array([0.05, 0.05, 0.05, 0.05, 0.80], dtype=np.float32)
        with patch("app.services.ml_service._get_predictions", return_value=probs):
            from app.services.ml_service import predict_with_details
            result = predict_with_details("fake://image")

        assert result["predicted_condition"] == "scabies"
        assert result["urgency"] == "MANAGE LOCALLY"


# ---------------------------------------------------------------------------
# predict_with_gradcam()
# ---------------------------------------------------------------------------


class TestPredictWithGradcam:
    def test_uncertain_prediction_skips_gradcam(self, probs_uncertain):
        """Low-confidence → UNCERTAIN → GradCAM is skipped."""
        with patch("app.services.ml_service._get_predictions", return_value=probs_uncertain):
            from app.services.ml_service import predict_with_gradcam
            result = predict_with_gradcam("fake://image")

        assert result["predicted_condition"] == "UNCERTAIN"
        assert result["gradcam_base64"] is None
        assert result["gradcam_metrics"] is None
        assert "gradcam_error" in result
        assert "Skipped" in result["gradcam_error"]

    def test_gradcam_failure_does_not_suppress_prediction(self, probs_normal):
        """If GradCAM generation raises, the prediction is still returned."""
        with (
            patch("app.services.ml_service._get_predictions", return_value=probs_normal),
            patch(
                "app.services.explainability_service.generate_gradcam_for_prediction",
                side_effect=RuntimeError("GPU OOM"),
            ),
        ):
            from app.services.ml_service import predict_with_gradcam
            result = predict_with_gradcam("fake://image")

        assert result["predicted_condition"] == "psoriasis"
        assert result["confidence"] == pytest.approx(0.80, abs=1e-3)

    def test_gradcam_failure_sets_none_fields(self, probs_normal):
        with (
            patch("app.services.ml_service._get_predictions", return_value=probs_normal),
            patch(
                "app.services.explainability_service.generate_gradcam_for_prediction",
                side_effect=Exception("test error"),
            ),
        ):
            from app.services.ml_service import predict_with_gradcam
            result = predict_with_gradcam("fake://image")

        assert result["gradcam_base64"] is None
        assert result["gradcam_metrics"] is None
        assert "gradcam_error" in result

    def test_gradcam_failure_includes_error_message(self, probs_normal):
        with (
            patch("app.services.ml_service._get_predictions", return_value=probs_normal),
            patch(
                "app.services.explainability_service.generate_gradcam_for_prediction",
                side_effect=ValueError("invalid layer"),
            ),
        ):
            from app.services.ml_service import predict_with_gradcam
            result = predict_with_gradcam("fake://image")

        assert "invalid layer" in result["gradcam_error"]

    def test_successful_gradcam_returns_base64(self, probs_normal):
        """When GradCAM succeeds, the base64 and metrics are in the result."""
        fake_gradcam_data = {
            "gradcam_base64": "data:image/png;base64,AAAA",
            "gradcam_metrics": {"peak_x": 0.5, "peak_y": 0.5},
        }
        with (
            patch("app.services.ml_service._get_predictions", return_value=probs_normal),
            patch(
                "app.services.explainability_service.generate_gradcam_for_prediction",
                return_value=fake_gradcam_data,
            ),
        ):
            from app.services.ml_service import predict_with_gradcam
            result = predict_with_gradcam("fake://image")

        assert result["gradcam_base64"] == "data:image/png;base64,AAAA"
        assert result["gradcam_metrics"] == {"peak_x": 0.5, "peak_y": 0.5}


# ---------------------------------------------------------------------------
# aggregate_predictions()
# ---------------------------------------------------------------------------


class TestAggregatePredictions:
    def test_empty_list_returns_all_none(self):
        from app.services.ml_service import aggregate_predictions

        result = aggregate_predictions([])

        assert result == {
            "final_predicted_condition": None,
            "final_confidence": None,
            "urgency": None,
        }

    def test_single_manage_locally_image(self):
        from app.services.ml_service import aggregate_predictions

        images = [{"predicted_condition": "psoriasis", "confidence": 0.80}]
        result = aggregate_predictions(images)

        assert result["final_predicted_condition"] == "psoriasis"
        assert result["final_confidence"] == pytest.approx(0.80, abs=1e-3)
        assert result["urgency"] == "MANAGE LOCALLY"

    def test_single_refer_image(self):
        from app.services.ml_service import aggregate_predictions

        images = [{"predicted_condition": "lupus_erythematosus", "confidence": 0.75}]
        result = aggregate_predictions(images)

        assert result["final_predicted_condition"] == "lupus_erythematosus"
        assert result["urgency"] == "REFER"

    def test_weighted_aggregation_prefers_higher_total_confidence(self):
        """Weighted score decides the winner condition."""
        from app.services.ml_service import aggregate_predictions

        images = [
            {"predicted_condition": "pityriasis_rubra_pilaris", "confidence": 0.90},
            {"predicted_condition": "scabies", "confidence": 0.81},
        ]
        result = aggregate_predictions(images)

        assert result["final_predicted_condition"] == "pityriasis_rubra_pilaris"
        assert result["urgency"] == "REFER"

    def test_majority_refer_class_gives_refer_urgency(self):
        """2× lupus + 1× psoriasis → lupus majority → REFER."""
        from app.services.ml_service import aggregate_predictions

        images = [
            {"predicted_condition": "lupus_erythematosus", "confidence": 0.75},
            {"predicted_condition": "lupus_erythematosus", "confidence": 0.70},
            {"predicted_condition": "psoriasis", "confidence": 0.80},
        ]
        result = aggregate_predictions(images)

        assert result["final_predicted_condition"] == "lupus_erythematosus"
        assert result["urgency"] == "REFER"

    def test_mixed_predictions_with_any_refer_force_refer_urgency(self):
        """Any REFER signal in mixed scans escalates consultation urgency."""
        from app.services.ml_service import aggregate_predictions

        images = [
            {"predicted_condition": "psoriasis", "confidence": 0.80},
            {"predicted_condition": "lupus_erythematosus", "confidence": 0.65},
        ]
        result = aggregate_predictions(images)

        assert result["urgency"] == "REFER"

    def test_all_uncertain_gives_refer_urgency(self):
        from app.services.ml_service import aggregate_predictions

        images = [
            {"predicted_condition": "UNCERTAIN", "confidence": 0.20},
            {"predicted_condition": "UNCERTAIN", "confidence": 0.25},
        ]
        result = aggregate_predictions(images)

        assert result["final_predicted_condition"] == "UNCERTAIN"
        assert result["urgency"] == "REFER"

    def test_mean_confidence_calculated_correctly(self):
        from app.services.ml_service import aggregate_predictions

        images = [
            {"predicted_condition": "psoriasis", "confidence": 0.80},
            {"predicted_condition": "psoriasis", "confidence": 0.60},
        ]
        result = aggregate_predictions(images)

        assert result["final_confidence"] == pytest.approx(0.70, abs=1e-3)

    def test_images_without_condition_are_skipped(self):
        """Entries with None predicted_condition are excluded from voting."""
        from app.services.ml_service import aggregate_predictions

        images = [
            {"predicted_condition": "psoriasis", "confidence": 0.80},
            {"predicted_condition": None, "confidence": None},
        ]
        result = aggregate_predictions(images)

        assert result["final_predicted_condition"] == "psoriasis"

    def test_all_conditions_none_returns_nones(self):
        from app.services.ml_service import aggregate_predictions

        images = [{"predicted_condition": None, "confidence": None}]
        result = aggregate_predictions(images)

        assert result["final_predicted_condition"] is None
        assert result["final_confidence"] is None
        assert result["urgency"] is None

    def test_result_keys_always_present(self):
        from app.services.ml_service import aggregate_predictions

        for images in [[], [{"predicted_condition": "psoriasis", "confidence": 0.8}]]:
            result = aggregate_predictions(images)
            assert "final_predicted_condition" in result
            assert "final_confidence" in result
            assert "urgency" in result

    def test_low_mean_confidence_triggers_refer(self):
        """Mean confidence < 0.35 → UNCERTAIN condition → REFER."""
        from app.services.ml_service import aggregate_predictions

        images = [
            {"predicted_condition": "UNCERTAIN", "confidence": 0.20},
            {"predicted_condition": "psoriasis", "confidence": 0.30},
        ]
        # majority = UNCERTAIN → urgency is forced REFER by aggregate logic
        result = aggregate_predictions(images)
        assert result["urgency"] == "REFER"
