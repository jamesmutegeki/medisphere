import os
import uuid
import base64
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.database import get_db
from src.backend.models import User, FileRecord
from src.backend.routers.keys_router import _get_current_user
from src.backend.config import settings

router = APIRouter(prefix="/files", tags=["files"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    encrypted_key: str = Form(...),
    mime_type: str = Form("application/octet-stream"),
    user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
):
    contents = await file.read()
    if len(contents) > settings.max_file_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds {settings.max_file_size_mb}MB limit",
        )

    file_id = str(uuid.uuid4())

    record = FileRecord(
        id=file_id,
        sender_id=user.id,
        file_name=file.filename or "unnamed",
        file_size=len(contents),
        encrypted_payload=contents,
        encrypted_key=bytes.fromhex(encrypted_key),
        mime_type=mime_type,
    )
    db.add(record)
    await db.commit()

    return {
        "file_id": file_id,
        "file_name": record.file_name,
        "file_size": record.file_size,
        "mime_type": record.mime_type,
    }


@router.get("/download/{file_id}")
async def download_file(
    file_id: str,
    user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
):
    record = await db.get(FileRecord, file_id)
    if not record:
        raise HTTPException(status_code=404, detail="File not found")

    return Response(
        content=record.encrypted_payload,
        media_type="application/octet-stream",
        headers={
            "X-File-Name": base64.b64encode(
                record.file_name.encode()
            ).decode(),
            "X-Encrypted-Key": record.encrypted_key.hex()
                if record.encrypted_key else "",
            "X-Mime-Type": record.mime_type,
            "X-Sender-Id": record.sender_id,
        },
    )
