import os
import json
import base64
import hashlib
from dataclasses import dataclass, field
from typing import Optional

from cryptography.hazmat.primitives import hashes, hmac
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.asymmetric.x25519 import (
    X25519PrivateKey,
    X25519PublicKey,
)
from cryptography.hazmat.primitives.serialization import (
    Encoding,
    PrivateFormat,
    PublicFormat,
    NoEncryption,
)
from cryptography.exceptions import InvalidTag

from src.shared.constants import *


@dataclass
class IdentityKeyPair:
    private_key: X25519PrivateKey
    public_key: X25519PublicKey

    def public_bytes(self) -> bytes:
        return self.public_key.public_bytes(
            Encoding.Raw, PublicFormat.Raw
        )

    def private_bytes(self) -> bytes:
        return self.private_key.private_bytes(
            Encoding.Raw, PrivateFormat.Raw, NoEncryption()
        )

    @staticmethod
    def generate() -> "IdentityKeyPair":
        private = X25519PrivateKey.generate()
        public = private.public_key()
        return IdentityKeyPair(private_key=private, public_key=public)

    @staticmethod
    def from_private_bytes(data: bytes) -> "IdentityKeyPair":
        private = X25519PrivateKey.from_private_bytes(data)
        public = private.public_key()
        return IdentityKeyPair(private_key=private, public_key=public)


@dataclass
class PreKey:
    id: int
    key_pair: IdentityKeyPair
    is_signed: bool = False
    signature: Optional[bytes] = None


@dataclass
class PreKeyBundle:
    identity_key: bytes
    signed_pre_key: PreKey
    one_time_pre_keys: list[PreKey]
    signature: bytes


@dataclass
class SessionState:
    their_identity_key: bytes
    our_identity_key: bytes
    their_ratchet_key: bytes
    our_ratchet_key: IdentityKeyPair
    root_key: bytes
    sending_chain_key: Optional[bytes] = None
    receiving_chain_key: Optional[bytes] = None
    message_number_send: int = 0
    message_number_recv: int = 0
    previous_sending_chain_number: int = 0
    skipped_message_keys: dict = field(default_factory=dict)


def derive_key_from_password(password: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        600_000,
        AEAD_KEY_SIZE,
    )


def encrypt_with_password(data: bytes, password: str, salt: bytes) -> bytes:
    key = derive_key_from_password(password, salt)
    aesgcm = AESGCM(key)
    nonce = os.urandom(AEAD_NONCE_SIZE)
    ciphertext = aesgcm.encrypt(nonce, data, None)
    return salt + nonce + ciphertext


def decrypt_with_password(data: bytes, password: str) -> bytes:
    salt = data[:16]
    nonce = data[16:16 + AEAD_NONCE_SIZE]
    ciphertext = data[16 + AEAD_NONCE_SIZE:]
    key = derive_key_from_password(password, salt)
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext, None)


def hkdf_derive(
    salt: bytes, ikm: bytes, info: bytes, length: int = AEAD_KEY_SIZE
) -> bytes:
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=length,
        salt=salt,
        info=info,
    )
    return hkdf.derive(ikm)


def encrypt_message(
    plaintext: bytes, key: bytes, associated_data: bytes = b""
) -> bytes:
    aesgcm = AESGCM(key)
    nonce = os.urandom(AEAD_NONCE_SIZE)
    return nonce + aesgcm.encrypt(nonce, plaintext, associated_data)


def decrypt_message(
    ciphertext: bytes, key: bytes, associated_data: bytes = b""
) -> bytes:
    nonce = ciphertext[:AEAD_NONCE_SIZE]
    ct = ciphertext[AEAD_NONCE_SIZE:]
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ct, associated_data)


def generate_fingerprint(public_key_bytes: bytes) -> str:
    h = hashlib.sha256(public_key_bytes).digest()
    chunks = []
    for i in range(0, 12, 2):
        pair = h[i:i+2].hex().upper()
        chunks.append(pair)
    return " ".join(chunks)


def hmac_sha256(key: bytes, data: bytes) -> bytes:
    h = hmac.HMAC(key, hashes.SHA256())
    h.update(data)
    return h.finalize()


def safe_decode_pubkey(data: bytes) -> X25519PublicKey:
    return X25519PublicKey.from_public_bytes(data)
