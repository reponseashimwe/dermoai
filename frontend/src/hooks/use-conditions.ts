import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface Condition {
	condition_id: string;
	condition_name: string;
	category: string | null;
	is_predefined: boolean;
	created_at: string;
}

export function useConditions() {
	return useQuery({
		queryKey: ["conditions"],
		queryFn: async () => {
			const response = await api.get<Condition[]>("/api/conditions/");
			return response.data;
		},
	});
}

export function useCreateCondition() {
	return useMutation({
		mutationFn: async (data: { condition_name: string; category?: string }) => {
			const response = await api.post<Condition>("/api/conditions/", data);
			return response.data;
		},
	});
}
