import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.client.crypto.key_manager import IdentityKeyPair
from src.client.crypto.double_ratchet import DoubleRatchet


class TestDoubleRatchet(unittest.TestCase):
    def test_basic_conversation(self):
        shared = os.urandom(32)
        alice_ratchet = IdentityKeyPair.generate()
        bob_ratchet = IdentityKeyPair.generate()

        alice = DoubleRatchet(shared, alice_ratchet)
        bob = DoubleRatchet(shared, bob_ratchet)

        alice.initialize_with_their_ratchet(bob_ratchet.public_bytes())

        msgs = [
            b"Hello Bob",
            b"Hey Alice, how are you?",
            b"All good, working on the crypto",
            b"Great, let me review",
        ]

        encrypted = [alice.encrypt(m) for m in msgs[:2]]
        decrypted = [bob.decrypt(e) for e in encrypted]
        self.assertEqual(decrypted, msgs[:2])

        encrypted2 = [alice.encrypt(m) for m in msgs[2:]]
        decrypted2 = [bob.decrypt(e) for e in encrypted2]
        self.assertEqual(decrypted2, msgs[2:])

    def test_repeated_ratchet_steps(self):
        shared = os.urandom(32)
        alice_ratchet = IdentityKeyPair.generate()
        bob_ratchet = IdentityKeyPair.generate()

        alice = DoubleRatchet(shared, alice_ratchet)
        bob = DoubleRatchet(shared, bob_ratchet)

        alice.initialize_with_their_ratchet(bob_ratchet.public_bytes())

        for i in range(20):
            msg = f"Message {i}".encode()
            enc = alice.encrypt(msg)
            dec = bob.decrypt(enc)
            self.assertEqual(msg, dec)

    def test_self_decrypt_fails(self):
        shared = os.urandom(32)
        alice_ratchet = IdentityKeyPair.generate()

        alice = DoubleRatchet(shared, alice_ratchet)

        with self.assertRaises((RuntimeError, ValueError)):
            alice.decrypt({
                "ciphertext": b"test",
                "ratchet_key": alice_ratchet.public_bytes(),
                "message_number": 0,
                "prev_send_count": 0,
            })

    def test_state_serialization(self):
        shared = os.urandom(32)
        alice_ratchet = IdentityKeyPair.generate()
        bob_ratchet = IdentityKeyPair.generate()

        alice = DoubleRatchet(shared, alice_ratchet)
        bob = DoubleRatchet(shared, bob_ratchet)

        alice.initialize_with_their_ratchet(bob_ratchet.public_bytes())

        msg = b"Test message"
        enc = alice.encrypt(msg)

        state = alice.serialize_state()
        restored = DoubleRatchet.deserialize_state(
            state, IdentityKeyPair.from_private_bytes(state["our_ratchet_private"])
        )

        enc2 = restored.encrypt(b"Restored state test")
        dec = bob.decrypt(enc2)
        self.assertEqual(b"Restored state test", dec)


if __name__ == "__main__":
    unittest.main()
