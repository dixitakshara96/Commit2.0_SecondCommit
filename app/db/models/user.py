from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))

    role: Mapped[UserRole] = mapped_column(Enum(UserRole))

    github_username: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )
    token_version: Mapped[int] = mapped_column(
    Integer,
    default=1,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    freelancer_profile = relationship(
        "FreelancerProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    ideas = relationship(
        "Idea",
        back_populates="owner",
        cascade="all, delete-orphan",
    )