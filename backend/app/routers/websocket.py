from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from sqlalchemy import select

from app.core.database import async_session
from app.models.user import User
from app.services import practitioner_service, websocket_service

router = APIRouter(prefix="/api/ws", tags=["websocket"])


@router.websocket("/specialists")
async def websocket_specialist_endpoint(
    websocket: WebSocket,
    user_id: str,
):
    """WebSocket endpoint for specialists to receive teleconsultation notifications."""
    practitioner_id = None
    try:
        await websocket.accept()
        user_uuid = UUID(user_id)
        async with async_session() as db:
            practitioner = await practitioner_service.get_by_user_id(user_uuid, db)
        if not practitioner:
            await websocket.close(code=1008, reason="Practitioner not found")
            return
        practitioner_id = practitioner.practitioner_id
        await websocket_service.manager.connect(websocket, practitioner_id)

        while True:
            await websocket.receive_text()
            await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        if practitioner_id is not None:
            websocket_service.manager.disconnect(websocket, practitioner_id)
    except Exception:
        if practitioner_id is not None:
            try:
                websocket_service.manager.disconnect(websocket, practitioner_id)
            except Exception:
                pass
        try:
            await websocket.close(code=1011, reason="WebSocket error")
        except Exception:
            pass


@router.websocket("/users")
async def websocket_user_endpoint(
    websocket: WebSocket,
    user_id: str,
):
    """WebSocket endpoint for users to receive teleconsultation notifications."""
    participant_id = None
    try:
        await websocket.accept()
        user_uuid = UUID(user_id)
        async with async_session() as db:
            result = await db.execute(select(User).where(User.user_id == user_uuid))
            user = result.scalar_one_or_none()
        if not user:
            await websocket.close(code=1008, reason="User not found")
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
        try:
            await websocket.close(code=1011, reason="WebSocket error")
        except Exception:
            pass
