"""
ML inference service for DermoAI skin lesion classification.

Uses a trained EfficientNetB0 Keras model (224x224 RGB input) with 5 condition
classes trained exclusively on Fitzpatrick Skin Types V-VI (darker skin tones).

Model Version: 2.0
Date: 2026-03-05
Classes: lupus_erythematosus, neurofibromatosis, pityriasis_rubra_pilaris,
         psoriasis, scabies
"""

import io
import json
from pathlib import Path
from urllib.request import urlopen

import numpy as np
from PIL import Image

# Resolve model paths: backend/app/services -> backend -> repo root (dermoai)
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
_PROJECT_ROOT = _BACKEND_ROOT.parent
_MODEL_DIR = _PROJECT_ROOT / "models" / "final"
_MODEL_PATH = _MODEL_DIR / "best_model.keras"
_CLASS_NAMES_PATH = _MODEL_DIR / "class_names.json"
_TRIAGE_MAPPING_PATH = _MODEL_DIR / "triage_mapping.json"

# Fallback model filename if best_model.keras is not present
_ALT_MODEL_PATH = _MODEL_DIR / "dermoai_final_model.keras"

# Model metadata
MODEL_VERSION = "2.0"
MODEL_DATE = "2026-03-05"
INPUT_SIZE = (224, 224)

# Two-stage triage thresholds (from model card)
CONFIDENCE_THRESHOLD = 0.35  # Stage 1: Below this → UNCERTAIN
REFER_OVERRIDE_THRESHOLD = 0.6  # Stage 2: REFER class prob > this → force REFER

# Load class names from JSON (5 conditions)
if _CLASS_NAMES_PATH.exists():
    with open(_CLASS_NAMES_PATH, encoding="utf-8") as f:
        CLASS_NAMES = json.load(f)
else:
    raise FileNotFoundError(
        f"class_names.json not found in {_MODEL_DIR}. Required for model operation."
    )

# Load triage mapping from JSON
if _TRIAGE_MAPPING_PATH.exists():
    with open(_TRIAGE_MAPPING_PATH, encoding="utf-8") as f:
        TRIAGE_MAPPING = json.load(f)
else:
    raise FileNotFoundError(
        f"triage_mapping.json not found in {_MODEL_DIR}. Required for triage logic."
    )

# Identify REFER classes for two-stage triage logic
REFER_CLASSES = [cls for cls, decision in TRIAGE_MAPPING.items()
                 if decision == "REFER" and cls != "UNCERTAIN"]

# Load model at module import (once). compile=False avoids needing the training
# loss (e.g. focal_loss_fixed) for inference.
_model = None
if _MODEL_PATH.exists():
    import keras
    _model = keras.models.load_model(_MODEL_PATH, compile=False)
elif _ALT_MODEL_PATH.exists():
    import keras
    _model = keras.models.load_model(_ALT_MODEL_PATH, compile=False)
else:
    raise FileNotFoundError(
        f"Model not found. Place best_model.keras or dermoai_final_model.keras in {_MODEL_DIR}"
    )


def _load_image(image_url: str) -> Image.Image:
    """Load PIL Image from file path or HTTP(S) URL."""
    if image_url.startswith(("http://", "https://")):
        with urlopen(image_url, timeout=30) as resp:
            data = resp.read()
        return Image.open(io.BytesIO(data)).convert("RGB")
    return Image.open(image_url).convert("RGB")


def _preprocess(img: Image.Image) -> np.ndarray:
    """Resize and preprocess image to model input shape (1, 224, 224, 3).

    EfficientNetB0 was trained with efficientnet.preprocess_input which maps
    pixel values [0, 255] → [-1, 1]. Dividing by 255 produces [0, 1] which is
    out-of-distribution and collapses all predictions to ~0.2.
    """
    from keras.applications.efficientnet import preprocess_input
    img = img.resize(INPUT_SIZE)
    arr = np.array(img, dtype=np.float32)          # keep [0, 255]
    arr = preprocess_input(arr)                     # → [-1, 1]
    return np.expand_dims(arr, axis=0)


