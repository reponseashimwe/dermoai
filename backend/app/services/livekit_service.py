from datetime import timedelta

from livekit import api

from app.core.config import settings


async def create_room(room_name: str) -> dict:
    """Create a LiveKit room for teleconsultation."""
    livekit_api = api.LiveKitAPI(
        settings.LIVEKIT_URL,
        settings.LIVEKIT_API_KEY,
        settings.LIVEKIT_API_SECRET,
    )
    
    room_info = await livekit_api.room.create_room(
        api.CreateRoomRequest(name=room_name)
    )
    
    return {
        "room_name": room_info.name,
        "sid": room_info.sid,
    }


def generate_token(
    room_name: str,
    participant_name: str,
    participant_identity: str,
) -> str:
    """Generate LiveKit access token for participant."""
    token = api.AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
    token.with_identity(participant_identity)
    token.with_name(participant_name)
    token.with_grants(
        api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True,
        )
    )
    token.with_ttl(timedelta(hours=2))
    
    return token.to_jwt()


async def delete_room(room_name: str) -> None:
    """Delete a LiveKit room after call ends."""
    livekit_api = api.LiveKitAPI(
        settings.LIVEKIT_URL,
        settings.LIVEKIT_API_KEY,
        settings.LIVEKIT_API_SECRET,
    )
    
    await livekit_api.room.delete_room(
        api.RoomDeleteRequest(room=room_name)
    )
