import random
from collections import Counter

CONDITION_CLASSES = [
    "pityriasis_rubra_pilaris",
    "lichen_planus",
    "lupus_erythematosus",
    "psoriasis",
    "scabies",
    "vitiligo",
    "neurofibromatosis",
    "squamous_cell_carcinoma",
    "inflammatory",
    "genodermatoses",
    "malignant_skin_lesions",
    "benign_neoplastic_lesions",
]

URGENCY_MAP = {
    "squamous_cell_carcinoma": "URGENT",
    "malignant_skin_lesions": "URGENT",
    "lupus_erythematosus": "URGENT",
    "inflammatory": "URGENT",
    "pityriasis_rubra_pilaris": "NON_URGENT",
    "lichen_planus": "NON_URGENT",
    "psoriasis": "NON_URGENT",
    "scabies": "NON_URGENT",
    "vitiligo": "NON_URGENT",
    "neurofibromatosis": "NON_URGENT",
    "genodermatoses": "NON_URGENT",
    "benign_neoplastic_lesions": "NON_URGENT",
}


def predict(image_url: str) -> str:
    """Stub: returns a random condition class."""
    return random.choice(CONDITION_CLASSES)


def get_confidence(image_url: str) -> float:
    """Stub: returns a random confidence score between 0.3 and 0.98."""
    return round(random.uniform(0.3, 0.98), 4)


def classify_urgency(condition: str, confidence: float) -> str:
    """Rule-based urgency mapping. Conservative: confidence < 0.6 → URGENT."""
    if confidence < 0.6:
        return "URGENT"
    return URGENCY_MAP.get(condition, "URGENT")


def aggregate_predictions(
    images: list[dict],
) -> dict[str, str | float]:
    """
    Majority vote + mean confidence across images.
    images: list of dicts with 'predicted_condition' and 'confidence' keys.
    """
    if not images:
        return {
            "final_predicted_condition": None,
            "final_confidence": None,
            "urgency": None,
        }

    conditions = [img["predicted_condition"] for img in images if img.get("predicted_condition")]
    confidences = [img["confidence"] for img in images if img.get("confidence") is not None]

    if not conditions:
        return {
            "final_predicted_condition": None,
            "final_confidence": None,
            "urgency": None,
        }

    counter = Counter(conditions)
    final_condition = counter.most_common(1)[0][0]
    final_confidence = round(sum(confidences) / len(confidences), 4) if confidences else 0.0
    urgency = classify_urgency(final_condition, final_confidence)

    return {
        "final_predicted_condition": final_condition,
        "final_confidence": final_confidence,
        "urgency": urgency,
    }
