from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from jwt import InvalidTokenError
from pwdlib import PasswordHash

from app.core.config import settings


password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def _create_token(
    subject: str,
    expires_delta: timedelta,
    token_type: str,
    additional_claims: dict[str, Any] | None = None,
) -> str:
    """
    Generates a secure JWT token with optional additional claims.
    """
    now = datetime.now(timezone.utc)

    payload: dict[str, Any] = {}
    if additional_claims:
        payload.update(additional_claims)

    payload.update({
        "sub": str(subject),
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    })

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )



def create_access_token(
    subject: str,
    role: str,
    token_version: int,
) -> str:
    return _create_token(
        subject=subject,
        token_type="access",
        expires_delta=timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        ),
        additional_claims={
    "role": role,
    "ver": token_version,
}
    )


def create_refresh_token(
    subject: str,
    token_version: int,
) -> str:
    return _create_token(
        subject=subject,
        token_type="refresh",
        expires_delta=timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        ),
    )


def decode_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        return payload

    except InvalidTokenError as exc:
        raise ValueError("Invalid or expired token.") from exc