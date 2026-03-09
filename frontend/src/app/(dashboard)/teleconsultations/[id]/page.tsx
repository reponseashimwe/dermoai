"use client";

import { use } from "react";
import { CallInterface } from "@/components/telemedicine/call-interface";

export default function TeleconsultationPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);

	return (
		<div className="fixed inset-0 z-50 h-screen w-screen bg-slate-900">
			<CallInterface teleconsultationId={id} />
		</div>
	);
}
