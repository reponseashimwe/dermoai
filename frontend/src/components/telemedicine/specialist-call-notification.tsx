"use client";

import { Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAcceptTeleconsultation } from "@/hooks/use-teleconsultations";
import { useRouter } from "next/navigation";

interface SpecialistCallNotificationProps {
	teleconsultationId: string;
	practitionerName?: string;
	onDismiss: () => void;
}

export function SpecialistCallNotification({
	teleconsultationId,
	practitionerName = "A practitioner",
	onDismiss,
}: SpecialistCallNotificationProps) {
	const router = useRouter();
	const acceptMutation = useAcceptTeleconsultation();

	const handleAccept = async () => {
		try {
			await acceptMutation.mutateAsync(teleconsultationId);
			router.push(`/teleconsultations/${teleconsultationId}`);
			onDismiss();
		} catch (error) {
			console.error("Failed to accept call:", error);
		}
	};

	return (
		<div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-primary-200 bg-white p-4 shadow-lg animate-in slide-in-from-bottom-5">
			<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 animate-pulse">
				<Phone className="h-6 w-6" />
			</div>
			<div className="flex-1">
				<p className="font-semibold text-slate-900">Incoming Call</p>
				<p className="text-sm text-slate-600">{practitionerName} is requesting a teleconsultation</p>
			</div>
			<div className="flex gap-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={onDismiss}
					className="h-9 w-9 rounded-full p-0"
				>
					<X className="h-5 w-5" />
				</Button>
				<Button
					variant="primary"
					size="sm"
					onClick={handleAccept}
					disabled={acceptMutation.isPending}
					className="gap-2"
				>
					<Phone className="h-4 w-4" />
					Accept
				</Button>
			</div>
		</div>
	);
}
