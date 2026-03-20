"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { SpecialistCallNotification } from "./specialist-call-notification";
import { ParticipantJoinedNotification } from "./participant-joined-notification";

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

export function UserTeleconsultationListener() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [incoming, setIncoming] = useState<{ teleconsultationId: string } | null>(null);
  const [joined, setJoined] = useState<{ teleconsultationId: string } | null>(null);

  const onMessage = useCallback(
    (message: WebSocketMessage) => {
      if (pathname?.startsWith("/teleconsultations/")) return;
      if (message.type === "teleconsultation_request" && typeof message.teleconsultation_id === "string") {
        setIncoming({ teleconsultationId: message.teleconsultation_id });
      } else if (message.type === "teleconsultation_joined" && typeof message.teleconsultation_id === "string") {
        if (shouldSuppressJoinedPopup()) return;
        setJoined({ teleconsultationId: message.teleconsultation_id });
      }
    },
    [pathname],
  );

  const isUser = user?.role === "USER";
  useWebSocket(onMessage, { enabled: isUser, path: "/api/ws/users" });

  if (!isUser || pathname?.startsWith("/teleconsultations/")) return null;

  if (incoming) {
    return (
      <SpecialistCallNotification
        teleconsultationId={incoming.teleconsultationId}
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

