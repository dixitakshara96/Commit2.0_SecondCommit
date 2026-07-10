from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class GitHubRepositorySnapshot(Base):
    __tablename__ = "github_repository_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True)

    repository_id: Mapped[int] = mapped_column(
        ForeignKey("repositories.id", ondelete="CASCADE"),
        unique=True,
    )

    # ---------- Frequently queried metadata ----------

    default_branch: Mapped[str] = mapped_column(String(100))

    latest_commit_sha: Mapped[str] = mapped_column(String(64))

    latest_commit_date: Mapped[datetime] = mapped_column(DateTime)

    stars: Mapped[int]

    forks: Mapped[int]

    open_issues: Mapped[int]

    watchers: Mapped[int]

    contributors_count: Mapped[int]

    commits_count: Mapped[int]

    pull_requests_count: Mapped[int]

    releases_count: Mapped[int]

    languages: Mapped[list] = mapped_column(JSON)

    topics: Mapped[list] = mapped_column(JSON)

    # ---------- Immutable raw GitHub snapshot ----------

    raw_snapshot: Mapped[dict] = mapped_column(JSON)

    # ---------- Cache metadata ----------

    snapshot_version: Mapped[str] = mapped_column(
        String(64)
    )

    etag: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    fetched_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    repository = relationship(
        "Repository",
        back_populates="snapshot",
    )