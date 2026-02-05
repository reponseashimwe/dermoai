# DermoAI

AI-assisted dermatological triage (FST V–VI focus). Scripts and notebooks for dataset download, filtering, and EDA.

## Large files and GitHub

**ISIC metadata** (`data/raw/isic/isic_metadata.csv`) is **~112 MB** and exceeds GitHub’s 100 MB limit. It is in `.gitignore` and is **not** in the repo.

**To get the full project data (same structure as this repo):**

- **Google Drive:** [dermoai folder](https://drive.google.com/drive/folders/13ZYlwGxlQpN17szV3-leiCCjs9lqb_Ay) — contains `data/`, `notebooks/`, `results/`. Download and merge into your clone so that `data/raw/isic/isic_metadata.csv` (and optionally images) are in place.

**To get ISIC data yourself:** use the [ISIC CLI](https://github.com/ImageMarkup/isic-cli) or see [data/raw/isic/README.md](data/raw/isic/README.md).

**After cloning:** If you only need to run EDA on existing data, place `isic_metadata.csv` in `data/raw/isic/` (from Drive or your own export). Fitzpatrick17k can be obtained via the download script or from the same Drive folder — see [data/raw/fitzpatrick17k/README.md](data/raw/fitzpatrick17k/README.md).

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Download Datasets

**Download both datasets:**

```bash
python download.py --output-dir ./data
```

**Download only Fitzpatrick17k (fully automated):**

```bash
python download.py --dataset fitzpatrick17k --output-dir ./data
```

**Download only ISIC (requires manual steps):**

```bash
python download.py --dataset isic --output-dir ./data
```

### 3. Filter for Quality

After downloading, run the filtering script to remove misclassified images:

**For Fitzpatrick17k:**

```bash
python filter_dataset.py \
    --dataset-path ./data/fitzpatrick17k/images \
    --metadata ./data/fitzpatrick17k/fitzpatrick17k_fst_v_vi.csv \
    --output-dir ./data/fitzpatrick17k/filtered
```

**For ISIC (after manual download):**

```bash
python filter_dataset.py \
    --dataset-path ./data/isic/images \
    --metadata ./data/isic/metadata.csv \
    --output-dir ./data/isic/filtered
```

## Expected Results

### Fitzpatrick17k

- **Total FST V-VI images:** ~1,000-1,500
- **After filtering:** ~800-1,200 verified images
- **Download time:** 20-40 minutes (depending on internet speed)

### ISIC

- **Total FST V-VI images:** 1,574 (751 FST VI + 823 FST V)
- **After filtering:** ~1,200-1,400 verified images
- **Download method:** Manual (web interface or Kaggle)

## Directory Structure

Layout matches the [Google Drive folder](https://drive.google.com/drive/folders/13ZYlwGxlQpN17szV3-leiCCjs9lqb_Ay) (`data/`, `notebooks/`, `results/`).

After setup (Drive download or scripts):

```
data/
├── raw/
│   ├── fitzpatrick17k/
│   │   ├── images/
│   │   ├── fitzpatrick17k.csv
│   │   ├── fitzpatrick17k_fst_v_vi.csv
│   │   └── README.md
│   └── isic/
│       ├── isic_metadata.csv   # From Drive or ISIC CLI (~112 MB, not in git)
│       ├── images/             # Optional
│       └── README.md
notebooks/
│   └── 01_data_exploration.ipynb
results/
└── eda/                        # Outputs from EDA (figures, CSVs, summary JSON)
```

## Filtering Logic

The `filter_dataset.py` script uses multiple methods to verify FST labels:

1. **ITA Score (Individual Typology Angle)**
    - Calculates skin tone from LAB color space
    - ITA < 10°: FST VI
    - ITA 10-19°: FST V

2. **Luminance Analysis**
    - Measures average brightness
    - FST V-VI: mean luminance < 120

3. **Confidence Scoring**
    - High (≥0.8): Use immediately
    - Medium (0.5-0.8): Flag for manual review
    - Low (<0.5): Discard

## ISIC Manual Download Options

### Option 1: Web Interface (Easiest for FST V-VI)

1. Visit: https://www.isic-archive.com/
2. Filter by: Fitzpatrick Skin Type → V and VI
3. Download ZIP

### Option 2: Kaggle (For full dataset)

```bash
kaggle datasets download -d salviohexia/isic-2019-skin-lesion-images-for-classification
```

### Option 3: ISIC CLI (Advanced)

```bash
pip install isic-cli
isic login
isic image download --search '{"fitzpatrick": {"$in": [5, 6]}}'
```

## Troubleshooting

### Download fails

- **Fitzpatrick17k**: Check internet connection, Harvard Dataverse may be down
- **ISIC**: Use Kaggle method instead of web interface

### Images not found during filtering

- Check that image filenames match metadata
- Verify file extensions (.jpg, .png, etc.)
- Ensure images are in correct directory

### Low verification rate

- This is expected! ~20-30% misclassification rate is documented in literature
- Use high-confidence images for training
- Manually review medium-confidence images

## Next Steps

After data is in place:

1. **EDA** — `notebooks/01_data_exploration.ipynb` (Fitzpatrick17k + ISIC, 9-category strategy, Stage 1 augmentation).
2. **Data Augmentation**
    - Apply color jittering
    - Rotation, flipping
    - Contrast adjustment

3. **Model Training** (Week 3-5)
    - Use filtered + augmented data
    - Train MobileNetV2
    - Target: ≥80% recall on urgent cases

## Citation

If using these datasets, please cite:

**Fitzpatrick17k:**

```
Groh, M., et al. (2021). Evaluating Deep Neural Networks Trained on Clinical
Images in Dermatology with the Fitzpatrick 17k Dataset. CVPR 2021.
```

**ISIC:**

```
Combalia, M., et al. (2019). BCN20000: Dermoscopic Lesions in the Wild.
arXiv:1908.02288.
```

## Contact

For DermoAI project questions: Reponse Ashimwe (reponse@example.com)

## License

Scripts: MIT License
Datasets: See individual dataset licenses (research use only)
