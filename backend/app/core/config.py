from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/dermoai"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # LiveKit (video calls)
    LIVEKIT_API_KEY: str = ""
    LIVEKIT_API_SECRET: str = ""
    LIVEKIT_URL: str = "ws://localhost:7880"
      
    # Optional: seed a default admin on first run (set in .env for dev)
    SEED_ADMIN_EMAIL: str = ""
    SEED_ADMIN_PASSWORD: str = ""
    SEED_ADMIN_NAME: str = "Admin"

    # Set to an ISO date/datetime string (e.g. "2026-03-13") to freeze time for all DB records.
    # Leave empty in production.
    FREEZE_TIME: str = ""

    # SMS Configuration (Mista IO)
    MISTA_API_KEY: str = ""
    MISTA_API_URL: str = "https://api.mista.io/v1/sms"
    SMS_SENDER_NAME: str = "DermoAI"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
