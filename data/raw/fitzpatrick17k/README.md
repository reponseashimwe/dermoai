# Fitzpatrick17k Raw Data

Original Fitzpatrick17k dataset. **Do not modify** files in this folder.

## Contents

- **images/** — Dermatology images (FST V–VI subset used for training)
- **fitzpatrick17k.csv** — Full metadata (md5hash, fitzpatrick_scale, label, url, etc.)
- **fitzpatrick17k_fst_v_vi.csv** — Subset with FST V and VI only (used by the pipeline)

## Getting the data

### Option 1: Google Drive (pre-downloaded, same structure)

Project data with the same folder layout is on Google Drive:

**[dermoai – Google Drive](https://drive.google.com/drive/folders/13ZYlwGxlQpN17szV3-leiCCjs9lqb_Ay)**

Download the **data** folder and place it so that `data/raw/fitzpatrick17k/` contains the CSVs and (optionally) `images/`.

### Option 2: Scripts in this repo

From the project root:

```bash
python download.py --dataset fitzpatrick17k --output-dir ./data
```

See the main [README.md](../../../README.md) for full download and filtering steps.

## Expected layout

```
data/raw/fitzpatrick17k/
├── README.md
├── fitzpatrick17k.csv
├── fitzpatrick17k_fst_v_vi.csv
└── images/
```