def _get_predictions(image_url: str) -> np.ndarray:
    """Load image, preprocess, and return 1D array of class probabilities."""
    img = _load_image(image_url)
    x = _preprocess(img)
    preds = _model.predict(x, verbose=0)
    return preds[0]


def predict(image_url: str) -> str:
    """
    Predict skin condition from image URL or file path.

    Implements two-stage triage logic:
    - Stage 1: If max confidence < 0.45 → route to best REFER class
    - Stage 2: If any REFER class probability > 0.6 → force REFER prediction

    Args:
        image_url: Path to image file or HTTP(S) URL (e.g. Cloudinary).

    Returns:
        Predicted class name.
    """
    predictions = _get_predictions(image_url)
    max_confidence = float(np.max(predictions))
    predicted_idx = int(np.argmax(predictions))

    # Stage 1: Low confidence → UNCERTAIN
    if max_confidence < CONFIDENCE_THRESHOLD:
        return "UNCERTAIN"

    # Stage 2: REFER override if any REFER class probability > threshold
    for refer_class in REFER_CLASSES:
        refer_idx = CLASS_NAMES.index(refer_class)
        if predictions[refer_idx] > REFER_OVERRIDE_THRESHOLD:
            return refer_class

    # Normal prediction (highest probability)
    return CLASS_NAMES[predicted_idx]


def get_confidence(image_url: str) -> float:
    """
    Get confidence score (max probability) for the prediction.

    Args:
        image_url: Path to image file or HTTP(S) URL.

    Returns:
        Confidence score in [0, 1].
    """
    predictions = _get_predictions(image_url)
    return float(np.max(predictions))


def classify_urgency(condition: str, confidence: float) -> str:
    """
    Classify urgency using triage mapping.

    Conservative rule: If confidence < 0.45, defaults to REFER (safety-first).
    Otherwise uses the triage mapping for the predicted condition.

    Args:
        condition: Predicted condition name.
        confidence: Prediction confidence.

    Returns:
        "REFER" or "MANAGE LOCALLY".
    """
    # Conservative: low confidence or uncertain image defaults to REFER
    if confidence < CONFIDENCE_THRESHOLD or condition == "UNCERTAIN":
        return "REFER"

    # Use loaded triage mapping (REFER or MANAGE LOCALLY)
    return TRIAGE_MAPPING.get(condition, "REFER")


def predict_with_details(image_url: str) -> dict:
    """
    Get full prediction details including all class probabilities.

    Implements two-stage triage logic and returns complete prediction metadata.

    Args:
        image_url: Path to image file or HTTP(S) URL.

    Returns:
        Dict with predicted_condition, confidence, urgency, all_probabilities,
        model_version, model_date, triage_stage.
    """
    predictions = _get_predictions(image_url)
    max_confidence = float(np.max(predictions))
    predicted_idx = int(np.argmax(predictions))

    triage_stage = None

    # Stage 1: Low confidence → UNCERTAIN
    if max_confidence < CONFIDENCE_THRESHOLD:
        predicted_condition = "UNCERTAIN"
        confidence = max_confidence
        triage_stage = "STAGE_1_LOW_CONFIDENCE"
    else:
        # Stage 2: REFER override check
        refer_override = False
        for refer_class in REFER_CLASSES:
            refer_idx = CLASS_NAMES.index(refer_class)
            if predictions[refer_idx] > REFER_OVERRIDE_THRESHOLD:
                predicted_condition = refer_class
                confidence = float(predictions[refer_idx])
                refer_override = True
                triage_stage = "STAGE_2_REFER_OVERRIDE"
                break

        if not refer_override:
            predicted_condition = CLASS_NAMES[predicted_idx]
            confidence = max_confidence
            triage_stage = "NORMAL_PREDICTION"

    urgency = classify_urgency(predicted_condition, confidence)

    return {
        "predicted_condition": predicted_condition,
        "confidence": round(confidence, 4),
        "urgency": urgency,
        "all_probabilities": {
            CLASS_NAMES[i]: round(float(predictions[i]), 4)
            for i in range(len(CLASS_NAMES))
        },
        "model_version": MODEL_VERSION,
        "model_date": MODEL_DATE,
        "triage_stage": triage_stage,
    }


