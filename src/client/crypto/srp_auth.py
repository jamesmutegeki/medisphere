import os
import hashlib
from dataclasses import dataclass

from cryptography.hazmat.primitives import hashes as crypto_hashes

from src.shared.constants import SRP_GENERATOR, SRP_HASH_ALG


def _H(*args: bytes) -> bytes:
    h = hashlib.sha256()
    for a in args:
        h.update(a)
    return h.digest()


def _pad_to_length(data: bytes, length: int) -> bytes:
    return data.rjust(length, b"\x00")


N = int(SRP_PRIME_HEX, 16)
N_bytes = N.to_bytes((N.bit_length() + 7) // 8, "big")
g = SRP_GENERATOR
k = int.from_bytes(_H(N_bytes, g.to_bytes(1, "big")), "big")


def _modpow(base: int, exp: int, mod: int) -> int:
    return pow(base, exp, mod)


def _to_bytes(x: int) -> bytes:
    return x.to_bytes((N.bit_length() + 7) // 8, "big")


@dataclass
class SRPServerSession:
    username: str
    salt: bytes
    v: int
    b: int
    B: int
    A: int
    S: int | None = None
    K: bytes | None = None
    M1: bytes | None = None
    M2: bytes | None = None
    authenticated: bool = False


def srp_create_verifier(
    username: str, password: str, salt: bytes | None = None
) -> tuple[bytes, int]:
    if salt is None:
        salt = os.urandom(32)
    x = int.from_bytes(
        _H(salt, username.encode("utf-8"), b":", password.encode("utf-8")),
        "big",
    )
    v = _modpow(g, x, N)
    return salt, v


def srp_server_handshake_1(
    username: str, salt: bytes, v: int
) -> tuple[SRPServerSession, bytes]:
    b = int.from_bytes(os.urandom(32), "big") % N
    B = (k * v + _modpow(g, b, N)) % N
    if B == 0:
        b = int.from_bytes(os.urandom(32), "big") % N
        B = (k * v + _modpow(g, b, N)) % N

    session = SRPServerSession(
        username=username,
        salt=salt,
        v=v,
        b=b,
        B=B,
        A=0,
    )
    return session, _to_bytes(B)


def srp_server_handshake_2(
    session: SRPServerSession, A_bytes: bytes
) -> tuple[bool, bytes | None]:
    A = int.from_bytes(A_bytes, "big")
    if A % N == 0:
        return False, None

    session.A = A

    u_bytes = _H(_to_bytes(A), _to_bytes(session.B))
    u = int.from_bytes(u_bytes, "big")

    S_val = _modpow((A * _modpow(session.v, u, N)) % N, session.b, N)
    session.S = S_val
    session.K = hashlib.sha256(_to_bytes(S_val)).digest()

    session.M1 = _H(
        _to_bytes(A),
        _to_bytes(session.B),
        session.K,
    )

    session.M2 = _H(
        _to_bytes(A),
        session.M1,
        session.K,
    )

    return True, session.M1


def srp_server_verify(session: SRPServerSession, client_M1: bytes) -> bool:
    if session.M1 is None:
        return False
    if not _constant_time_compare(client_M1, session.M1):
        return False
    session.authenticated = True
    return True


def srp_client_derive_session(
    username: str,
    password: str,
    salt: bytes,
    B_bytes: bytes,
) -> tuple[bytes, bytes, bytes, bytes]:
    a = int.from_bytes(os.urandom(32), "big") % N
    A = _modpow(g, a, N)

    B = int.from_bytes(B_bytes, "big")
    if B % N == 0:
        raise ValueError("Invalid B from server")

    u_bytes = _H(_to_bytes(A), B_bytes)
    u = int.from_bytes(u_bytes, "big")

    x = int.from_bytes(
        _H(salt, username.encode("utf-8"), b":", password.encode("utf-8")),
        "big",
    )

    S_val = _modpow((B - k * _modpow(g, x, N)) % N, (a + u * x) % N, N)
    K = hashlib.sha256(_to_bytes(S_val)).digest()

    M1 = _H(_to_bytes(A), B_bytes, K)
    M2 = _H(_to_bytes(A), M1, K)

    return _to_bytes(A), M1, M2, K


def _constant_time_compare(a: bytes, b: bytes) -> bool:
    if len(a) != len(b):
        return False
    result = 0
    for x, y in zip(a, b):
        result |= x ^ y
    return result == 0
