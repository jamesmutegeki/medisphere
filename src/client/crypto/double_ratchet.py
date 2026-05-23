import os
from dataclasses import dataclass, field
from typing import Optional

from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric.x25519 import (
    X25519PrivateKey,
    X25519PublicKey,
)

from src.shared.constants import *
from src.client.crypto.key_manager import (
    IdentityKeyPair,
    encrypt_message,
    decrypt_message,
    hkdf_derive,
    safe_decode_pubkey,
)


@dataclass
class MessageKey:
    key: bytes
    number: int
    direction: str  # "send" or "recv"


@dataclass
class RatchetState:
    our_ratchet_key: IdentityKeyPair
    their_ratchet_key: Optional[bytes] = None
    root_key: bytes = b""

    sending_chain: Optional[bytes] = None
    receiving_chain: Optional[bytes] = None

    send_message_number: int = 0
    recv_message_number: int = 0
    prev_send_count: int = 0

    skipped_keys: dict = field(default_factory=dict)
    max_skip: int = MAX_SKIP


class DoubleRatchet:
    def __init__(self, shared_secret: bytes, our_ratchet_key: IdentityKeyPair):
        self.state = RatchetState(
            our_ratchet_key=our_ratchet_key,
            root_key=shared_secret,
        )

    def initialize_with_their_ratchet(
        self, their_ratchet_key_bytes: bytes
    ) -> None:
        their_key = safe_decode_pubkey(their_ratchet_key_bytes)

        self.state.our_ratchet_key = IdentityKeyPair.generate()
        self.state.their_ratchet_key = their_ratchet_key_bytes

        shared = self.state.our_ratchet_key.private_key.exchange(their_key)
        self.state.root_key, self.state.sending_chain = self._kdf_root_key(
            self.state.root_key, shared
        )
        self.state.send_message_number = 0
        self.state.recv_message_number = 0

    def _dh_ratchet(self, their_ratchet_key_bytes: bytes) -> None:
        their_key = safe_decode_pubkey(their_ratchet_key_bytes)

        shared = self.state.our_ratchet_key.private_key.exchange(their_key)
        self.state.root_key, self.state.receiving_chain = self._kdf_root_key(
            self.state.root_key, shared
        )

        self.state.our_ratchet_key = IdentityKeyPair.generate()
        self.state.their_ratchet_key = their_ratchet_key_bytes

        shared2 = self.state.our_ratchet_key.private_key.exchange(their_key)
        self.state.root_key, self.state.sending_chain = self._kdf_root_key(
            self.state.root_key, shared2
        )

        self.state.prev_send_count = self.state.send_message_number
        self.state.send_message_number = 0
        self.state.recv_message_number = 0

    def _kdf_root_key(
        self, root_key: bytes, dh_output: bytes
    ) -> tuple[bytes, bytes]:
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=AEAD_KEY_SIZE * 2,
            salt=root_key,
            info=b"SecureMessengerRootChain",
        )
        output = hkdf.derive(dh_output)
        new_root_key = output[:AEAD_KEY_SIZE]
        chain_key = output[AEAD_KEY_SIZE:]
        return new_root_key, chain_key

    def _kdf_chain_key(self, chain_key: bytes) -> tuple[bytes, bytes]:
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=AEAD_KEY_SIZE * 2,
            salt=chain_key,
            info=b"SecureMessengerChainKey",
        )
        output = hkdf.derive(b"\x01")
        new_chain_key = output[:AEAD_KEY_SIZE]
        message_key = output[AEAD_KEY_SIZE:]
        return new_chain_key, message_key

    def encrypt(self, plaintext: bytes, ad: bytes = b"") -> dict:
        if self.state.sending_chain is None:
            raise RuntimeError("Sending chain not initialized")

        msg_number = self.state.send_message_number
        self.state.sending_chain, msg_key = self._kdf_chain_key(
            self.state.sending_chain
        )

        ciphertext = encrypt_message(plaintext, msg_key, ad)

        ratchet_pub = self.state.our_ratchet_key.public_bytes()

        self.state.send_message_number += 1

        return {
            "ciphertext": ciphertext,
            "ratchet_key": ratchet_pub,
            "message_number": msg_number,
            "prev_send_count": self.state.prev_send_count,
        }

    def _try_skipped_keys(
        self, ratchet_key_bytes: bytes, message_number: int
    ) -> Optional[bytes]:
        key_id = (ratchet_key_bytes, message_number)
        return self.state.skipped_keys.pop(key_id, None)

    def _skip_message_keys(self, until: int, ratchet_key_bytes: bytes) -> None:
        if self.state.receiving_chain is None:
            return

        current_chain = self.state.receiving_chain
        current_num = self.state.recv_message_number

        while current_num < until:
            current_chain, msg_key = self._kdf_chain_key(current_chain)
            key_id = (ratchet_key_bytes, current_num)
            if len(self.state.skipped_keys) >= self.state.max_skip:
                raise RuntimeError("Too many skipped keys — ratchet compromised")
            self.state.skipped_keys[key_id] = msg_key
            current_num += 1

        self.state.receiving_chain = current_chain
        self.state.recv_message_number = current_num

    def decrypt(
        self, message: dict, ad: bytes = b""
    ) -> bytes:
        rk = message["ratchet_key"]
        message_number = message["message_number"]
        prev_send_count = message.get("prev_send_count", 0)
        ciphertext = message["ciphertext"]

        skipped = self._try_skipped_keys(rk, message_number)
        if skipped:
            return decrypt_message(ciphertext, skipped, ad)

        if rk != self.state.their_ratchet_key:
            if self.state.their_ratchet_key is not None:
                self._skip_message_keys(
                    prev_send_count, self.state.their_ratchet_key
                )
            self._dh_ratchet(rk)

        self._skip_message_keys(message_number, rk)

        if self.state.receiving_chain is None:
            raise RuntimeError("Receiving chain not initialized")

        self.state.receiving_chain, msg_key = self._kdf_chain_key(
            self.state.receiving_chain
        )

        plaintext = decrypt_message(ciphertext, msg_key, ad)

        self.state.recv_message_number += 1

        return plaintext

    def get_ratchet_public_key_bytes(self) -> bytes:
        return self.state.our_ratchet_key.public_bytes()

    def serialize_state(self) -> dict:
        skipped = {}
        for (rk_bytes, msg_num), msg_key in self.state.skipped_keys.items():
            key_str = rk_bytes.hex() + ":" + str(msg_num)
            skipped[key_str] = msg_key.hex()
        return {
            "our_ratchet_private": self.state.our_ratchet_key.private_bytes(),
            "their_ratchet_key": self.state.their_ratchet_key,
            "root_key": self.state.root_key,
            "sending_chain": self.state.sending_chain,
            "receiving_chain": self.state.receiving_chain,
            "send_message_number": self.state.send_message_number,
            "recv_message_number": self.state.recv_message_number,
            "prev_send_count": self.state.prev_send_count,
            "skipped_keys": skipped,
            "max_skip": self.state.max_skip,
        }

    @staticmethod
    def deserialize_state(
        data: dict, our_ratchet_key: IdentityKeyPair
    ) -> "DoubleRatchet":
        skipped = {}
        for key_str, val_hex in data.get("skipped_keys", {}).items():
            parts = key_str.split(":")
            rk_bytes = bytes.fromhex(parts[0])
            msg_num = int(parts[1])
            skipped[(rk_bytes, msg_num)] = bytes.fromhex(val_hex)
        dr = DoubleRatchet.__new__(DoubleRatchet)
        dr.state = RatchetState(
            our_ratchet_key=our_ratchet_key,
            their_ratchet_key=data["their_ratchet_key"]
                if data.get("their_ratchet_key") else None,
            root_key=data["root_key"],
            sending_chain=data.get("sending_chain"),
            receiving_chain=data.get("receiving_chain"),
            send_message_number=data.get("send_message_number", 0),
            recv_message_number=data.get("recv_message_number", 0),
            prev_send_count=data.get("prev_send_count", 0),
            skipped_keys=skipped,
            max_skip=data.get("max_skip", MAX_SKIP),
        )
        return dr
