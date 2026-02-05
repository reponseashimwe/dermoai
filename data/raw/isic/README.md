# ISIC Archive Raw Data

This folder holds ISIC Archive metadata and (optionally) images. **Do not modify** files in this folder.

## Why `isic_metadata.csv` is not in the repo

`isic_metadata.csv` is **~112 MB**, which exceeds GitHub’s 100 MB file limit. It is listed in `.gitignore` and must be obtained separately.

## How to get the data

### Option 1: Google Drive (same folder structure)

Pre-built project data (same layout as this repo) is available on Google Drive:

**[dermoai – Google Drive](https://drive.google.com/drive/folders/13ZYlwGxlQpN17szV3-leiCCjs9lqb_Ay)**

- Download the **data** folder (or only `data/raw/isic/`) and place it so that:
  - `data/raw/isic/isic_metadata.csv` exists
  - Optional: `data/raw/isic/images/` if you need images
- Folder structure on Drive matches: `data/`, `notebooks/`, `results/`.

### Option 2: ISIC CLI (download metadata and/or images yourself)

If you prefer to fetch from the source:

```bash
pip install isic-cli
isic login
# Metadata: export from ISIC Archive or use their API; save as isic_metadata.csv here
# Images (optional): e.g. filter by FST and download
isic image download --search '{"fitzpatrick_skin_type": {"$in": [5, 6]}}' --destination ./images
```

Save the exported metadata as `data/raw/isic/isic_metadata.csv` so the notebooks find it.

## Expected layout

```
data/raw/isic/
├── README.md           # This file
├── isic_metadata.csv   # You add this (Drive or ISIC CLI) — ~112 MB
└── images/            # Optional; dermoscopic images if you downloaded them
```

## Usage in this project

- **EDA:** `notebooks/01_data_exploration.ipynb` expects `data/raw/isic/isic_metadata.csv`.
- **FST:** Metadata includes a `fitzpatrick_skin_type` column (Roman numerals I–VI); the notebook maps these for analysis.
