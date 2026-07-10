from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.exceptions import (
    credentials_exception,
    forbidden_exception,
)
from app.core.oauth2 import oauth2_scheme
from app.core.security import decode_token
from app.core.types import DBSession
from app.crud.user import user_crud
from app.db.enums import UserRole
from app.db.models.user import User


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: DBSession,
) -> User:

    payload = decode_token(token)

    if payload.get("type") != "access":
        raise credentials_exception

    subject = payload.get("sub")

    if subject is None:
        raise credentials_exception

    try:
        user_id = int(subject)

    except ValueError:
        raise credentials_exception

    user = user_crud.get_by_id(
        db=db,
        user_id=user_id,
    )

    if user is None:
        raise credentials_exception

    token_version = payload.get("ver")

    if token_version != user.token_version:
        raise credentials_exception

    return user


CurrentUser = Annotated[
    User,
    Depends(get_current_user),
]


def get_current_verified_user(
    current_user: CurrentUser,
) -> User:

    if not current_user.is_verified:
        raise forbidden_exception

    return current_user


VerifiedUser = Annotated[
    User,
    Depends(get_current_verified_user),
]


def require_roles(
    *roles: UserRole,
):
    allowed_roles = set(roles)

    def dependency(
        current_user: VerifiedUser,
    ) -> User:

        if current_user.role not in allowed_roles:
            raise forbidden_exception

        return current_user

    return Depends(dependency)