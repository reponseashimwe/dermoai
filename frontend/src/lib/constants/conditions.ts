export interface ConditionInfo {
  displayName: string;
  description: string;
  recommendedAction: string;
}

/**
 * Model conditions (Fitzpatrick V–VI, 5 classes). Matches backend class_names.json.
 * Copy balances clarity for users with useful detail for practitioners.
 */
export const CONDITION_INFO: Record<string, ConditionInfo> = {
  lupus_erythematosus: {
    displayName: "Lupus Erythematosus",
    description:
      "An autoimmune condition that can affect the skin (cutaneous lupus), causing rashes, photosensitivity, and lesions such as discoid or malar rash. Often needs specialist input for diagnosis and treatment.",
    recommendedAction:
      "Specialist evaluation (dermatology or rheumatology) is usually recommended. Sun protection and topical or systemic treatment may be needed. Please see a healthcare provider for a full assessment.",
  },
  neurofibromatosis: {
    displayName: "Neurofibromatosis",
    description:
      "A genetic disorder that can cause benign neurofibromas on or under the skin and café-au-lait spots. Many patients are managed with monitoring; referral for uncertain diagnosis, change in lesions, or genetic counselling when appropriate.",
    recommendedAction:
      "Can often be monitored by a primary or local provider. Consider referral if diagnosis is uncertain, lesions change, or for genetic counselling. Regular follow-up is recommended.",
  },
  pityriasis_rubra_pilaris: {
    displayName: "Pityriasis Rubra Pilaris",
    description:
      "A rare skin disorder with orange-red scaling, palmoplantar keratoderma, and follicular papules; can be mistaken for psoriasis. Usually benefits from dermatology confirmation and treatment planning.",
    recommendedAction:
      "Specialist evaluation is recommended. A dermatologist can confirm the diagnosis and advise on treatment (e.g. topical agents, retinoids, or systemic therapy depending on type and extent).",
  },
  psoriasis: {
    displayName: "Psoriasis",
    description:
      "An autoimmune condition causing scaling and thick, silvery or red plaques, commonly on elbows, knees, and scalp. Severity varies; mild disease is often managed in primary care; moderate–severe or joint involvement may need specialist care.",
    recommendedAction:
      "Mild cases can often be managed locally (topical steroids, emollients). Consider referral for widespread disease, joint involvement, or inadequate response; phototherapy or systemic agents may be needed.",
  },
  scabies: {
    displayName: "Scabies",
    description:
      "Contagious infestation (Sarcoptes scabiei) causing intense itch and burrows, often in finger webs, wrists, and flexures. Treatable with topical permethrin or oral ivermectin; contacts and bedding should be addressed.",
    recommendedAction:
      "Usually managed locally with prescription treatment (e.g. permethrin or ivermectin); treat close contacts and wash bedding. Refer if diagnosis uncertain, treatment failure, or crusted scabies suspected.",
  },
  uncertain: {
    displayName: "Uncertain",
    description:
      "The model could not identify a skin condition with sufficient confidence. This may happen if the image is unclear, not a close-up of skin, or does not show one of the conditions the model was trained on.",
    recommendedAction:
      "Please retake the photo with better lighting and ensure the skin lesion is clearly visible. If the concern persists, see a healthcare provider for a clinical evaluation.",
  },
  other: {
    displayName: "Other / Unclassified",
    description:
      "The image could not be confidently matched to a specific condition. Further clinical evaluation is recommended.",
    recommendedAction:
      "Please see a healthcare provider for evaluation and diagnosis.",
  },
};
