# Secure Messenger

End-to-end encrypted messaging platform with Perfect Forward Secrecy and zero-knowledge authentication.

## Features

- **True E2E Encryption** — X25519 + AES-256-GCM, keys never leave your device
- **Perfect Forward Secrecy** — Double Ratchet algorithm (Signal Protocol)
- **Zero-Knowledge Auth** — SRP protocol, server never sees passwords
- **Self-Destructing Messages** — TTL-based message expiry
- **Encrypted File Sharing** — Client-side encryption before upload
- **Cryptographic Identity Verification** — Safety numbers / fingerprint comparison
- **Dark, Modern UI** — Minimalist design with connection security indicators
- **WebSocket Real-Time** — Instant delivery, typing indicators, read receipts

## Quick Start

```bash
pip install -r requirements.txt
uvicorn src.backend.main:app --reload --port 8000
```

Open http://localhost:8000 in your browser.

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full cryptographic workflow and system design.

## Testing

```bash
pytest tests/ -v
```

## Security

- Never share your private keys or master password
- Verify safety numbers with contacts via a trusted channel
- All encryption is done client-side in your browser

## License

MIT
