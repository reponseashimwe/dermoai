# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DermoAI is an AI-assisted dermatological triage framework for resource-limited settings in Rwanda. It uses a MobileNetV2 CNN for skin condition classification, specifically optimized for Fitzpatrick Skin Types (FST) V-VI (darker skin tones) to address the 30-40% performance degradation seen in existing dermatology AI on these skin types.

**Two-stage classification system:**
1. **Condition Classification** — MobileNetV2 CNN classifies skin images into 9 condition categories
2. **Rule-Based Urgency Mapping** — Maps predicted condition + confidence to URGENT/NON-URGENT triage

## Setup & Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Download datasets (Fitzpatrick17k + ISIC Archive)
python src/data/download.py
python src/data/download.py --dataset fitzpatrick17k
python src/data/download.py --dataset isic
python src/data/download.py --dataset fitzpatrick17k --retry-failed

# Filter and verify FST V-VI labels
python src/data/filter.py
python src/data/filter.py --dataset fitzpatrick17k
python src/data/filter.py --dataset isic

# Run notebooks
jupyter notebook notebooks/01_data_exploration.ipynb
jupyter notebook notebooks/02_condition_classification_strategy.ipynb
jupyter notebook notebooks/03_data_augmentation.ipynb
jupyter notebook notebooks/03_model_training.ipynb
```

No test suite or linting configuration exists yet.

## Architecture

```
src/
├── data/
│   ├── download.py       # Dataset ingestion with retry/backoff logic
│   ├── filter.py         # FST V-VI label verification (ITA score + luminance analysis)
│   ├── augmentation.py   # Data augmentation (stub)
│   └── preprocess.py     # Preprocessing pipeline (stub)
├── models/
│   └── mobilenet_triage.py  # MobileNetV2 model definition (stub)
└── utils/
    └── filtering.py      # Utility functions (stub)
```

**Notebooks** (`notebooks/`) contain the primary analysis and training work:
- `01_data_exploration.ipynb` — EDA on Fitzpatrick17k + ISIC datasets
- `02_condition_classification_strategy.ipynb` — 9-category condition mapping
- `03_data_augmentation.ipynb` — Augmentation strategy for class imbalance
- `03_model_training.ipynb` — Model training (scaffold only)

**Results** (`results/`) stores EDA visualizations, classification analysis, and augmentation reports.

## Key Technical Details

**FST Label Verification** (`src/data/filter.py`):
- ITA (Individual Typology Angle) score from LAB color space: FST VI < 10°, FST V = 10-19°
- Luminance validation: FST V-VI must have mean luminance < 120
- Three confidence tiers: High (≥0.8, use for training), Medium (0.5-0.8, flag for review), Low (<0.5, discard)

**Datasets:**
- Fitzpatrick17k: ~16,577 images total, ~1,000-1,500 FST V-VI subset
- ISIC Archive: ~549,590 images total, ~1,574 FST V-VI subset (~0.29%)
- `data/raw/isic/isic_metadata.csv` (~112 MB) is in .gitignore — must be downloaded separately

**Performance targets:**
- Recall ≥75% on urgent cases for FST V-VI
- Inference <3s on CPU-only Android, model size ~10-15 MB

**Planned tech stack (not yet implemented):**
- Frontend: Next.js 14+ (TypeScript, offline PWA)
- Backend: FastAPI inference server
- Database: Supabase (PostgreSQL)
- Training: PyTorch on Google Colab Pro (GPU)

## Data & Storage

Large files are excluded from git via `.gitignore`: all image directories (`data/raw/*/images/`), processed data, augmented data, and `isic_metadata.csv`. Full data is available via Google Drive link in README.md.

## Development Workflow

Feature branches merged to `main` via pull requests.
