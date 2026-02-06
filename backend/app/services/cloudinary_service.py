import cloudinary
import cloudinary.uploader
from fastapi import UploadFile

from app.core.config import settings


def configure_cloudinary():
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


async def upload_image(
    file: UploadFile, folder: str = "dermoai"
) -> dict[str, str | int]:
    contents = await file.read()
    result = cloudinary.uploader.upload(
        contents,
        folder=folder,
        resource_type="image",
    )
    return {
        "url": result["secure_url"],
        "storage_key": result["public_id"],
        "file_size": result.get("bytes", 0),
    }


def delete_image(storage_key: str) -> bool:
    result = cloudinary.uploader.destroy(storage_key)
    return result.get("result") == "ok"
