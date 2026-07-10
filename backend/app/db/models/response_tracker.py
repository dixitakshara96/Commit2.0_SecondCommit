from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.enums import ResponseStatus


class ResponseTracker(Base):
    """
    Unified lifecycle tracker for outreach responses.

    Captures the full state machine between:
      - Startup (via analysis -> repository -> idea -> user)
      - Freelancer (via contributor_match -> github_username)
      - Project (via analysis -> repository)

    States: pending -> accepted | declined
    """

    __tablename__ = "response_tracker"

    id: Mapped[int] = mapped_column(primary_key=True)

    analysis_id: Mapped[int] = mapped_column(
        ForeignKey("repository_analysis.id", ondelete="CASCADE"),
        index=True,
    )

    contributor_match_id: Mapped[int | None] = mapped_column(
        ForeignKey("contributor_matches.id", ondelete="SET NULL"),
        nullable=True,
    )

    outreach_message_id: Mapped[int | None] = mapped_column(
        ForeignKey("outreach_messages.id", ondelete="SET NULL"),
        nullable=True,
    )

    status: Mapped[ResponseStatus] = mapped_column(
        Enum(ResponseStatus),
        default=ResponseStatus.PENDING,
        index=True,
    )

    responded_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
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

    # ── Relationships ──

    analysis = relationship(
        "RepositoryAnalysis",
        back_populates="response_tracker_entries",
    )

    contributor_match = relationship(
        "ContributorMatch",
        back_populates="response_tracker_entries",
    )

    outreach_message = relationship(
        "OutreachMessage",
        back_populates="response_tracker_entries",
    )
