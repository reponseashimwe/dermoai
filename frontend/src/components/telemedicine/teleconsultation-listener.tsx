"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { SpecialistCallNotification } from "./specialist-call-notification";
import { ParticipantJoinedNotification } from "@/components/telemedicine/participant-joined-notification";

const TELECONSULTATION_IN_CALL_KEY = "teleconsultation:isInCall";
const TELECONSULTATION_JOINED_AT_KEY = "teleconsultation:joinedAt";
const RECENT_JOIN_SUPPRESS_MS = 2 * 60 * 1000;

interface WebSocketMessage {
	type: string;
	teleconsultation_id?: string;
	[key: string]: unknown;
}

function shouldSuppressJoinedPopup(): boolean {
	if (typeof window === "undefined") return false;
	if (sessionStorage.getItem(TELECONSULTATION_IN_CALL_KEY) === "true") return true;
	const joinedAtRaw = sessionStorage.getItem(TELECONSULTATION_JOINED_AT_KEY);
	const joinedAt = joinedAtRaw ? Number(joinedAtRaw) : NaN;
	return Number.isFinite(joinedAt) && Date.now() - joinedAt < RECENT_JOIN_SUPPRESS_MS;
}

export function TeleconsultationListener() {
	const { user } = useAuth();
	const pathname = usePathname();
	const [incoming, setIncoming] = useState<{
		teleconsultationId: string;
		callerName?: string;
		callerRole?: string;
		callerSpeciality?: string | null;
		isAppointment?: boolean;
	} | null>(null);
	const [joined, setJoined] = useState<{ teleconsultationId: string } | null>(null);

	const onMessage = useCallback(
		(message: WebSocketMessage) => {
			// Do not show popups while already on a teleconsultation page
			if (pathname?.startsWith("/teleconsultations/")) return;
			if (message.type === "teleconsultation_request" && typeof message.teleconsultation_id === "string") {
				const rawName =
					typeof message.requester_name === "string" ? (message.requester_name as string) : undefined;
				const rawRole =
					typeof message.requester_role === "string" ? (message.requester_role as string) : undefined;

				// Fallbacks so we never show "Unknown caller"
				const fallbackName =
					rawName && rawName.trim().length > 0
						? rawName
						: rawRole === "USER"
							? "Patient"
							: rawRole === "PRACTITIONER"
								? "Practitioner"
								: undefined;

				setIncoming({
					teleconsultationId: message.teleconsultation_id,
					callerName: fallbackName,
					callerRole: rawRole,
					callerSpeciality:
						typeof message.requester_speciality === "string"
							? (message.requester_speciality as string)
							: null,
					isAppointment: message.source === "APPOINTMENT",
				});
			} else if (message.type === "teleconsultation_joined" && typeof message.teleconsultation_id === "string") {
				if (shouldSuppressJoinedPopup()) return;
				setJoined({ teleconsultationId: message.teleconsultation_id });
			}
		},
		[pathname],
	);

	const isPractitioner = user?.role === "PRACTITIONER";
	useWebSocket(onMessage, { enabled: isPractitioner });

	// Never render popups while on a call page
	if (!isPractitioner || pathname?.startsWith("/teleconsultations/")) return null;

	if (incoming) {
		return (
			<SpecialistCallNotification
				teleconsultationId={incoming.teleconsultationId}
				callerName={incoming.callerName}
				callerRole={incoming.callerRole}
				callerSpeciality={incoming.callerSpeciality}
				isAppointment={incoming.isAppointment}
				onDismiss={() => setIncoming(null)}
			/>
		);
	}

	if (joined) {
		return (
			<ParticipantJoinedNotification
				teleconsultationId={joined.teleconsultationId}
				onDismiss={() => setJoined(null)}
			/>
		);
	}

	return null;
}
