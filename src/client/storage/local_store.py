import os
import json
import base64
from pathlib import Path
from typing import Any, Optional

from src.client.crypto.key_manager import (
    encrypt_with_password,
    decrypt_with_password,
)


class EncryptedLocalStore:
    def __init__(self, store_dir: str = "local_storage"):
        self.store_dir = Path(store_dir)
        self.store_dir.mkdir(parents=True, exist_ok=True)

        self._master_key: Optional[str] = None
        self._cache: dict[str, Any] = {}
        self._dirty: set[str] = set()

    def unlock(self, master_password: str) -> bytes:
        salt_path = self.store_dir / ".salt"
        if salt_path.exists():
            salt = salt_path.read_bytes()
        else:
            salt = os.urandom(16)
            salt_path.write_bytes(salt)

        self._master_key = master_password
        return salt

    def lock(self) -> None:
        self.flush()
        self._master_key = None
        self._cache.clear()
        self._dirty.clear()

    def store(self, namespace: str, key: str, value: Any) -> None:
        if namespace not in self._cache:
            self._cache[namespace] = {}
        self._cache[namespace][key] = value
        self._dirty.add(namespace)

    def load(self, namespace: str, key: str) -> Optional[Any]:
        if namespace in self._cache and key in self._cache[namespace]:
            return self._cache[namespace][key]
        data = self._read_namespace(namespace)
        if data and key in data:
            return data[key]
        return None

    def delete(self, namespace: str, key: str) -> None:
        if namespace in self._cache and key in self._cache[namespace]:
            del self._cache[namespace][key]
            self._dirty.add(namespace)

    def get_all(self, namespace: str) -> dict:
        if namespace not in self._cache:
            self._cache[namespace] = self._read_namespace(namespace) or {}
        return dict(self._cache[namespace])

    def flush(self) -> None:
        for namespace in self._dirty:
            self._write_namespace(namespace, self._cache.get(namespace, {}))
        self._dirty.clear()

    def wipe_namespace(self, namespace: str) -> None:
        filepath = self.store_dir / f"{namespace}.enc"
        if filepath.exists():
            filepath.unlink()
        self._cache.pop(namespace, None)
        self._dirty.discard(namespace)

    def _read_namespace(self, namespace: str) -> Optional[dict]:
        if not self._master_key:
            raise RuntimeError("Store is locked")
        filepath = self.store_dir / f"{namespace}.enc"
        if not filepath.exists():
            return None
        try:
            data = filepath.read_bytes()
            decrypted = decrypt_with_password(data, self._master_key)
            return json.loads(decrypted.decode("utf-8"))
        except Exception:
            return None

    def _write_namespace(self, namespace: str, data: dict) -> None:
        if not self._master_key:
            raise RuntimeError("Store is locked")
        if not data:
            return
        filepath = self.store_dir / f"{namespace}.enc"
        salt = os.urandom(16)
        serialized = json.dumps(data, separators=(",", ":")).encode("utf-8")
        encrypted = encrypt_with_password(serialized, self._master_key, salt)
        filepath.write_bytes(encrypted)

    def destroy(self) -> None:
        for f in self.store_dir.glob("*.enc"):
            f.unlink()
        self._cache.clear()
        self._dirty.clear()
