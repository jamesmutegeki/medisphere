import os
import sys
import unittest
import hashlib

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.client.crypto.key_manager import (
    IdentityKeyPair,
    encrypt_message,
    decrypt_message,
    encrypt_with_password,
    decrypt_with_password,
    generate_fingerprint,
    hkdf_derive,
)
from src.shared.constants import AEAD_KEY_SIZE, HKDF_SALT_ROOT


class TestAESGCM(unittest.TestCase):
    def test_encrypt_decrypt_roundtrip(self):
        key = os.urandom(AEAD_KEY_SIZE)
        plaintext = b"Hello, secure world!"
        ct = encrypt_message(plaintext, key)
        dt = decrypt_message(ct, key)
        self.assertEqual(plaintext, dt)

    def test_encrypt_decrypt_with_ad(self):
        key = os.urandom(AEAD_KEY_SIZE)
        plaintext = b"Authenticated encryption test"
        ad = b"associated_data"
        ct = encrypt_message(plaintext, key, ad)
        dt = decrypt_message(ct, key, ad)
        self.assertEqual(plaintext, dt)

    def test_wrong_key_fails(self):
        key = os.urandom(AEAD_KEY_SIZE)
        wrong_key = os.urandom(AEAD_KEY_SIZE)
        plaintext = b"Secret message"
        ct = encrypt_message(plaintext, key)
        with self.assertRaises(Exception):
            decrypt_message(ct, wrong_key)

    def test_wrong_ad_fails(self):
        key = os.urandom(AEAD_KEY_SIZE)
        plaintext = b"Secret message"
        ct = encrypt_message(plaintext, key, b"ad1")
        with self.assertRaises(Exception):
            decrypt_message(ct, key, b"ad2")


class TestPasswordEncryption(unittest.TestCase):
    def test_roundtrip(self):
        data = b"Sensitive local storage data"
        password = "My$ecureP@ssw0rd!"
        salt = os.urandom(16)
        encrypted = encrypt_with_password(data, password, salt)
        decrypted = decrypt_with_password(encrypted, password)
        self.assertEqual(data, decrypted)

    def test_wrong_password_fails(self):
        data = b"Secret data"
        salt = os.urandom(16)
        encrypted = encrypt_with_password(data, "correct", salt)
        with self.assertRaises(Exception):
            decrypt_with_password(encrypted, "wrong")


class TestIdentityKeyGeneration(unittest.TestCase):
    def test_key_generation(self):
        kp = IdentityKeyPair.generate()
        pub_bytes = kp.public_bytes()
        priv_bytes = kp.private_bytes()
        self.assertEqual(len(pub_bytes), 32)
        self.assertEqual(len(priv_bytes), 32)

    def test_key_serialization_roundtrip(self):
        kp = IdentityKeyPair.generate()
        priv_bytes = kp.private_bytes()
        kp2 = IdentityKeyPair.from_private_bytes(priv_bytes)
        self.assertEqual(kp.public_bytes(), kp2.public_bytes())

    def test_key_exchange(self):
        alice = IdentityKeyPair.generate()
        bob = IdentityKeyPair.generate()
        shared1 = alice.private_key.exchange(bob.public_key)
        shared2 = bob.private_key.exchange(alice.public_key)
        self.assertEqual(shared1, shared2)


class TestFingerprint(unittest.TestCase):
    def test_fingerprint_format(self):
        kp = IdentityKeyPair.generate()
        pub = kp.public_bytes()
        fp = generate_fingerprint(pub)
        self.assertIn(" ", fp)
        parts = fp.split()
        self.assertEqual(len(parts), 6)
        for p in parts:
            self.assertEqual(len(p), 4)
            int(p, 16)

    def test_fingerprint_different_for_different_keys(self):
        kp1 = IdentityKeyPair.generate()
        kp2 = IdentityKeyPair.generate()
        fp1 = generate_fingerprint(kp1.public_bytes())
        fp2 = generate_fingerprint(kp2.public_bytes())
        self.assertNotEqual(fp1, fp2)


