from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.enums import UserRole
from app.db.models.user import User


class UserCRUD:

    @staticmethod
    def get_by_id(
        db: Session,
        user_id: int,
    ) -> User | None:
        return db.get(User, user_id)

    @staticmethod
    def get_by_email(
        db: Session,
        email: str,
    ) -> User | None:
        stmt = select(User).where(User.email == email)
        return db.scalar(stmt)

    @staticmethod
    def get_by_github_username(
        db: Session,
        github_username: str,
    ) -> User | None:
        stmt = select(User).where(
            User.github_username == github_username
        )
        return db.scalar(stmt)

    @staticmethod
    def create(
        db: Session,
        *,
        name: str,
        email: str,
        password_hash: str,
        role: UserRole,
        github_username: str | None = None,
    ) -> User:

        user = User(
            name=name,
            email=email,
            password_hash=password_hash,
            role=role,
            github_username=github_username,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    @staticmethod
    def update_profile(
        db: Session,
        *,
        user: User,
        name: str | None = None,
        github_username: str | None = None,
    ) -> User:

        if name is not None:
            user.name = name

        if github_username is not None:
            user.github_username = github_username

        db.commit()
        db.refresh(user)

        return user

    @staticmethod
    def verify_email(
        db: Session,
        *,
        user: User,
    ) -> User:

        user.is_verified = True

        db.commit()
        db.refresh(user)

        return user

    @staticmethod
    def update_password(
        db: Session,
        *,
        user: User,
        password_hash: str,
    ) -> User:

        user.password_hash = password_hash

        db.commit()
        db.refresh(user)

        return user

    @staticmethod
    def delete(
        db: Session,
        *,
        user: User,
    ) -> None:

        db.delete(user)
        db.commit()


user_crud = UserCRUD()