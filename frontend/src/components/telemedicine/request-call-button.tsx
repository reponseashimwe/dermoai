"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useRequestTeleconsultation } from "@/hooks/use-teleconsultations";
import { useAvailablePractitioners } from "@/hooks/use-practitioners";
import { Alert } from "@/components/ui/alert";

interface RequestCallButtonProps {
	consultationId?: string;
	onSuccess?: (teleconsultationId: string) => void;
}

export function RequestCallButton({ consultationId, onSuccess }: RequestCallButtonProps) {
	const [selectedSpecialistId, setSelectedSpecialistId] = useState<string>("");
	const { data: practitioners } = useAvailablePractitioners({ online_only: true });
	const requestMutation = useRequestTeleconsultation();

	const handleRequest = async () => {
		try {
			const result = await requestMutation.mutateAsync({
				consultation_id: consultationId,
				specialist_id: selectedSpecialistId || undefined,
			});
			onSuccess?.(result.teleconsultation_id);
		} catch (error) {
			console.error("Failed to request teleconsultation:", error);
		}
	};

	const specialists = practitioners?.filter((p) => p.practitioner_type === "SPECIALIST") || [];
	const specialistOptions = specialists.map((s) => ({
		value: s.practitioner_id,
		label: `${s.name}${s.expertise ? ` (${s.expertise})` : ""}`,
	}));

	return (
		<div className="space-y-3">
			<div>
				<label className="text-sm font-medium text-slate-700 mb-2 block">
					Request Teleconsultation
				</label>
				<Select
					value={selectedSpecialistId}
					onChange={(e) => setSelectedSpecialistId(e.target.value)}
					className="mb-2"
					placeholder="Any available specialist"
					options={specialistOptions}
				/>
			</div>

			{requestMutation.isError && (
				<Alert variant="error">Failed to request teleconsultation. Please try again.</Alert>
			)}

			<Button
				onClick={handleRequest}
				disabled={requestMutation.isPending}
				loading={requestMutation.isPending}
				className="w-full"
			>
				<Phone className="h-4 w-4" />
				{selectedSpecialistId ? "Call Specialist" : "Request Call"}
			</Button>

			{specialists.length === 0 && (
				<p className="text-xs text-slate-500 text-center">
					No specialists are currently online
				</p>
			)}
		</div>
	);
}
