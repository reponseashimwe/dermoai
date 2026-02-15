"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { SpecialistCallNotification } from "./specialist-call-notification";

interface WebSocketMessage {
	type: string;
	teleconsultation_id?: string;
	[key: string]: unknown;
}

export function TeleconsultationListener() {
	const { user } = useAuth();
	const [incoming, setIncoming] = useState<{ teleconsultationId: string } | null>(null);

	const onMessage = useCallback((message: WebSocketMessage) => {
		if (message.type === "teleconsultation_request" && typeof message.teleconsultation_id === "string") {
			setIncoming({ teleconsultationId: message.teleconsultation_id });
		}
	}, []);

	const isPractitioner = user?.role === "PRACTITIONER";
	useWebSocket(onMessage, { enabled: isPractitioner });

	if (!isPractitioner) return null;

	if (!incoming) return null;

	return (
		<SpecialistCallNotification
			teleconsultationId={incoming.teleconsultationId}
			onDismiss={() => setIncoming(null)}
		/>
	);
}
