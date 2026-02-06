import { fetchClient } from "./client";
import type { Patient, PatientCreate, PatientUpdate } from "@/types/api";

export async function createPatient(data: PatientCreate): Promise<Patient> {
  return fetchClient<Patient>("/api/patients/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listPatients(): Promise<Patient[]> {
  return fetchClient<Patient[]>("/api/patients/");
}

export async function getPatient(patientId: string): Promise<Patient> {
  return fetchClient<Patient>(`/api/patients/${patientId}`);
}

export async function updatePatient(
  patientId: string,
  data: PatientUpdate
): Promise<Patient> {
  return fetchClient<Patient>(`/api/patients/${patientId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function linkPatient(
  patientId: string,
  userId: string
): Promise<Patient> {
  return fetchClient<Patient>(`/api/patients/${patientId}/link`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}
