import os
import hashlib
import secrets
import time
from typing import Optional

from src.shared.constants import SRP_GENERATOR, SRP_PRIME_HEX

N = int(SRP_PRIME_HEX, 16)
N_bytes = N.to_bytes((N.bit_length() + 7) // 8, "big")
g = SRP_GENERATOR
k = int.from_bytes(hashlib.sha256(N_bytes + g.to_bytes(1, "big")).digest(), "big")

_tokens: dict[str, dict] = {}


def _H(*args: bytes) -> bytes:
    h = hashlib.sha256()
    for a in args:
        h.update(a)
    return h.digest()


def srp_create_verifier_bytes(
    username: str, password: str
) -> tuple[bytes, int]:
    salt = os.urandom(32)
    x = int.from_bytes(
        _H(salt, username.encode("utf-8"), b":", password.encode("utf-8")),
        "big",
    )
    v = pow(g, x, N)
    return salt, v


def srp_derive_K(B: int, A: int, b: int, v: int, u: int) -> bytes:
    S = pow((A * pow(v, u, N)) % N, b, N)
    return hashlib.sha256(S.to_bytes((N.bit_length() + 7) // 8, "big")).digest()


def create_session_token(user_id: str) -> str:
    token = secrets.token_urlsafe(48)
    _tokens[token] = {
        "user_id": user_id,
        "created_at": time.time(),
        "expires_at": time.time() + 86400 * 7,
    }
    return token


def validate_token(token: str) -> Optional[str]:
    session = _tokens.get(token)
    if not session:
        return None
    if time.time() > session["expires_at"]:
        del _tokens[token]
        return None
    return session["user_id"]


def revoke_token(token: str) -> None:
    _tokens.pop(token, None)
