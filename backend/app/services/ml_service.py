"""
ML inference service for DermoAI skin lesion classification.

Uses a trained MobileNetV2 Keras model (224x224 RGB input) with 8 condition
classes and rule-based urgency mapping including malignant threshold override.
"""

import io
import json
from collections import Counter
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

# Fallback model filename if best_model.keras is not present
_ALT_MODEL_PATH = _MODEL_DIR / "dermoai_final_model.keras"

CONDITION_CLASSES = [
    "autoimmune",
    "benign_neoplastic",
    "eczematous_dermatitis",
    "genetic_neurocutaneous",
    "malignant",
    "papulosquamous",
    "parasitic",
    "pigmentary",
]

URGENCY_MAP = {
    "autoimmune": "URGENT",
    "malignant": "URGENT",
    "benign_neoplastic": "NON_URGENT",
    "eczematous_dermatitis": "NON_URGENT",
    "genetic_neurocutaneous": "NON_URGENT",
    "papulosquamous": "NON_URGENT",
    "parasitic": "NON_URGENT",
    "pigmentary": "NON_URGENT",
}

MALIGNANT_THRESHOLD = 0.20  # P(malignant) > this → force URGENT (from notebook)

INPUT_SIZE = (224, 224)

# Load class names from JSON if present, else use CONDITION_CLASSES
if _CLASS_NAMES_PATH.exists():
    with open(_CLASS_NAMES_PATH, encoding="utf-8") as f:
        CLASS_NAMES = json.load(f)
else:
    CLASS_NAMES = list(CONDITION_CLASSES)

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

MALIGNANT_IDX = CLASS_NAMES.index("malignant")


def _load_image(image_url: str) -> Image.Image:
    """Load PIL Image from file path or HTTP(S) URL."""
    if image_url.startswith(("http://", "https://")):
        with urlopen(image_url, timeout=30) as resp:
            data = resp.read()
        return Image.open(io.BytesIO(data)).convert("RGB")
    return Image.open(image_url).convert("RGB")


def _preprocess(img: Image.Image) -> np.ndarray:
    """Resize and normalize image to model input shape (1, 224, 224, 3)."""
    img = img.resize(INPUT_SIZE)
    arr = np.array(img, dtype=np.float32) / 255.0
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

    Args:
        image_url: Path to image file or HTTP(S) URL (e.g. Cloudinary).

    Returns:
        Predicted class name.
    """
    predictions = _get_predictions(image_url)
    predicted_idx = int(np.argmax(predictions))
    # Malignant threshold override: if P(malignant) > threshold, force malignant
    if predictions[MALIGNANT_IDX] > MALIGNANT_THRESHOLD:
        predicted_idx = MALIGNANT_IDX
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


def classify_urgency(
    condition: str,
    confidence: float,
    image_url: str | None = None,
    malignant_probability: float | None = None,
) -> str:
    """
    Classify urgency with conservative rules.

    Rules:
    1. If confidence < 0.6 → URGENT (conservative).
    2. If P(malignant) > MALIGNANT_THRESHOLD → URGENT.
    3. Else use URGENCY_MAP.

    Args:
        condition: Predicted condition name.
        confidence: Prediction confidence.
        image_url: Optional; if provided and malignant_probability not given, run model to get P(malignant).
        malignant_probability: Optional; if provided, used for rule 2 (avoids re-running model).

    Returns:
        "URGENT" or "NON_URGENT".
    """
    if confidence < 0.6:
        return "URGENT"

    malignant_prob = malignant_probability
    if malignant_prob is None and image_url:
        predictions = _get_predictions(image_url)
        malignant_prob = float(predictions[MALIGNANT_IDX])
    if malignant_prob is not None and malignant_prob > MALIGNANT_THRESHOLD:
        return "URGENT"

    return URGENCY_MAP.get(condition, "URGENT")


def predict_with_details(image_url: str) -> dict:
    """
    Get full prediction details including all class probabilities.

    Args:
        image_url: Path to image file or HTTP(S) URL.

    Returns:
        Dict with predicted_condition, confidence, urgency, all_probabilities, malignant_probability.
    """
    predictions = _get_predictions(image_url)
    malignant_prob = float(predictions[MALIGNANT_IDX])

    if malignant_prob > MALIGNANT_THRESHOLD:
        predicted_idx = MALIGNANT_IDX
    else:
        predicted_idx = int(np.argmax(predictions))

    predicted_condition = CLASS_NAMES[predicted_idx]
    confidence = float(predictions[predicted_idx])
    urgency = classify_urgency(
        predicted_condition, confidence, malignant_probability=malignant_prob
    )

    return {
        "predicted_condition": predicted_condition,
        "confidence": round(confidence, 4),
        "urgency": urgency,
        "all_probabilities": {
            CLASS_NAMES[i]: round(float(predictions[i]), 4)
            for i in range(len(CLASS_NAMES))
        },
        "malignant_probability": round(malignant_prob, 4),
    }


def aggregate_predictions(images: list[dict]) -> dict[str, str | float | None]:
    """
    Majority vote on condition + mean confidence; then classify urgency.

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

    conditions = [
        img["predicted_condition"]
        for img in images
        if img.get("predicted_condition")
    ]
    confidences = [
        img["confidence"]
        for img in images
        if img.get("confidence") is not None
    ]

    if not conditions:
        return {
            "final_predicted_condition": None,
            "final_confidence": None,
            "urgency": None,
        }

    counter = Counter(conditions)
    final_condition = counter.most_common(1)[0][0]
    final_confidence = (
        round(sum(confidences) / len(confidences), 4) if confidences else 0.0
    )
    urgency = classify_urgency(final_condition, final_confidence)

    return {
        "final_predicted_condition": final_condition,
        "final_confidence": final_confidence,
        "urgency": urgency,
    }
