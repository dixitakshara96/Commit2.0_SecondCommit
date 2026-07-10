from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.crud.user import user_crud

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.enums import UserRole
from app.db.models.user import User


class AuthService:

    @staticmethod
    def register(
        db: Session,
        *,
        name: str,
        email: str,
        password: str,
        role: UserRole,
        github_username: str | None = None,
    ) -> User:

        existing_user = user_crud.get_by_email(
            db,
            email,
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered.",
            )

        if github_username:

            existing = user_crud.get_by_github_username(
                db,
                github_username,
            )

            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="GitHub username already exists.",
                )

        return user_crud.create(
            db=db,
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=role,
            github_username=github_username,
        )

    @staticmethod
    def login(
        db: Session,
        *,
        email: str,
        password: str,
    ) -> tuple[User, str, str]:

        user = user_crud.get_by_email(
            db,
            email,
        )

        if (
            user is None
            or not verify_password(
                password,
                user.password_hash,
            )
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        access_token = create_access_token(
            subject=str(user.id),
            role=user.role.value,
            token_version=user.token_version,
        )

        refresh_token = create_refresh_token(
            subject=str(user.id),
            token_version=user.token_version,
        )

        return (
            user,
            access_token,
            refresh_token,
        )
    @staticmethod
    def logout(
        db: Session,
        *,
        user: User,
    ) -> None:

        user.token_version += 1

        db.commit()



    @staticmethod
    def verify_email(
        db: Session,
        *,
        user: User,
    ) -> User:
        """
        Mark a user's email as verified.
        """
        return user_crud.verify_email(db=db, user=user)

    @staticmethod
    def refresh(
        db: Session,
        *,
        refresh_token: str,
    ) -> tuple[str, str]:
        """
        Validates refresh token and returns new token pair.
        """
        payload = decode_token(refresh_token)

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        user_id = payload.get("sub")
        token_version = payload.get("ver")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        user = user_crud.get_by_id(db=db, user_id=int(user_id))

        if user is None or user.token_version != token_version:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        # Rotate token_version to invalidate any previously issued refresh tokens
        user.token_version += 1
        db.commit()

        access = create_access_token(
            subject=str(user.id),
            role=str(user.role.value),
            token_version=int(user.token_version),
        )

        refresh = create_refresh_token(
            subject=str(user.id),
            token_version=int(user.token_version),
        )

        return access, refresh


auth_service = AuthService()
