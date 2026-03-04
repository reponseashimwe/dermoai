# DermoAI Model Card

## Model Details

**Model Name:** DermoAI MobileNetV2 FST V-VI Skin Lesion Classifier v2
**Architecture:** MobileNetV2 (ImageNet pretrained) + Custom Classification Head
**Framework:** TensorFlow/Keras
**Date:** 2026-03-04
**Version:** 2.0

## Intended Use

**Primary Use:** AI-assisted dermatological triage for resource-limited primary care settings in Rwanda

**Target Population:** Patients with Fitzpatrick Skin Types (FST) V-VI (darker skin tones)

**Clinical Workflow:**
1. Primary care provider captures skin lesion image
2. Model classifies into one of 5 conditions
3. System routes to either REFER (specialist) or MANAGE LOCALLY (primary care)

## Model Architecture

- **Base Model:** MobileNetV2 (ImageNet weights)
- **Input:** 224×224×3 RGB images
- **Classification Head:**
  - GlobalAveragePooling2D
  - Dense(256, relu) + L2 regularization + Dropout(0.5)
  - Dense(128, relu) + Dropout(0.25)
  - Dense(5, softmax)
- **Parameters:** 2,619,461 total (1,567,557 trainable after fine-tuning)

## Training Strategy

**Two-Phase Training:**

1. **Phase 1 — Feature Extraction (50 epochs)**
   - Base model frozen
   - Learning rate: 0.0003
   - REFER class weight: 2.0x
   - Monitor: val_recall

2. **Phase 2 — Fine-Tuning (40 epochs)**
   - Last 30 layers unfrozen
   - Learning rate: 5e-05
   - REFER class weight: 3.0x
   - Monitor: val_recall

**Loss Function:** Focal Loss + Label Smoothing (gamma=2.0, alpha=0.25, smoothing=0.1)

**Optimization:** Adam optimizer with CosineDecay learning rate schedule

## 5 Condition Classes and Triage Mapping

| Condition | Triage Decision |
|-----------|----------------|
| lupus_erythematosus | **REFER** |
| neurofibromatosis | MANAGE LOCALLY |
| pityriasis_rubra_pilaris | **REFER** |
| psoriasis | MANAGE LOCALLY |
| scabies | MANAGE LOCALLY |

**Excluded classes:** lichen_planus (81 images — diagnostic ambiguity documented in literature, empirically confirmed to degrade all class recall); squamous_cell_carcinoma (44 images — insufficient for malignancy); vitiligo (42 images — insufficient). At inference, low-confidence predictions route to REFER as a safety net.

## Two-Stage Triage Logic

**Stage 1:** If max confidence < 0.45 → route to best REFER class (UNCERTAIN)

**Stage 2:** If any REFER class probability > 0.35 → force REFER prediction

**Rationale:** Conservative approach prioritizes patient safety by defaulting uncertain cases to specialist referral

## Training Dataset

**Source:** Fitzpatrick17k dataset, FST V-VI subset

**Classes:** 5 conditions, 448 total images before augmentation
**Distribution:** Balanced at 250 images per class after augmentation (1,250 total training images)

**Validation/Test:** Natural distribution from Fitzpatrick17k FST V-VI images (~18 images per class per split)

## Performance Metrics

### Overall Performance
- **Accuracy:** 0.4222 (42.22%)
- **Macro Recall:** 0.4186
- **Macro Precision:** 0.4363
- **Macro F1-Score:** 0.4196

### REFER Class Performance
- **Combined REFER Recall:** 0.9767 (97.67%)
- **Target:** ≥75% (patient safety critical)

### Critical Errors
- **REFER→MANAGE LOCALLY misclassifications:** 1
- **Target:** ≤3

### FST Equity
- **Recall Gap (FST V vs VI):** N/A
- **Target:** <10%

## Limitations

1. **Training Data:** Only 341 FST V-VI images across 5 classes — below clinical deployment threshold
2. **FST V-VI Only:** Model trained exclusively on darker skin tones; does not generalize to other FSTs
3. **5 Conditions Only:** Cannot detect conditions outside the 5 trained classes; low confidence → REFER
4. **Image Quality:** Performance assumes adequate lighting, focus, and framing
5. **Clinical Context:** Model does not consider patient history, symptoms, or other clinical factors
6. **Geographic Specificity:** Optimized for Rwanda healthcare context; may need adaptation elsewhere
7. **Not Diagnostic:** Intended for triage support only, not definitive diagnosis

## Ethical Considerations

- **Bias Mitigation:** Specifically addresses AI performance gap on darker skin tones (FST V-VI)
- **Data Scarcity Finding:** Project empirically demonstrates the FST V-VI data gap documented in literature
- **Clinical Validation Required:** Model should be validated in real clinical settings before deployment
- **Human Oversight:** All predictions should be reviewed by qualified healthcare providers
- **Transparency:** Confidence scores provided to support clinical decision-making

## Maintenance and Monitoring

- **Retraining:** Recommended when more FST V-VI data becomes available
- **Data Drift:** Monitor for changes in image quality, demographics, or condition prevalence
- **Performance Monitoring:** Track REFER recall and critical errors in production

## Contact

For questions or issues, contact the DermoAI development team.

---

*This model card follows guidelines from Mitchell et al. (2019) and is intended to promote transparency and responsible AI deployment.*
