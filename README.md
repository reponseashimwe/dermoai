# DermoAI Dataset Download & Filtering

Scripts for downloading and filtering Fitzpatrick17k and ISIC datasets for FST V-VI images.

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

After running all scripts:

```
data/
├── fitzpatrick17k/
│   ├── images/              # Downloaded images
│   ├── fitzpatrick17k.csv   # Full metadata
│   ├── fitzpatrick17k_fst_v_vi.csv  # Filtered metadata
│   ├── download_report.json
│   └── filtered/            # Quality-filtered dataset
│       ├── verified_fst_v_vi.csv
│       ├── flagged_for_review.csv
│       ├── invalid_labels.csv
│       └── filtering_report.json
└── isic/
    ├── images/              # Manually downloaded images
    ├── metadata/
    ├── DOWNLOAD_INSTRUCTIONS.txt
    └── filtered/            # Quality-filtered dataset
        └── ...
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

After downloading and filtering:

1. **Data Analysis** (Week 2 objective)

    ```bash
    jupyter notebook data_analysis.ipynb
    ```

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
