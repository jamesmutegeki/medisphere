import json
import asyncio
import base64
from datetime import datetime, timezone
from typing import Optional

from fastapi import WebSocket, WebSocketDisconnect

from src.backend.auth import validate_token


class ConnectionManager:
    def __init__(self):
        self._connections: dict[str, WebSocket] = {}
        self._user_status: dict[str, str] = {}
        self._typing: dict[str, set[str]] = {}

    async def connect(
        self, websocket: WebSocket, token: str
    ) -> Optional[str]:
        user_id = validate_token(token)
        if not user_id:
            await websocket.close(code=4001)
            return None

        await websocket.accept()

        old_ws = self._connections.get(user_id)
        if old_ws:
            try:
                await old_ws.close(code=4000)
            except Exception:
                pass

        self._connections[user_id] = websocket
        self._user_status[user_id] = "online"
        await self._broadcast_status(user_id, "online")

        return user_id

    async def disconnect(self, user_id: str):
        self._connections.pop(user_id, None)
        self._user_status[user_id] = "offline"
        self._typing.pop(user_id, None)
        await self._broadcast_status(user_id, "offline")

    async def send_to_user(
        self, recipient_id: str, event: str, data: dict
    ) -> bool:
        ws = self._connections.get(recipient_id)
        if not ws:
            return False
        try:
            payload = json.dumps({"event": event, "data": data})
            await ws.send_text(payload)
            return True
        except Exception:
            self._connections.pop(recipient_id, None)
            return False

    async def send_message(
        self, sender_id: str, recipient_id: str, message_data: dict
    ):
        delivered = await self.send_to_user(
            recipient_id,
            "new_message",
            {"from": sender_id, **message_data},
        )
        if delivered:
            await self.send_to_user(
                sender_id, "delivered", {"to": recipient_id}
            )

    async def notify_typing(
        self, sender_id: str, recipient_id: str, is_typing: bool
    ):
        event = "typing" if is_typing else "stopped_typing"
        await self.send_to_user(
            recipient_id,
            event,
            {"from": sender_id},
        )

    async def notify_read_receipt(
        self, sender_id: str, recipient_id: str, message_id: str
    ):
        await self.send_to_user(
            recipient_id,
            "read_receipt",
            {"from": sender_id, "message_id": message_id},
        )

    def get_online_users(self) -> list[str]:
        return [
            uid for uid, status in self._user_status.items()
            if status == "online"
        ]

    def is_online(self, user_id: str) -> bool:
        return self._user_status.get(user_id) == "online"

    async def _broadcast_status(self, user_id: str, status: str):
        payload = json.dumps({
            "event": "status_change",
            "data": {"user_id": user_id, "status": status},
        })
        for uid, ws in self._connections.items():
            if uid != user_id:
                try:
                    await ws.send_text(payload)
                except Exception:
                    pass

    async def handle_websocket(
        self, websocket: WebSocket, token: str = ""
    ):
        user_id = await self.connect(websocket, token)
        if not user_id:
            return

        try:
            while True:
                raw = await websocket.receive_text()
                try:
                    msg = json.loads(raw)
                    await self._route_message(user_id, msg)
                except json.JSONDecodeError:
                    pass
        except WebSocketDisconnect:
            pass
        finally:
            await self.disconnect(user_id)

    async def _route_message(self, user_id: str, msg: dict):
        event = msg.get("event", "")
        data = msg.get("data", {})

        if event == "send_message":
            recipient_id = data.get("recipient_id")
            if recipient_id:
                await self.send_message(user_id, recipient_id, data)

        elif event == "typing":
            recipient_id = data.get("recipient_id")
            is_typing = data.get("is_typing", False)
            if recipient_id:
                await self.notify_typing(user_id, recipient_id, is_typing)

        elif event == "read_receipt":
            recipient_id = data.get("recipient_id")
            message_id = data.get("message_id")
            if recipient_id and message_id:
                await self.notify_read_receipt(
                    user_id, recipient_id, message_id
                )

        elif event == "ping":
            await self.send_to_user(
                user_id, "pong", {"timestamp": datetime.now(timezone.utc).isoformat()}
            )


manager = ConnectionManager()
