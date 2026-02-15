import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "./use-auth";

interface WebSocketMessage {
	type: string;
	[key: string]: unknown;
}

interface UseWebSocketOptions {
	enabled?: boolean;
}

export function useWebSocket(
	onMessage: (message: WebSocketMessage) => void,
	options: UseWebSocketOptions = {}
) {
	const { user } = useAuth();
	const { enabled = true } = options;
	const [isConnected, setIsConnected] = useState(false);
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const connect = useCallback(() => {
		if (!enabled || !user?.user_id) return;

		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		const host = process.env.NEXT_PUBLIC_API_URL?.replace(/^https?:\/\//, "") || "localhost:8000";
		const wsUrl = `${protocol}//${host}/api/ws/specialists?user_id=${user.user_id}`;

		const ws = new WebSocket(wsUrl);

		ws.onopen = () => {
			setIsConnected(true);
		};

		ws.onmessage = (event) => {
			try {
				const message = JSON.parse(event.data);
				onMessage(message);
			} catch (error) {
				console.error("Failed to parse WebSocket message:", error);
			}
		};

		ws.onclose = () => {
			setIsConnected(false);
			// Reconnect after 3 seconds
			reconnectTimeoutRef.current = setTimeout(connect, 3000);
		};

		ws.onerror = (error) => {
			console.error("WebSocket error:", error);
			ws.close();
		};

		wsRef.current = ws;
	}, [enabled, user?.user_id, onMessage]);

	useEffect(() => {
		connect();

		return () => {
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
			if (wsRef.current) {
				wsRef.current.close();
			}
		};
	}, [connect]);

	return { isConnected };
}
