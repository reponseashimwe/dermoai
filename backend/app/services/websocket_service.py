from collections import defaultdict
from typing import Any
from uuid import UUID

from fastapi import WebSocket


class ConnectionManager:
    """Manage WebSocket connections for specialists."""
    
    def __init__(self):
        # specialist_id -> list of WebSocket connections
        self.active_connections: dict[UUID, list[WebSocket]] = defaultdict(list)
    
    async def connect(self, websocket: WebSocket, specialist_id: UUID):
        """Register an already-accepted WebSocket for this specialist (caller must accept first)."""
        self.active_connections[specialist_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, specialist_id: UUID):
        """Disconnect a specialist WebSocket."""
        if specialist_id in self.active_connections:
            self.active_connections[specialist_id].remove(websocket)
            if not self.active_connections[specialist_id]:
                del self.active_connections[specialist_id]
    
    async def send_to_specialist(self, specialist_id: UUID, message: dict[str, Any]):
        """Send message to a specific specialist (all their connections)."""
        if specialist_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[specialist_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            
            # Clean up disconnected connections
            for conn in disconnected:
                self.disconnect(conn, specialist_id)
    
    async def broadcast_to_specialists(self, message: dict[str, Any], exclude: UUID | None = None):
        """Broadcast message to all connected specialists except excluded one."""
        for specialist_id in list(self.active_connections.keys()):
            if exclude and specialist_id == exclude:
                continue
            await self.send_to_specialist(specialist_id, message)


# Global connection manager instance
manager = ConnectionManager()
