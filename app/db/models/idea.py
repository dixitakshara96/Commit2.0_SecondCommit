from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.enums import IdeaStatus


class Idea(Base):
    __tablename__ = "ideas"

    id: Mapped[int] = mapped_column(primary_key=True)

    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )

    original_prompt: Mapped[str] = mapped_column(Text)

    voice_transcript: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    refined_prompt: Mapped[str | None] = mapped_column(Text)

    status: Mapped[IdeaStatus] = mapped_column(
        Enum(IdeaStatus),
        default=IdeaStatus.DRAFT,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    owner = relationship(
        "User",
        back_populates="ideas",
    )

    repositories = relationship(
        "Repository",
        back_populates="idea",
        cascade="all, delete-orphan",
    )