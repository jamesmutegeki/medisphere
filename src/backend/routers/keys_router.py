from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
import base64

from src.backend.database import get_db
from src.backend.models import User, PreKeyRecord
from src.backend.schemas import PreKeyBundleUpload, PreKeyBundleResponse
from src.backend.auth import validate_token

router = APIRouter(prefix="/keys", tags=["keys"])


async def _get_current_user(
    authorization: str = Header(None), db: AsyncSession = Depends(get_db)
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    user_id = validate_token(authorization[7:])
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/upload-bundle")
async def upload_bundle(
    bundle: PreKeyBundleUpload,
    user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user.identity_key = base64.b64decode(bundle.identity_key)
    user.signed_prekey = base64.b64decode(bundle.signed_prekey)
    user.signed_prekey_signature = base64.b64decode(bundle.signed_prekey_signature)
    user.signed_prekey_id = bundle.signed_prekey_id

    await db.execute(
        delete(PreKeyRecord).where(PreKeyRecord.user_id == user.id)
    )

    for opk in bundle.one_time_prekeys:
        record = PreKeyRecord(
            user_id=user.id,
            key_id=opk["key_id"],
            public_key=base64.b64decode(opk["public_key"]),
            is_used=False,
        )
        db.add(record)

    await db.commit()
    return {"status": "ok", "count": len(bundle.one_time_prekeys)}


@router.get("/bundle/{user_id}", response_model=PreKeyBundleResponse)
async def get_bundle(
    user_id: str,
    current_user: User = Depends(_get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if not target.identity_key or not target.signed_prekey:
        raise HTTPException(status_code=404, detail="User has no key bundle")

    opk_result = await db.execute(
        select(PreKeyRecord)
        .where(PreKeyRecord.user_id == user_id, PreKeyRecord.is_used == False)
        .limit(1)
    )
    opk = opk_result.scalar_one_or_none()

    one_time_prekeys = []
    if opk:
        opk.is_used = True
        one_time_prekeys.append({
            "key_id": opk.key_id,
            "public_key": base64.b64encode(opk.public_key).decode(),
        })
        await db.commit()

    return PreKeyBundleResponse(
        identity_key=base64.b64encode(target.identity_key).decode(),
        signed_prekey=base64.b64encode(target.signed_prekey).decode(),
        signed_prekey_signature=base64.b64encode(
            target.signed_prekey_signature
        ).decode() if target.signed_prekey_signature else "",
        signed_prekey_id=target.signed_prekey_id,
        one_time_prekeys=one_time_prekeys,
        user_id=target.id,
    )
