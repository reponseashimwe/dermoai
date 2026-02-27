"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { fetchClient } from "@/lib/api/client";
import { getMyPatient, createPatient } from "@/lib/api/patients";
import { createConsultation } from "@/lib/api/consultations";
import { attachToConsultation } from "@/lib/api/images";
import type { Consultation, User } from "@/types/api";
import { isApiError } from "@/lib/api/errors";

export const PENDING_QUICK_SCAN_IMAGE_ID_KEY = "pending_quick_scan_image_id";

/**
 * Standalone flow: get current user from API, get or create patient, create consultation,
 * attach image. Use after register/login when sessionStorage has a pending scan.
 * Call only when token is already set (e.g. right after register).
 */
export async function saveQuickScanToConsultation(imageId: string): Promise<Consultation> {
  const user = await fetchClient<User>("/api/users/me");
  if (user.role !== "USER") {
    throw new Error("Only patients can save a scan to their consultations.");
  }

  let patientId: string;
  try {
    const patient = await getMyPatient();
    patientId = patient.patient_id;
  } catch (err) {
    if (isApiError(err) && err.status === 404) {
      const newPatient = await createPatient({
        name: user.name,
        phone_number: user.phone_number ?? undefined,
        user_id: user.user_id,
      });
      patientId = newPatient.patient_id;
    } else {
      throw err;
    }
  }

  const consultation = await createConsultation({ patient_id: patientId });
  await attachToConsultation(imageId, consultation.consultation_id);
  return consultation;
}

/**
 * For the current user (as patient): get or create patient, create consultation,
 * attach the quick-scan image to it. Use after a quick scan to "Save to my consultations".
 */
export function useSaveQuickScanToConsultation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ imageId }: { imageId: string }): Promise<Consultation> => {
      if (!user) throw new Error("You must be logged in to save to consultations.");
      return saveQuickScanToConsultation(imageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      queryClient.invalidateQueries({ queryKey: ["patients", "me"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
