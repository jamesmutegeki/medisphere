import os
import hashlib
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.database import get_db
from src.backend.models import User
from src.backend.schemas import (
    RegisterRequest,
    SRPHandshake1Request,
    SRPHandshake1Response,
    SRPHandshake2Request,
    SRPHandshake2Response,
)
from src.backend.auth import (
    N,
    _H,
    create_session_token,
    validate_token,
    srp_create_verifier_bytes,
    srp_derive_K,
)
from src.shared.constants import SRP_GENERATOR, SRP_PRIME_HEX

router = APIRouter(prefix="/auth", tags=["auth"])

_server_sessions: dict[str, dict] = {}

N_int = int(SRP_PRIME_HEX, 16)
g = SRP_GENERATOR
k_int = int.from_bytes(
    hashlib.sha256(
        N_int.to_bytes((N_int.bit_length() + 7) // 8, "big")
        + g.to_bytes(1, "big")
    ).digest(),
    "big",
)


def _pubkey_bytes(key_bytes: bytes) -> bytes:
    return key_bytes


@router.post("/register")
async def register(
    req: RegisterRequest, db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(
        select(User).where(User.username == req.username)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Username taken")

    salt = bytes.fromhex(req.srp_salt)
    verifier = int(req.srp_verifier)
    identity_key = (
        bytes.fromhex(req.identity_key) if req.identity_key else None
    )

    user = User(
        username=req.username,
        srp_salt=salt,
        srp_verifier=str(verifier),
        identity_key=identity_key,
    )
    db.add(user)
    await db.commit()

    return {"status": "ok", "user_id": user.id}


@router.post("/handshake1", response_model=SRPHandshake1Response)
async def handshake1(req: SRPHandshake1Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.username == req.username)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    v = int(user.srp_verifier)
    b = int.from_bytes(os.urandom(32), "big") % N_int
    B = (k_int * v + pow(g, b, N_int)) % N_int

    _server_sessions[req.username] = {
        "b": b,
        "B": B,
        "v": v,
        "user_id": user.id,
    }

    return SRPHandshake1Response(
        salt=user.srp_salt.hex(),
        B=B.to_bytes((N_int.bit_length() + 7) // 8, "big").hex(),
    )


@router.post("/handshake2", response_model=SRPHandshake2Response)
async def handshake2(req: SRPHandshake2Request, db: AsyncSession = Depends(get_db)):
    session = _server_sessions.pop(req.username, None)
    if not session:
        raise HTTPException(status_code=400, detail="No active handshake")

    A = int.from_bytes(bytes.fromhex(req.A), "big")
    if A % N_int == 0:
        raise HTTPException(status_code=400, detail="Invalid A")

    u_bytes = _H(
        A.to_bytes((N_int.bit_length() + 7) // 8, "big"),
        session["B"].to_bytes((N_int.bit_length() + 7) // 8, "big"),
    )
    u = int.from_bytes(u_bytes, "big")

    K_server = srp_derive_K(session["B"], A, session["b"], session["v"], u)

    M1_expected = _H(
        A.to_bytes((N_int.bit_length() + 7) // 8, "big"),
        session["B"].to_bytes((N_int.bit_length() + 7) // 8, "big"),
        K_server,
    )

    client_M1 = bytes.fromhex(req.M1)

    if not _constant_time_compare(client_M1, M1_expected):
        raise HTTPException(status_code=403, detail="Authentication failed")

    M2 = _H(
        A.to_bytes((N_int.bit_length() + 7) // 8, "big"),
        client_M1,
        K_server,
    )

    token = create_session_token(session["user_id"])

    return SRPHandshake2Response(M2=M2.hex(), token=token)


@router.post("/logout")
async def logout(authorization: str = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        from src.backend.auth import revoke_token
        revoke_token(token)
    return {"status": "ok"}


def _constant_time_compare(a: bytes, b: bytes) -> bool:
    if len(a) != len(b):
        return False
    result = 0
    for x, y in zip(a, b):
        result |= x ^ y
    return result == 0
