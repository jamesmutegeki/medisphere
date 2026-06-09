import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.client.crypto.key_manager import IdentityKeyPair, PreKey, PreKeyBundle
from src.client.crypto.x3dh import (
    x3dh_initialization,
    x3dh_receive,
    generate_signed_prekey,
    create_prekey_bundle,
    x25519_shared_secret,
)


class TestX3DHKeyExchange(unittest.TestCase):
    def setUp(self):
        self.alice_identity = IdentityKeyPair.generate()
        self.bob_identity = IdentityKeyPair.generate()
        self.alice_ephemeral = IdentityKeyPair.generate()

    def test_basic_exchange(self):
        bob_signed = generate_signed_prekey(self.bob_identity)
        bob_opk = IdentityKeyPair.generate()
        bob_one_time = {1: bob_opk}

        bundle = create_prekey_bundle(
            self.bob_identity,
            bob_signed,
            [PreKey(id=1, key_pair=bob_opk)],
        )

        shared_a, ep_pub, opk_id = x3dh_initialization(
            self.alice_identity,
            self.alice_ephemeral.private_key,
            bundle,
        )

        shared_b = x3dh_receive(
            self.bob_identity,
            bob_signed.key_pair,
            bob_one_time,
            self.alice_identity.public_bytes(),
            self.alice_ephemeral.public_bytes(),
            opk_id,
        )

        self.assertEqual(shared_a, shared_b)
        self.assertEqual(len(shared_a), 32)

    def test_without_one_time_prekey(self):
        bob_signed = generate_signed_prekey(self.bob_identity)

        bundle = create_prekey_bundle(
            self.bob_identity,
            bob_signed,
            [],
        )

        shared_a, ep_pub, opk_id = x3dh_initialization(
            self.alice_identity,
            self.alice_ephemeral.private_key,
            bundle,
        )

        shared_b = x3dh_receive(
            self.bob_identity,
            bob_signed.key_pair,
            {},
            self.alice_identity.public_bytes(),
            self.alice_ephemeral.public_bytes(),
            opk_id,
        )

        self.assertEqual(shared_a, shared_b)

    def test_different_secrets_for_different_ephemerals(self):
        bob_signed = generate_signed_prekey(self.bob_identity)
        bob_opk = IdentityKeyPair.generate()

        bundle = create_prekey_bundle(
            self.bob_identity,
            bob_signed,
            [PreKey(id=1, key_pair=bob_opk)],
        )

        alice_eph2 = IdentityKeyPair.generate()

        shared_a1, _, _ = x3dh_initialization(
            self.alice_identity,
            self.alice_ephemeral.private_key,
            bundle,
        )

        shared_a2, _, _ = x3dh_initialization(
            self.alice_identity,
            alice_eph2.private_key,
            bundle,
        )

        self.assertNotEqual(shared_a1, shared_a2)


class TestDHFunctions(unittest.TestCase):
    def test_shared_secret_symmetry(self):
        alice = IdentityKeyPair.generate()
        bob = IdentityKeyPair.generate()
        s1 = x25519_shared_secret(alice.private_key, bob.public_key)
        s2 = x25519_shared_secret(bob.private_key, alice.public_key)
        self.assertEqual(s1, s2)


if __name__ == "__main__":
    unittest.main()
