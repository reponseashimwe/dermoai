# DermoAI Model Card

## Model Information
- **Architecture:** MobileNetV2 (pretrained on ImageNet)
- **Task:** Multi-class skin lesion classification (8 clinically refined classes)
- **Target Population:** Fitzpatrick Skin Types V-VI (African skin tones)
- **Input:** 224×224 RGB images
- **Output:** Softmax probabilities over 8 classes
- **Total Parameters:** 2,587,976
- **Training Date:** 2026-02-13

## Performance Metrics
- **Overall Accuracy:** 57.1%
- **Macro Recall:** 46.5%
- **Macro Precision:** 53.6%
- **Macro F1-Score:** 48.4%
- **Urgent Case Recall:** 67.7% (Target: ≥80%)

## Training Data
- **Total Training Samples:** 3755 (augmented)
- **Validation Samples:** 324 (original)
- **Test Samples:** 324 (original)
- **Augmentation:** Flips, rotation (±15°), brightness/contrast (±0.1)
- **Class Weighting:** Enabled
- **Training Strategy:** Two-phase (head training + fine-tuning)

## Classes
1. autoimmune
2. benign_neoplastic
3. eczematous_dermatitis
4. genetic_neurocutaneous
5. malignant
6. papulosquamous
7. parasitic
8. pigmentary

## Limitations
- Trained on dermatological images from Fitzpatrick17k dataset
- Optimized for FST V-VI; performance on other skin types not validated
- May not generalize to non-dermatoscopic images
- Performance varies by class (see per-class metrics in final_report.json)
- Requires clinical validation before deployment

## Intended Use
- **Primary:** Triage support for frontline health workers in Rwanda
- **Not for:** Direct diagnosis or treatment decisions without specialist oversight
- **Deployment Context:** Low-resource healthcare settings with limited specialist access

## Ethical Considerations
- Model trained exclusively on FST V-VI to address historical bias in dermatology AI
- Class imbalance addressed via balanced class weighting
- High-risk errors (malignant to benign) monitored: 1 cases
- FST equity gap monitored to prevent within-group disparities

## Citation
If you use this model, please cite:
- DermoAI Capstone Project, 2026
- Fitzpatrick17k Dataset: Groh et al., 2021
