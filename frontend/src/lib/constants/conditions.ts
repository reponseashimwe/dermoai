export interface ConditionInfo {
  displayName: string;
  description: string;
  recommendedAction: string;
}

export const CONDITION_INFO: Record<string, ConditionInfo> = {
  acne: {
    displayName: "Acne",
    description:
      "A common skin condition where hair follicles become clogged with oil and dead skin cells, causing pimples, blackheads, or whiteheads.",
    recommendedAction:
      "Maintain good skin hygiene. Over-the-counter treatments may help. See a dermatologist for severe or persistent acne.",
  },
  eczema: {
    displayName: "Eczema (Dermatitis)",
    description:
      "A condition that causes skin to become inflamed, itchy, cracked, and rough. It can appear as red or dark patches on the skin.",
    recommendedAction:
      "Keep skin moisturized. Avoid irritants and triggers. Consult a healthcare provider for prescription treatments if needed.",
  },
  psoriasis: {
    displayName: "Psoriasis",
    description:
      "An autoimmune condition that causes rapid skin cell buildup, resulting in scaling and thick, silvery patches on the skin.",
    recommendedAction:
      "Consult a dermatologist for proper management. Topical treatments, phototherapy, or systemic medications may be recommended.",
  },
  melanoma: {
    displayName: "Melanoma",
    description:
      "A serious type of skin cancer that develops in the cells that give skin its color. Early detection is critical for treatment.",
    recommendedAction:
      "URGENT: Seek immediate medical attention. Early detection and treatment are essential. Do not delay consultation.",
  },
  basal_cell_carcinoma: {
    displayName: "Basal Cell Carcinoma",
    description:
      "The most common type of skin cancer. It usually appears as a slightly transparent bump on sun-exposed skin.",
    recommendedAction:
      "URGENT: Consult a dermatologist promptly for biopsy and treatment. Treatment is usually highly effective when caught early.",
  },
  squamous_cell_carcinoma: {
    displayName: "Squamous Cell Carcinoma",
    description:
      "A common form of skin cancer that develops in the squamous cells of the outer layer of the skin.",
    recommendedAction:
      "URGENT: Seek medical evaluation promptly. Treatment options include surgical removal and other procedures.",
  },
  fungal_infection: {
    displayName: "Fungal Infection",
    description:
      "A skin infection caused by fungi, which can cause itching, redness, and scaling. Common types include ringworm and athlete's foot.",
    recommendedAction:
      "Antifungal medications (topical or oral) are usually effective. Keep the affected area clean and dry. See a provider if it persists.",
  },
  benign_lesion: {
    displayName: "Benign Lesion",
    description:
      "A non-cancerous growth or mark on the skin. Common types include moles, skin tags, and seborrheic keratoses.",
    recommendedAction:
      "Generally no treatment needed. Monitor for any changes in size, shape, or color. Consult a doctor if changes occur.",
  },
  viral_infection: {
    displayName: "Viral Infection",
    description:
      "A skin condition caused by a virus, such as warts, herpes simplex, or molluscum contagiosum.",
    recommendedAction:
      "Many viral skin infections resolve on their own. Consult a healthcare provider for treatment options if symptomatic.",
  },
  allergic_reaction: {
    displayName: "Allergic Reaction",
    description:
      "A skin response to an allergen, causing redness, itching, swelling, or hives. Can range from mild to severe.",
    recommendedAction:
      "Identify and avoid the trigger. Antihistamines may provide relief. Seek emergency care if there is difficulty breathing or swelling.",
  },
  pigmentation_disorder: {
    displayName: "Pigmentation Disorder",
    description:
      "Conditions that affect skin color, including vitiligo and melasma. These cause lighter or darker patches on the skin.",
    recommendedAction:
      "Consult a dermatologist for evaluation. Treatment options vary depending on the specific condition and its severity.",
  },
  other: {
    displayName: "Other / Unclassified",
    description:
      "The condition could not be confidently classified into a specific category. Further clinical evaluation is recommended.",
    recommendedAction:
      "Please consult a healthcare provider for proper evaluation and diagnosis.",
  },
};
