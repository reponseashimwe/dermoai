"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { CallInterface } from "@/components/telemedicine/call-interface";

export default function TeleconsultationPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const searchParams = useSearchParams();
	const appointmentId = searchParams.get("appointmentId") ?? undefined;

	return (
		<div className="fixed inset-0 z-50 h-screen w-screen bg-slate-900">
			<CallInterface
				teleconsultationId={id}
				{...({ appointmentId } as any)}
			/>
		</div>
	);
}
