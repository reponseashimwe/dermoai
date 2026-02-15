import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface Teleconsultation {
	teleconsultation_id: string;
	consultation_id: string | null;
	practitioner_id: string | null;
	requested_by_user_id: string;
	specialist_id: string | null;
	livekit_room_name: string;
	status: string;
	started_at: string | null;
	ended_at: string | null;
	duration_seconds: number | null;
	created_at: string;
}

export interface TeleconsultationToken {
	token: string;
	room_name: string;
}

export function useIncomingTeleconsultations() {
	return useQuery({
		queryKey: ["teleconsultations", "incoming"],
		queryFn: async () => {
			const response = await api.get<Teleconsultation[]>("/api/teleconsultations/incoming");
			return response.data;
		},
	});
}

export function useRequestTeleconsultation() {
	return useMutation({
		mutationFn: async (data: { consultation_id?: string; specialist_id?: string }) => {
			const response = await api.post<Teleconsultation>("/api/teleconsultations/", data);
			return response.data;
		},
	});
}

export function useAcceptTeleconsultation() {
	return useMutation({
		mutationFn: async (teleconsultationId: string) => {
			const response = await api.post<Teleconsultation>(
				`/api/teleconsultations/${teleconsultationId}/accept`
			);
			return response.data;
		},
	});
}

export function useEndTeleconsultation() {
	return useMutation({
		mutationFn: async (teleconsultationId: string) => {
			const response = await api.post<Teleconsultation>(
				`/api/teleconsultations/${teleconsultationId}/end`
			);
			return response.data;
		},
	});
}

export function useLiveKitToken(teleconsultationId: string | null) {
	return useQuery({
		queryKey: ["teleconsultation-token", teleconsultationId],
		queryFn: async () => {
			if (!teleconsultationId) throw new Error("No teleconsultation ID");
			const response = await api.get<TeleconsultationToken>(
				`/api/teleconsultations/${teleconsultationId}/token`
			);
			return response.data;
		},
		enabled: !!teleconsultationId,
	});
}

export function useTeleconsultation(teleconsultationId: string | null) {
	return useQuery({
		queryKey: ["teleconsultation", teleconsultationId],
		queryFn: async () => {
			if (!teleconsultationId) throw new Error("No teleconsultation ID");
			const response = await api.get<Teleconsultation>(
				`/api/teleconsultations/${teleconsultationId}`
			);
			return response.data;
		},
		enabled: !!teleconsultationId,
	});
}
