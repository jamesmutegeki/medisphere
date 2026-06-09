from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import delete

from src.backend.config import settings
from src.backend.database import async_session_factory
from src.backend.models import Message

scheduler = AsyncIOScheduler()


async def _cleanup_expired_messages():
    async with async_session_factory() as session:
        now = datetime.now(timezone.utc)
        await session.execute(
            delete(Message).where(Message.expires_at <= now)
        )
        await session.commit()


scheduler.add_job(
    _cleanup_expired_messages,
    "interval",
    minutes=settings.message_ttl_cleanup_minutes,
    id="cleanup_expired_messages",
)
