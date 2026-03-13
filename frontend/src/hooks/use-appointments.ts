import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export interface AppointmentRequest {
  request_id: string;
  consultation_id: string | null;
  requested_by_user_id: string;
  specialist_id: string | null;
  proposed_datetime: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "RESCHEDULED" | "COMPLETED";
  specialist_proposed_datetime: string | null;
  notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  specialist_name?: string | null;
  requester_name?: string | null;
}

export interface CreateAppointmentRequest {
  consultation_id?: string;
  specialist_id?: string;
  proposed_datetime: string;
  notes?: string;
}

export function useMyAppointmentRequests() {
  return useQuery({
    queryKey: ["appointment-requests", "my-requests"],
    queryFn: async () => {
      const response = await apiClient.get<AppointmentRequest[]>(
        "/api/appointments/my-requests"
      );
      return response.data;
    },
  });
}

export function useIncomingAppointmentRequests(enabled: boolean = true) {
  return useQuery({
    queryKey: ["appointment-requests", "incoming"],
    queryFn: async () => {
      const response = await apiClient.get<AppointmentRequest[]>(
        "/api/appointments/incoming"
      );
      return response.data;
    },
    enabled,
  });
}

export function usePendingAppointmentCount() {
  return useQuery({
    queryKey: ["appointment-requests", "pending-count"],
    queryFn: async () => {
      const response = await apiClient.get<{ count: number }>(
        "/api/appointments/pending-count"
      );
      return response.data.count;
    },
  });
}

export function useUpcomingAppointments() {
  return useQuery({
    queryKey: ["appointment-requests", "upcoming"],
    queryFn: async () => {
      const response = await apiClient.get<AppointmentRequest[]>(
        "/api/appointments/upcoming"
      );
      return response.data;
    },
  });
}

export function useAppointmentsByConsultation(consultationId: string) {
  return useQuery({
    queryKey: ["appointment-requests", "by-consultation", consultationId],
    queryFn: async () => {
      const response = await apiClient.get<AppointmentRequest[]>(
        `/api/appointments/upcoming?consultation_id=${consultationId}`
      );
      return response.data;
    },
    enabled: !!consultationId,
  });
}

export function useAppointmentsForMyConsultations() {
  return useQuery({
    queryKey: ["appointment-requests", "for-my-consultations"],
    queryFn: async () => {
      const response = await apiClient.get<AppointmentRequest[]>(
        "/api/appointments/for-my-consultations"
      );
      return response.data;
    },
  });
}

export function useCreateAppointmentRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAppointmentRequest) => {
      const response = await apiClient.post<AppointmentRequest>(
        "/api/appointments/request",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment-requests"] });
    },
  });
}

export interface StartCallResponse {
  teleconsultation_id: string;
}

export function useStartCallFromAppointment() {
  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiClient.post<StartCallResponse>(
        `/api/appointments/${requestId}/start-call`
      );
      return response.data;
    },
  });
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiClient.patch<{ request_id: string; status: string }>(
        `/api/appointments/${requestId}/complete`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment-requests"] });
    },
  });
}

export function useDeleteAppointmentRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      await apiClient.delete(`/api/appointments/${requestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment-requests"] });
    },
  });
}

export function useApproveAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiClient.patch<AppointmentRequest>(
        `/api/appointments/${requestId}/approve`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment-requests"] });
    },
  });
}

export function useRejectAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      reason,
    }: {
      requestId: string;
      reason: string;
    }) => {
      const response = await apiClient.patch<AppointmentRequest>(
        `/api/appointments/${requestId}/reject`,
        { rejection_reason: reason }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment-requests"] });
    },
  });
}

export function useProposeAlternativeTime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      datetime,
    }: {
      requestId: string;
      datetime: string;
    }) => {
      const response = await apiClient.patch<AppointmentRequest>(
        `/api/appointments/${requestId}/propose-time`,
        { specialist_proposed_datetime: datetime }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment-requests"] });
    },
  });
}
