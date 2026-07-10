from fastapi import APIRouter, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.auth.service import AuthService, auth_service
from app.core.dependencies import CurrentUser
from app.core.types import DBSession
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    TokenPair,
)
from app.schemas.user import UserCreate, UserRead

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: UserCreate,
    db: DBSession,
):

    user = auth_service.register(
        db=db,
        name=payload.name,
        email=payload.email,
        password=payload.password,
        role=payload.role,
        github_username=payload.github_username,
    )

    return user


@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(
    payload: LoginRequest,
    db: DBSession,
):

    user, access_token, refresh_token = auth_service.login(
        db=db,
        email=payload.email,
        password=payload.password,
    )

    return LoginResponse(
        user=user,
        tokens=TokenPair(
            access_token=access_token,
            refresh_token=refresh_token,
        ),
    )


@router.get(
    "/me",
    response_model=UserRead,
)
def me(
    current_user: CurrentUser,
):
    return current_user


@router.post(
    "/verify-email",
    response_model=UserRead,
)
def verify_email(
    current_user: CurrentUser,
    db: DBSession,
):
    """
    Verify the current user's email address.

    Marks the user's is_verified flag as True in the database.
    In a production system this would be gated by an email confirmation
    link containing a signed token; for this implementation the user
    simply calls this endpoint to self-verify.
    """
    if current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified.",
        )

    user = auth_service.verify_email(db=db, user=current_user)
    return user


@router.post(
    "/refresh",
    response_model=TokenPair,
)
def refresh(
    payload: RefreshRequest,
    db: DBSession,
):
    access, refresh = AuthService.refresh(
        db=db,
        refresh_token=payload.refresh_token,
    )

    return TokenPair(
        access_token=access,
        refresh_token=refresh,
    )

@router.post("/logout")
def logout(
    current_user: CurrentUser,
    db: DBSession,
):

    auth_service.logout(
        db=db,
        user=current_user,
    )

    return {
        "message": "Logged out successfully."
    }