from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Repository(Base):
    __tablename__ = "repositories"

    id: Mapped[int] = mapped_column(primary_key=True)

    idea_id: Mapped[int] = mapped_column(
        ForeignKey("ideas.id", ondelete="CASCADE")
    )

    github_repo_id: Mapped[int] = mapped_column(index=True)

    owner: Mapped[str] = mapped_column(String(100))

    repo_name: Mapped[str] = mapped_column(String(150))

    url: Mapped[str] = mapped_column(String(300))

    description: Mapped[str | None] = mapped_column(Text)

    stars: Mapped[int] = mapped_column(Integer)

    forks: Mapped[int] = mapped_column(Integer)

    language: Mapped[str | None] = mapped_column(String(50))

    license: Mapped[str | None] = mapped_column(String(80))

    last_commit: Mapped[datetime | None]

    is_selected: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    idea = relationship(
        "Idea",
        back_populates="repositories",
    )

    analysis = relationship(
        "RepositoryAnalysis",
        back_populates="repository",
        uselist=False,
        cascade="all, delete-orphan",
    )

    snapshot = relationship(
    "GitHubRepositorySnapshot",
    back_populates="repository",
    uselist=False,
    cascade="all, delete-orphan",
)