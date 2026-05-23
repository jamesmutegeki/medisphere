import json
import base64
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy import select, or_, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from src.backend.database import get_db
from src.backend.models import User, Message
from src.backend.schemas import SendMessageRequest, MessageResponse
from src.backend.routers.keys_router import _get_current_user

router = APIRouter(prefix="/messages", tags=["messages"])


def message_to_response(msg: Message) -> MessageResponse:
    return MessageResponse(
        id=msg.id,
        sender_id=msg.sender_id,
        recipient_id=msg.recipient_id,
        ciphertext=base64.b64encode(msg.ciphertext).decode(),
        ratchet_key=base64.b64encode(msg.ratchet_key).decode()
            if msg.ratchet_key else None,
        message_number=msg.message_number,
        prev_send_count=msg.prev_send_count,
        message_type=msg.message_type,
        file_id=msg.file_id,
        ttl_seconds=msg.ttl_seconds,
        is_read=msg.is_read,
        is_delivered=msg.is_delivered,
        created_at=msg.created_at.isoformat(),
    )


@router.post("/send")
async def send_message(
    req: SendMessageRequest,
    user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
):
    recipient = await db.get(User, req.recipient_id)
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    expires_at = None
    if req.ttl_seconds and req.ttl_seconds > 0:
        expires_at = datetime.now(timezone.utc) + timedelta(
            seconds=req.ttl_seconds
        )

    msg = Message(
        sender_id=user.id,
        recipient_id=req.recipient_id,
        ciphertext=base64.b64decode(req.ciphertext),
        ratchet_key=base64.b64decode(req.ratchet_key)
            if req.ratchet_key else None,
        message_number=req.message_number,
        prev_send_count=req.prev_send_count,
        message_type=req.message_type,
        file_id=req.file_id,
        ttl_seconds=req.ttl_seconds,
        expires_at=expires_at,
    )
    db.add(msg)
    await db.commit()

    return {"status": "sent", "message_id": msg.id}


@router.get("/inbox", response_model=list[MessageResponse])
async def get_inbox(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Message)
        .where(Message.recipient_id == user.id)
        .order_by(desc(Message.created_at))
        .offset(offset)
        .limit(limit)
    )
    messages = result.scalars().all()
    return [message_to_response(m) for m in messages]


@router.get("/conversation/{user_id}", response_model=list[MessageResponse])
async def get_conversation(
    user_id: str,
    limit: int = Query(50, ge=1, le=200),
    before: Optional[str] = None,
    user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Message).where(
        or_(
            and_(Message.sender_id == user.id, Message.recipient_id == user_id),
            and_(Message.sender_id == user_id, Message.recipient_id == user.id),
        )
    )
    if before:
        before_dt = datetime.fromisoformat(before)
        query = query.where(Message.created_at < before_dt)

    query = query.order_by(desc(Message.created_at)).limit(limit)
    result = await db.execute(query)
    messages = result.scalars().all()
    return [message_to_response(m) for m in messages]


@router.post("/mark-read/{message_id}")
async def mark_read(
    message_id: str,
    user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
):
    msg = await db.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.recipient_id != user.id:
        raise HTTPException(status_code=403, detail="Not your message")
    msg.is_read = True
    await db.commit()
    return {"status": "ok"}


@router.post("/mark-delivered/{message_id}")
async def mark_delivered(
    message_id: str,
    user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
):
    msg = await db.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    if msg.recipient_id != user.id:
        raise HTTPException(status_code=403, detail="Not your message")
    msg.is_delivered = True
    await db.commit()
    return {"status": "ok"}
