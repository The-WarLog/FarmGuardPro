import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status

from JWT.config import JWT_ACCESS_TOKEN_EXPIRE_MINUTES, JWT_SECRET_KEY


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("utf-8")


def _b64url_decode(raw: str) -> bytes:
    padding = "=" * (-len(raw) % 4)
    return base64.urlsafe_b64decode((raw + padding).encode("utf-8"))


def create_access_token(subject: str, expires_delta: timedelta | None = None, extra_claims: dict[str, Any] | None = None) -> str:
    now = datetime.now(timezone.utc)
    exp = now + (expires_delta or timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES))

    payload: dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)

    header = {"alg": "HS256", "typ": "JWT"}

    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(JWT_SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    
    signature_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_access_token(token: str) -> dict[str, Any]:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
    except ValueError as exc:
        raise credentials_error from exc

    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    expected_sig = hmac.new(JWT_SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()

    try:
        provided_sig = _b64url_decode(signature_b64)
    except Exception as exc:
        raise credentials_error from exc

    if not hmac.compare_digest(expected_sig, provided_sig):
        raise credentials_error

    try:
        payload_bytes = _b64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception as exc:
        raise credentials_error from exc

    exp = payload.get("exp")
    if not isinstance(exp, int):
        raise credentials_error

    if datetime.now(timezone.utc).timestamp() > exp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload
