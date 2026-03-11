from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services import practitioner_service, websocket_service
from app.models.user import User
from sqlalchemy import select

router = APIRouter(prefix="/api/ws", tags=["websocket"])


@router.websocket("/specialists")
async def websocket_specialist_endpoint(
    websocket: WebSocket,
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    """WebSocket endpoint for specialists to receive teleconsultation notifications."""
    practitioner_id = None
    try:
        await websocket.accept()
        practitioner = await practitioner_service.get_by_user_id(UUID(user_id), db)
        practitioner_id = practitioner.practitioner_id
        await websocket_service.manager.connect(websocket, practitioner_id)

        while True:
            await websocket.receive_text()
            await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        if practitioner_id is not None:
            websocket_service.manager.disconnect(websocket, practitioner_id)
    except Exception as e:
        if practitioner_id is not None:
            try:
                websocket_service.manager.disconnect(websocket, practitioner_id)
            except Exception:
                pass
        raise


@router.websocket("/users")
async def websocket_user_endpoint(
    websocket: WebSocket,
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    """WebSocket endpoint for users to receive teleconsultation notifications."""
    participant_id = None
    try:
        await websocket.accept()
        result = await db.execute(select(User).where(User.user_id == UUID(user_id)))
        user = result.scalar_one_or_none()
        if not user:
            await websocket.close()
            return
        participant_id = user.user_id
        await websocket_service.manager.connect(websocket, participant_id)

        while True:
            await websocket.receive_text()
            await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        if participant_id is not None:
            websocket_service.manager.disconnect(websocket, participant_id)
    except Exception:
        if participant_id is not None:
            try:
                websocket_service.manager.disconnect(websocket, participant_id)
            except Exception:
                pass
        raise
