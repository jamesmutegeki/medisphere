import os
import struct
import hmac
import hashlib

from cryptography.hazmat.primitives.asymmetric.x25519 import (
    X25519PrivateKey,
    X25519PublicKey,
)
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes, serialization

from src.shared.constants import *
from src.client.crypto.key_manager import (
    IdentityKeyPair,
    PreKey,
    PreKeyBundle,
    safe_decode_pubkey,
    hmac_sha256,
)


def x25519_shared_secret(
    private_key: X25519PrivateKey, public_key: X25519PublicKey
) -> bytes:
    return private_key.exchange(public_key)


def x3dh_initialization(
    our_identity: IdentityKeyPair,
    our_ephemeral: X25519PrivateKey,
    their_bundle: PreKeyBundle,
) -> tuple[bytes, X25519PublicKey, int]:
    their_identity_pub = safe_decode_pubkey(their_bundle.identity_key)
    their_signed_prekey_pub = safe_decode_pubkey(
        their_bundle.signed_pre_key.key_pair.public_bytes()
    )

    dh1 = x25519_shared_secret(our_identity.private_key, their_signed_prekey_pub)
    dh2 = x25519_shared_secret(our_ephemeral, their_identity_pub)
    dh3 = x25519_shared_secret(our_ephemeral, their_signed_prekey_pub)

    dh4 = b""
    used_opk_id = -1
    if their_bundle.one_time_pre_keys:
        opk = their_bundle.one_time_pre_keys[0]
        opk_pub = safe_decode_pubkey(opk.key_pair.public_bytes())
        dh4 = x25519_shared_secret(our_ephemeral, opk_pub)
        used_opk_id = opk.id

    shared_secret = HKDF(
        algorithm=hashes.SHA256(),
        length=AEAD_KEY_SIZE,
        salt=HKDF_SALT_ROOT,
        info=b"X3DH-init",
    ).derive(dh1 + dh2 + dh3 + dh4)

    return shared_secret, our_ephemeral.public_key(), used_opk_id


def x3dh_receive(
    our_identity: IdentityKeyPair,
    our_signed_prekey: IdentityKeyPair,
    our_one_time_prekeys: dict[int, IdentityKeyPair],
    their_identity_key_bytes: bytes,
    their_ephemeral_key_bytes: bytes,
    used_opk_id: int,
) -> bytes | None:
    their_identity_pub = safe_decode_pubkey(their_identity_key_bytes)
    their_ephemeral_pub = safe_decode_pubkey(their_ephemeral_key_bytes)

    dh1 = x25519_shared_secret(our_signed_prekey.private_key, their_identity_pub)
    dh2 = x25519_shared_secret(our_identity.private_key, their_ephemeral_pub)
    dh3 = x25519_shared_secret(our_signed_prekey.private_key, their_ephemeral_pub)

    dh4 = b""
    if used_opk_id >= 0 and used_opk_id in our_one_time_prekeys:
        opk = our_one_time_prekeys[used_opk_id]
        dh4 = x25519_shared_secret(opk.private_key, their_ephemeral_pub)
        del our_one_time_prekeys[used_opk_id]

    shared_secret = HKDF(
        algorithm=hashes.SHA256(),
        length=AEAD_KEY_SIZE,
        salt=HKDF_SALT_ROOT,
        info=b"X3DH-init",
    ).derive(dh1 + dh2 + dh3 + dh4)

    return shared_secret


def generate_signed_prekey(
    identity_key: IdentityKeyPair,
) -> PreKey:
    prekey = IdentityKeyPair.generate()
    prekey_bytes = prekey.public_bytes()

    signature = hmac_sha256(
        identity_key.private_bytes(),
        prekey_bytes,
    )

    return PreKey(
        id=0,
        key_pair=prekey,
        is_signed=True,
        signature=signature,
    )


def create_prekey_bundle(
    identity_key: IdentityKeyPair,
    signed_prekey: PreKey,
    one_time_prekeys: list[PreKey],
) -> PreKeyBundle:
    return PreKeyBundle(
        identity_key=identity_key.public_bytes(),
        signed_pre_key=signed_prekey,
        one_time_pre_keys=one_time_prekeys,
        signature=signed_prekey.signature,
    )
