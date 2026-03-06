"""
collect_correct_predictions.py

Traverses val/ and test/ splits, runs inference on every image, and copies
correctly-classified images to:

    data/correct_predictions/{split}/{class}/

These curated images are ideal for GradCAM demos and thesis figures because
the model produces meaningful, high-activation heatmaps on images it predicts
correctly.

Usage (from repo root):
    python scripts/collect_correct_predictions.py

Optional flags:
    --splits test val        which splits to process  (default: test val)
    --min-conf 0.40          minimum confidence to accept  (default: 0.0)
    --out data/correct_predictions
"""

import argparse
import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image

# ── Paths ──────────────────────────────────────────────────────────────────────
REPO_ROOT        = Path(__file__).resolve().parent.parent
MODEL_DIR        = REPO_ROOT / "models" / "final"
MODEL_PATH       = MODEL_DIR / "best_model.keras"
CLASS_NAMES_PATH = MODEL_DIR / "class_names.json"
DATA_DIR         = REPO_ROOT / "data" / "processed" / "fitzpatrick17k"


def load_model_and_classes():
    import keras
    from keras.applications.efficientnet import preprocess_input
    model = keras.models.load_model(MODEL_PATH, compile=False)
    with open(CLASS_NAMES_PATH) as f:
        class_names = json.load(f)
    return model, class_names, preprocess_input


def preprocess_image(img_path: Path, preprocess_input) -> np.ndarray:
    """Load and apply EfficientNet preprocessing → (1, 224, 224, 3) in [-1, 1]."""
    img = Image.open(img_path).convert("RGB").resize((224, 224))
    arr = np.array(img, dtype=np.float32)
    arr = preprocess_input(arr)          # [0, 255] → [-1, 1]
    return np.expand_dims(arr, axis=0)


def collect(splits: list, min_conf: float, out_root: Path):
    print(f"Loading model from {MODEL_PATH} ...")
    model, class_names, preprocess_input = load_model_and_classes()
    print(f"Classes: {class_names}\n")

    totals = {"processed": 0, "correct": 0}

    for split in splits:
        split_dir = DATA_DIR / split
        if not split_dir.exists():
            print(f"[skip] {split_dir} — not found")
            continue

        print(f"{'='*60}")
        print(f"Split: {split}  ({split_dir})")
        print(f"{'='*60}")
        split_correct = 0
        split_total   = 0

        for class_name in class_names:
            class_dir = split_dir / class_name
            if not class_dir.exists():
                continue

            images = sorted(class_dir.glob("*.jpg")) + sorted(class_dir.glob("*.png"))
            if not images:
                continue

            out_class_dir = out_root / class_name
            out_class_dir.mkdir(parents=True, exist_ok=True)

            class_correct = 0
            true_idx      = class_names.index(class_name)

            for img_path in images:
                split_total          += 1
                totals["processed"]  += 1

                try:
                    x    = preprocess_image(img_path, preprocess_input)
                    pred = model.predict(x, verbose=0)[0]
                except Exception as e:
                    print(f"  [error] {img_path.name}: {e}")
                    continue

                pred_idx   = int(np.argmax(pred))
                confidence = float(pred[pred_idx])

                if pred_idx == true_idx and confidence >= min_conf:
                    shutil.copy2(img_path, out_class_dir / img_path.name)
                    class_correct        += 1
                    split_correct        += 1
                    totals["correct"]    += 1

            pct = class_correct / len(images) * 100
            print(f"  {class_name:35s}  {class_correct:3d}/{len(images):3d}  ({pct:.0f}%)")

        split_acc = split_correct / max(split_total, 1) * 100
        print(f"\n  {split} accuracy: {split_correct}/{split_total}  ({split_acc:.1f}%)\n")

    print(f"{'='*60}")
    print(f"Total processed : {totals['processed']}")
    print(f"Correctly classified & copied: {totals['correct']}")
    print(f"Output: {out_root}")
    print(f"{'='*60}")


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--splits",   nargs="+", default=["test", "val"],
                        help="Splits to process (default: test val)")
    parser.add_argument("--min-conf", type=float, default=0.0,
                        help="Minimum confidence threshold (default: 0.0 = any correct)")
    parser.add_argument("--out",      default=str(REPO_ROOT / "data" / "test"),
                        help="Output root directory (default: ./data/test)")
    args = parser.parse_args()

    print(f"Model   : {MODEL_PATH}")
    print(f"Splits  : {args.splits}")
    print(f"Min conf: {args.min_conf:.0%}  (images below this threshold are skipped)")
    print(f"Output  : {args.out}\n")

    collect(args.splits, args.min_conf, Path(args.out))


if __name__ == "__main__":
    main()
