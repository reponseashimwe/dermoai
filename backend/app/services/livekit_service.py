import calendar
import subprocess
from datetime import UTC, datetime, timedelta

import jwt
from livekit import api

from app.core.config import settings


def _livekit_creds() -> tuple[str, str, str]:
    url = settings.LIVEKIT_URL.strip()
    api_key = settings.LIVEKIT_API_KEY.strip()
    api_secret = settings.LIVEKIT_API_SECRET.strip()
    return url, api_key, api_secret


def _real_epoch_now() -> int:
    """Return wall-clock epoch seconds even when freezegun freezes process time."""
    try:
        output = subprocess.check_output(["date", "+%s"], text=True).strip()
        return int(output)
    except Exception:
        # Fallback for environments where `date` command is unavailable.
        return calendar.timegm(datetime.now(UTC).utctimetuple())


async def create_room(room_name: str) -> dict:
    """Create a LiveKit room for teleconsultation."""
    livekit_url, livekit_api_key, livekit_api_secret = _livekit_creds()
    async with api.LiveKitAPI(livekit_url, livekit_api_key, livekit_api_secret) as livekit_api:
        room_info = await livekit_api.room.create_room(api.CreateRoomRequest(name=room_name))

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
    _livekit_url, livekit_api_key, livekit_api_secret = _livekit_creds()
    token = api.AccessToken(livekit_api_key, livekit_api_secret)
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

    # Build JWT explicitly so nbf/exp come from real UTC time even if app time is frozen.
    now_epoch = _real_epoch_now()
    exp_epoch = now_epoch + int(timedelta(hours=2).total_seconds())
    jwt_claims = token.claims.asdict()
    jwt_claims.update(
        {
            "sub": participant_identity,
            "iss": livekit_api_key,
            "nbf": now_epoch,
            "exp": exp_epoch,
        }
    )
    return jwt.encode(jwt_claims, livekit_api_secret, algorithm="HS256")


async def delete_room(room_name: str) -> None:
    """Delete a LiveKit room after call ends."""
    livekit_url, livekit_api_key, livekit_api_secret = _livekit_creds()
    async with api.LiveKitAPI(livekit_url, livekit_api_key, livekit_api_secret) as livekit_api:
        await livekit_api.room.delete_room(api.RoomDeleteRequest(room=room_name))
