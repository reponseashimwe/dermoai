from collections import defaultdict
from typing import Any
from uuid import UUID

from fastapi import WebSocket


class ConnectionManager:
    """Manage WebSocket connections for call participants (practitioners, specialists, etc.)."""
    
    def __init__(self):
        # specialist_id -> list of WebSocket connections
        self.active_connections: dict[UUID, list[WebSocket]] = defaultdict(list)
    
    async def connect(self, websocket: WebSocket, participant_id: UUID):
        """Register an already-accepted WebSocket for this participant (caller must accept first)."""
        self.active_connections[participant_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, participant_id: UUID):
        """Disconnect a participant WebSocket."""
        if participant_id in self.active_connections:
            self.active_connections[participant_id].remove(websocket)
            if not self.active_connections[participant_id]:
                del self.active_connections[participant_id]
    
    async def send_to_participant(self, participant_id: UUID, message: dict[str, Any]):
        """Send message to a specific participant (all their connections)."""
        if participant_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[participant_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            
            # Clean up disconnected connections
            for conn in disconnected:
                self.disconnect(conn, participant_id)
    
    async def broadcast_to_participants(self, message: dict[str, Any], exclude: UUID | None = None):
        """Broadcast message to all connected participants except excluded one."""
        for participant_id in list(self.active_connections.keys()):
            if exclude and participant_id == exclude:
                continue
            await self.send_to_participant(participant_id, message)


# Global connection manager instance
manager = ConnectionManager()
