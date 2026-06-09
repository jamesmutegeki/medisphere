# Secure Messenger — Architecture Document

## Overview

Secure Messenger is a zero-knowledge, end-to-end encrypted messaging platform. The server never sees plaintext messages, private keys, or passwords. All cryptographic operations occur on the client side.

---

## Cryptographic Workflow

### 1. Key Generation (Client-Side)

On first launch, the client generates:

- **Identity Key Pair** — X25519 long-term keypair (used for authentication and identity verification)
- **Signed Pre-Key** — X25519 keypair signed by the identity key (rotated periodically)
- **One-Time Pre-Keys** — 100 X25519 keypairs (consumed during X3DH to provide forward secrecy)

All private keys are stored locally encrypted using AES-256-GCM with a key derived from the user's master password via PBKDF2 (600,000 iterations).

### 2. Registration (SRP — Secure Remote Password)

The user registers using the SRP protocol:

- Client: `x = H(salt | username | password)`, `v = g^x mod N`
- Server stores `(salt, v)` — **never** the password
- The server cannot derive the password from `v`
- On login, both parties compute a shared key `K` without revealing the password

### 3. Session Establishment (X3DH)

When Alice wants to message Bob:

1. Alice fetches Bob's **PreKey Bundle** from the server:
   - Identity Key (public)
   - Signed Pre-Key (public)
   - One-Time Pre-Key (public, consumed)
2. Alice performs 4 Diffie-Hellman exchanges:

   ```
   DH1 = DH(Alice.Identity, Bob.SignedPreKey)
   DH2 = DH(Alice.Ephemeral, Bob.Identity)
   DH3 = DH(Alice.Ephemeral, Bob.SignedPreKey)
   DH4 = DH(Alice.Ephemeral, Bob.OneTimePreKey)
   
   SK = HKDF(salt=RootKey, ikm=DH1 || DH2 || DH3 || DH4)
   ```

3. Alice derives initial Root Key and Chain Key for the Double Ratchet

### 4. Perfect Forward Secrecy (Double Ratchet)

Each message advances a ratcheting chain:

```
ChainKey(n+1) = KDF(ChainKey(n), "chain")
MessageKey(n) = KDF(ChainKey(n), "message")
```

- **Sending Chain** — encrypts outgoing messages
- **Receiving Chain** — decrypts incoming messages
- **DH Ratchet Step** — when a new ratchet key is received, a new DH exchange produces fresh chain keys
- **Skipped Message Keys** — out-of-order messages are handled by storing up to 1000 skipped keys

If a long-term identity key is compromised, **past session keys remain secure** because ephemeral ratchet keys are independent.

### 5. Message Encryption

```
AES-256-GCM(nonce=12bytes.random, key=MessageKey, plaintext)
```

Each message carries:
- 12-byte random nonce
- AEAD tag (16 bytes, appended by AES-GCM)
- Associated data (optional)

### 6. File Sharing

1. Client generates a random 256-bit file key
2. File is encrypted with AES-256-GCM using the file key
3. File key is encrypted with the session's message key
4. Encrypted payload and encrypted key are uploaded to the server
5. Recipient downloads, decrypts the file key, then decrypts the file

### 7. Self-Destructing Messages

- Sender sets a TTL (time-to-live) in seconds
- The server records `expires_at` and runs a periodic cleanup job (APScheduler)
- The client deletes messages from local storage after TTL expiry
- Expired messages are wiped from both client and server

### 8. Identity Verification

- Each user has a **fingerprint** = base64(SHA-256(identity_public_key))
- Displayed as 6 groups of 4 hex characters:
  `A3B2 C1D0 E5F4 8796 AB01 23CD`
- Users compare fingerprints via a trusted out-of-band channel

---

## File Structure

```
secure-messenger/
  src/
    backend/
      main.py                 # FastAPI application entry point
      config.py               # Configuration (env-based)
      database.py             # SQLAlchemy async engine setup
      models.py               # User, Message, PreKeyRecord, FileRecord
      schemas.py              # Pydantic request/response models
      auth.py                 # SRP server-side + token management
      tasks.py                # APScheduler cleanup jobs
      websocket_manager.py    # WebSocket connection manager
      routers/
        auth_router.py        # Registration + SRP handshake
        keys_router.py        # PreKey bundle upload/fetch
        messages_router.py    # Send/receive messages, read receipts
        files_router.py       # Encrypted file upload/download
        users_router.py       # User profile search
    client/
      crypto/
        key_manager.py        # IdentityKeyPair, AES-GCM, HKDF, PBKDF2
        x3dh.py               # X3DH key agreement protocol
        double_ratchet.py     # Double Ratchet implementation
        srp_auth.py           # SRP client-side implementation
      storage/
        local_store.py        # Encrypted password-protected local storage
      ui/
        index.html            # Main SPA HTML
        css/style.css         # Dark theme, animations, responsive layout
        js/
          crypto-client.js    # Web Crypto API wrapper (X25519, AES-GCM, HKDF)
          api.js              # Fetch-based API client
          app.js              # Main application logic and UI binding
    shared/
      constants.py            # Shared protocol constants
  tests/
    test_crypto.py            # Unit tests for crypto primitives
    test_x3dh.py              # Unit tests for X3DH key exchange
    test_ratchet.py           # Unit tests for Double Ratchet
  docs/
    architecture.md           # This document
  .gitignore                  # Prevents secret/key leakage
  requirements.txt            # Python dependencies
```

---

## Security Properties

| Property | Implementation |
|---|---|
| **End-to-End Encryption** | Keys never leave client; server stores only ciphertext |
| **Forward Secrecy** | Double Ratchet rotates keys per-message |
| **Zero-Knowledge Auth** | SRP prevents server from knowing passwords |
| **Encrypted Storage** | Local data encrypted with PBKDF2-derived key |
| **Authentication** | X3DH + identity key signatures |
| **Integrity** | AES-GCM provides authenticated encryption |
| **Repudiation** | No digital signatures on messages (deniability) |

---

## Running the Application

```bash
# Install dependencies
pip install -r requirements.txt

# Start the server
python -m uvicorn src.backend.main:app --reload --port 8000

# Open in browser
open http://localhost:8000
```
