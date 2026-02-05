# Data directory layout

## Overview

| Directory    | Purpose |
|-------------|--------|
| **raw/**    | Source datasets (unchanged). Metadata + original images. |
| **processed/** | Preprocessed outputs: **train/val/test splits** under `processed/fitzpatrick17k/`. |
| **augmented/** | **Training-only** augmented images under `augmented/train/`. |

---

## raw/

- **raw/fitzpatrick17k/**  
  - Metadata: `fitzpatrick17k.csv`, `fitzpatrick17k_fst_v_vi.csv`  
  - Images: `images/*.jpg` (expected by `03_data_augmentation.ipynb`)  
- **raw/isic/**  
  - Placeholder / future ISIC data  

**Role:** Single source of truth. Pipelines only read from here.

---

## processed/

- **processed/fitzpatrick17k/** ← **Pipeline output (splits)**
  - `train/` — Training images by final class (e.g. `inflammatory/`, `squamous_cell_carcinoma/`)
  - `val/`  — Validation images (same class layout)
  - `test/` — Test images (same class layout)
  - Produced by: `notebooks/03_data_augmentation.ipynb`
  - Use for: **validation** and **test** in training; model evaluation.

- **processed/filtered_metadata.csv**, **quality_report.json** (if present)  
  - From other pipeline steps (e.g. filtering). Optional.

**Role:** Splits live under `processed/fitzpatrick17k/`. Training uses **val** and **test** from here.

---

## augmented/

- **augmented/train/** (class folders)
  - Augmented **training** images only, by final class (e.g. `inflammatory/`, `lichen_planus/`).
  - Produced by: `notebooks/03_data_augmentation.ipynb`
  - Use for: **training** the model (not val/test).

**Role:** Training set only. Val/test stay in `processed/fitzpatrick17k/` and are not augmented.

---

## Training usage (reference)

- **Train:** `data/augmented/train/`
- **Val:**   `data/processed/fitzpatrick17k/val/`
- **Test:**  `data/processed/fitzpatrick17k/test/`

Flow: raw → processed (splits) → augmented (train only).
