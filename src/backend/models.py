import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    String,
    Integer,
    LargeBinary,
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Float,
    Index,
)
from sqlalchemy.orm import relationship

from src.backend.database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(64), unique=True, nullable=False, index=True)
    display_name = Column(String(128), default="")

    srp_salt = Column(LargeBinary(32), nullable=False)
    srp_verifier = Column(Text, nullable=False)

    identity_key = Column(LargeBinary(32), nullable=True)
    signed_prekey = Column(LargeBinary(32), nullable=True)
    signed_prekey_signature = Column(LargeBinary(64), nullable=True)
    signed_prekey_id = Column(Integer, default=0)

    last_online = Column(DateTime, default=_utcnow)
    created_at = Column(DateTime, default=_utcnow)

    messages_sent = relationship(
        "Message", foreign_keys="Message.sender_id", backref="sender", lazy="selectin"
    )
    messages_received = relationship(
        "Message",
        foreign_keys="Message.recipient_id",
        backref="recipient",
        lazy="selectin",
    )


class PreKeyRecord(Base):
    __tablename__ = "prekeys"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    key_id = Column(Integer, nullable=False)
    public_key = Column(LargeBinary(32), nullable=False)
    is_used = Column(Boolean, default=False)

    __table_args__ = (
        Index("idx_user_key", "user_id", "key_id", unique=True),
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = Column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    recipient_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    ciphertext = Column(LargeBinary, nullable=False)
    ratchet_key = Column(LargeBinary(32), nullable=True)
    message_number = Column(Integer, default=0)
    prev_send_count = Column(Integer, default=0)

    message_type = Column(Integer, default=1)
    file_id = Column(String, nullable=True)

    ttl_seconds = Column(Integer, nullable=True)
    expires_at = Column(DateTime, nullable=True)

    is_read = Column(Boolean, default=False)
    is_delivered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_utcnow)

    __table_args__ = (
        Index("idx_conv", "sender_id", "recipient_id"),
        Index("idx_expires", "expires_at"),
    )


class FileRecord(Base):
    __tablename__ = "files"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    file_name = Column(String(256), nullable=False)
    file_size = Column(Integer, nullable=False)
    encrypted_payload = Column(LargeBinary, nullable=False)
    encrypted_key = Column(LargeBinary, nullable=True)
    mime_type = Column(String(128), default="application/octet-stream")
    created_at = Column(DateTime, default=_utcnow)
    expires_at = Column(DateTime, nullable=True)
