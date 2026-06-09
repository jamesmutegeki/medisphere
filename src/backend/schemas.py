from pydantic import BaseModel, Field
from typing import Optional


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    srp_salt: str
    srp_verifier: str
    identity_key: Optional[str] = None


class SRPHandshake1Request(BaseModel):
    username: str


class SRPHandshake1Response(BaseModel):
    salt: str
    B: str


class SRPHandshake2Request(BaseModel):
    username: str
    A: str
    M1: str


class SRPHandshake2Response(BaseModel):
    M2: str
    token: str


class PreKeyBundleUpload(BaseModel):
    identity_key: str
    signed_prekey: str
    signed_prekey_signature: str
    signed_prekey_id: int = 0
    one_time_prekeys: list[dict]


class PreKeyBundleResponse(BaseModel):
    identity_key: str
    signed_prekey: str
    signed_prekey_signature: str
    signed_prekey_id: int
    one_time_prekeys: list[dict]
    user_id: str


class SendMessageRequest(BaseModel):
    recipient_id: str
    ciphertext: str
    ratchet_key: Optional[str] = None
    message_number: int = 0
    prev_send_count: int = 0
    message_type: int = 1
    file_id: Optional[str] = None
    ttl_seconds: Optional[int] = None


class MessageResponse(BaseModel):
    id: str
    sender_id: str
    recipient_id: str
    ciphertext: str
    ratchet_key: Optional[str] = None
    message_number: int
    prev_send_count: int
    message_type: int
    file_id: Optional[str] = None
    ttl_seconds: Optional[int] = None
    is_read: bool
    is_delivered: bool
    created_at: str


class FileUploadRequest(BaseModel):
    file_name: str
    encrypted_key: str
    mime_type: str = "application/octet-stream"


class UserResponse(BaseModel):
    id: str
    username: str
    display_name: str
    identity_key: Optional[str] = None
    last_online: Optional[str] = None
    created_at: str