class TestHKDF(unittest.TestCase):
    def test_hkdf_derivation(self):
        salt = HKDF_SALT_ROOT
        ikm = os.urandom(32)
        key = hkdf_derive(salt, ikm, b"test")
        self.assertEqual(len(key), AEAD_KEY_SIZE)

    def test_hkdf_deterministic(self):
        ikm = os.urandom(32)
        salt = HKDF_SALT_ROOT
        k1 = hkdf_derive(salt, ikm, b"test")
        k2 = hkdf_derive(salt, ikm, b"test")
        self.assertEqual(k1, k2)

    def test_hkdf_different_info(self):
        ikm = os.urandom(32)
        salt = HKDF_SALT_ROOT
        k1 = hkdf_derive(salt, ikm, b"info1")
        k2 = hkdf_derive(salt, ikm, b"info2")
        self.assertNotEqual(k1, k2)


class TestDoubleRatchet(unittest.TestCase):
    def setUp(self):
        from src.client.crypto.double_ratchet import DoubleRatchet
        self.DoubleRatchet = DoubleRatchet

    def test_encrypt_decrypt_roundtrip(self):
        shared_secret = os.urandom(32)
        alice_ratchet = IdentityKeyPair.generate()
        bob_ratchet = IdentityKeyPair.generate()

        alice_dr = self.DoubleRatchet(shared_secret, alice_ratchet)
        bob_dr = self.DoubleRatchet(shared_secret, bob_ratchet)

        alice_dr.initialize_with_their_ratchet(bob_ratchet.public_bytes())

        plaintext = b"Hello Bob, this is Alice!"
        message = alice_dr.encrypt(plaintext)
        decrypted = bob_dr.decrypt(message)

        self.assertEqual(plaintext, decrypted)

    def test_multiple_messages(self):
        shared_secret = os.urandom(32)
        alice_ratchet = IdentityKeyPair.generate()
        bob_ratchet = IdentityKeyPair.generate()

        alice_dr = self.DoubleRatchet(shared_secret, alice_ratchet)
        bob_dr = self.DoubleRatchet(shared_secret, bob_ratchet)

        alice_dr.initialize_with_their_ratchet(bob_ratchet.public_bytes())

        for i in range(10):
            msg = f"Message {i}".encode()
            enc = alice_dr.encrypt(msg)
            dec = bob_dr.decrypt(enc)
            self.assertEqual(msg, dec)

    def test_out_of_order_delivery(self):
        shared_secret = os.urandom(32)
        alice_ratchet = IdentityKeyPair.generate()
        bob_ratchet = IdentityKeyPair.generate()

        alice_dr = self.DoubleRatchet(shared_secret, alice_ratchet)
        bob_dr = self.DoubleRatchet(shared_secret, bob_ratchet)

        alice_dr.initialize_with_their_ratchet(bob_ratchet.public_bytes())

        messages = []
        for i in range(5):
            msg = f"Msg {i}".encode()
            messages.append(alice_dr.encrypt(msg))

        decrypted = bob_dr.decrypt(messages[2])
        self.assertEqual(b"Msg 2", decrypted)

        decrypted = bob_dr.decrypt(messages[1])
        self.assertEqual(b"Msg 1", decrypted)


class TestX3DH(unittest.TestCase):
    def test_key_agreement(self):
        from src.client.crypto.x3dh import (
            x3dh_initialization,
            x3dh_receive,
            generate_signed_prekey,
            create_prekey_bundle,
        )
        from src.client.crypto.key_manager import PreKey

        alice_identity = IdentityKeyPair.generate()
        bob_identity = IdentityKeyPair.generate()
        alice_ephemeral = IdentityKeyPair.generate()

        bob_signed_prekey = generate_signed_prekey(bob_identity)
        bob_opk = IdentityKeyPair.generate()
        bob_one_time = {
            1: bob_opk,
        }

        bundle = create_prekey_bundle(
            bob_identity,
            bob_signed_prekey,
            [PreKey(id=1, key_pair=bob_opk)],
        )

        shared_alice, ep_pub, opk_id = x3dh_initialization(
            alice_identity,
            alice_ephemeral.private_key,
            bundle,
        )

        shared_bob = x3dh_receive(
            bob_identity,
            bob_signed_prekey.key_pair,
            bob_one_time,
            alice_identity.public_bytes(),
            alice_ephemeral.public_bytes(),
            opk_id,
        )

        self.assertIsNotNone(shared_bob)
        self.assertEqual(shared_alice, shared_bob)
        self.assertEqual(len(shared_alice), 32)


if __name__ == "__main__":
    unittest.main()