def predict_with_gradcam(image_url: str, layer_name: str = "top_conv") -> dict:
    """
    Get full prediction details including GradCAM explainability visualization.

    Args:
        image_url: Path to image file or HTTP(S) URL.
        layer_name: Name of the last convolutional layer for GradCAM.

    Returns:
        Dict with predicted_condition, confidence, urgency, all_probabilities,
        model_version, model_date, triage_stage, gradcam_base64, gradcam_metrics.
    """
    # Get base prediction details
    prediction_details = predict_with_details(image_url)

    # Skip GradCAM entirely for uncertain predictions
    if prediction_details["predicted_condition"] == "UNCERTAIN":
        prediction_details["gradcam_base64"] = None
        prediction_details["gradcam_metrics"] = None
        prediction_details["gradcam_error"] = "Skipped — low confidence prediction"
        return prediction_details

    # Generate GradCAM for the predicted class
    try:
        from app.services.explainability_service import generate_gradcam_for_prediction

        predicted_class_idx = CLASS_NAMES.index(
            prediction_details["predicted_condition"]
        )
        gradcam_data = generate_gradcam_for_prediction(
            _model, image_url, predicted_class_idx, layer_name
        )

        prediction_details["gradcam_base64"] = gradcam_data["gradcam_base64"]
        prediction_details["gradcam_metrics"] = gradcam_data["gradcam_metrics"]
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception("GradCAM failed for %s: %s", image_url[:80] if image_url else image_url, e)
        # If GradCAM fails, still return prediction (graceful degradation)
        prediction_details["gradcam_base64"] = None
        prediction_details["gradcam_metrics"] = None
        prediction_details["gradcam_error"] = str(e)

    return prediction_details


def aggregate_predictions(images: list[dict]) -> dict[str, str | float | None]:
    """
    Confidence-weighted aggregation with conservative urgency escalation.

    Args:
        images: List of dicts with "predicted_condition" and "confidence" keys.

    Returns:
        Dict with final_predicted_condition, final_confidence, urgency.
    """
    if not images:
        return {
            "final_predicted_condition": None,
            "final_confidence": None,
            "urgency": None,
        }

    valid_images = [img for img in images if img.get("predicted_condition")]
    if not valid_images:
        return {
            "final_predicted_condition": None,
            "final_confidence": None,
            "urgency": None,
        }

    scores: dict[str, float] = {}
    condition_confidences: dict[str, list[float]] = {}
    any_refer_signal = False

    for img in valid_images:
        condition = img["predicted_condition"]
        confidence = img.get("confidence")
        safe_confidence = float(confidence) if confidence is not None else 0.0

        scores[condition] = scores.get(condition, 0.0) + safe_confidence
        if confidence is not None:
            condition_confidences.setdefault(condition, []).append(safe_confidence)

        # Safety-first: if any scan indicates REFER, escalate the consultation urgency.
        if classify_urgency(condition, safe_confidence) == "REFER":
            any_refer_signal = True

    final_condition = sorted(scores.items(), key=lambda item: item[1], reverse=True)[0][0]
    winner_confidences = condition_confidences.get(final_condition, [])
    final_confidence = (
        round(sum(winner_confidences) / len(winner_confidences), 4)
        if winner_confidences
        else 0.0
    )
    urgency = (
        "REFER"
        if any_refer_signal
        else classify_urgency(final_condition, final_confidence)
    )

    return {
        "final_predicted_condition": final_condition,
        "final_confidence": final_confidence,
        "urgency": urgency,
    }
