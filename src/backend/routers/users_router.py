from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import base64

from src.backend.database import get_db
from src.backend.models import User
from src.backend.schemas import UserResponse
from src.backend.routers.keys_router import _get_current_user
from src.backend.websocket_manager import manager

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(_get_current_user)):
    return UserResponse(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        identity_key=base64.b64encode(user.identity_key).decode()
            if user.identity_key else None,
        last_online=user.last_online.isoformat() if user.last_online else None,
        created_at=user.created_at.isoformat(),
    )


@router.get("/search", response_model=list[UserResponse])
async def search_users(
    q: str = Query("", min_length=1),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User)
        .where(User.username.contains(q), User.id != user.id)
        .limit(limit)
    )
    users = result.scalars().all()
    return [
        UserResponse(
            id=u.id,
            username=u.username,
            display_name=u.display_name,
            identity_key=base64.b64encode(u.identity_key).decode()
                if u.identity_key else None,
            last_online=u.last_online.isoformat() if u.last_online else None,
            created_at=u.created_at.isoformat(),
        )
        for u in users
    ]


@router.get("/online", response_model=list[str])
async def get_online_users():
    return manager.get_online_users()


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
):
    target = await db.get(User, user_id)
    if not target:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(
        id=target.id,
        username=target.username,
        display_name=target.display_name,
        identity_key=base64.b64encode(target.identity_key).decode()
            if target.identity_key else None,
        last_online=target.last_online.isoformat() if target.last_online else None,
        created_at=target.created_at.isoformat(),
    )
