# DermoAI Model Card


## Model Details

**Model Name:** DermoAI EfficientNetB0 FST V-VI Skin Lesion Classifier
**Architecture:** EfficientNetB0 (ImageNet pretrained) + Custom Classification Head
**Framework:** TensorFlow/Keras
**Date:** 2026-03-05
**Version:** 2.0

## Intended Use

**Primary Use:** AI-assisted dermatological triage for resource-limited primary care settings in Rwanda

**Target Population:** Patients with Fitzpatrick Skin Types (FST) V-VI (darker skin tones)

**Clinical Workflow:**
1. Primary care provider captures skin lesion image
2. Model classifies into one of 5 conditions
3. System routes to either REFER (specialist) or MANAGE LOCALLY (primary care)

## Model Architecture

- **Base Model:** EfficientNetB0 (ImageNet weights)
- **Input:** 224×224×3 RGB images
- **Classification Head:**
  - GlobalAveragePooling2D
  - Dense(256, relu) + L2 regularization + Dropout(0.3)
  - Dense(128, relu) + Dropout(0.15)
  - Dense(5, softmax)
- **Parameters:** 4,411,048 total (1,857,637 trainable after fine-tuning)

## Training Strategy

**Two-Phase Training:**

1. **Phase 1 — Feature Extraction (50 epochs)**
   - Base model frozen
   - Learning rate: 0.0003 (CosineDecay → 1e-07)
   - Class weights: lupus=3.0x, scabies=2.5x, neurofibromatosis=2.0x, PRP/psoriasis=1.5x
   - Monitor: val_loss

2. **Phase 2 — Fine-Tuning (40 epochs)**
   - Last 30 layers of EfficientNetB0 unfrozen
   - Learning rate: 5e-05 (CosineDecay → 1e-07)
   - REFER class weights boosted: lupus=4.0x, PRP=4.0x
   - Monitor: val_loss

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

**Excluded classes:** lichen_planus (diagnostic ambiguity on FST V-VI); squamous_cell_carcinoma (44 images — insufficient); vitiligo (42 images — insufficient). At inference, low-confidence predictions route to REFER as a safety net.

## Two-Stage Triage Logic

**Stage 1:** If max confidence < 0.45 → route to best REFER class (UNCERTAIN)

**Stage 2:** If any REFER class probability > 0.6 → force REFER prediction

**Rationale:** Conservative approach prioritizes patient safety by defaulting uncertain cases to specialist referral

## Training Dataset

**Source:** Fitzpatrick17k dataset, FST V-VI subset

**Classes:** 5 conditions, 448 total images before augmentation
**Distribution:** Balanced at 250 images per class after augmentation (1,250 total training images)

**Validation/Test:** Natural distribution from Fitzpatrick17k FST V-VI images (~18 images per class per split)

## Performance Metrics

### Overall Performance
- **Accuracy:** 0.7667 (76.67%)
- **Macro Recall:** 0.7649
- **Macro Precision:** 0.8025
- **Macro F1-Score:** 0.7733

### REFER Class Performance
- **Combined REFER Recall:** 0.9535 (95.35%)
- **Target:** ≥75% (patient safety critical)

### Critical Errors
- **REFER→MANAGE LOCALLY misclassifications:** 2
- **Target:** ≤3

### FST Equity
- **Accuracy Gap (FST V vs VI):** 0.1136
- **Target:** <15% (accuracy gap)

## Limitations

1. **Training Data:** Only 448 FST V-VI images across 5 classes before augmentation — below clinical deployment threshold
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
