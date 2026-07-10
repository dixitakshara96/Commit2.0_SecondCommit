from sqlalchemy import Float, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ContributorMatch(Base):
    __tablename__ = "contributor_matches"

    id: Mapped[int] = mapped_column(primary_key=True)

    analysis_id: Mapped[int] = mapped_column(
        ForeignKey("repository_analysis.id", ondelete="CASCADE")
    )

    github_username: Mapped[str] = mapped_column(String(100))

    github_profile: Mapped[str] = mapped_column(String(255))

    avatar_url: Mapped[str | None] = mapped_column(String(500))

    match_score: Mapped[float] = mapped_column(Float)

    recent_activity_score: Mapped[float] = mapped_column(Float)

    matched_skills: Mapped[list] = mapped_column(JSON)

    recent_repositories: Mapped[list] = mapped_column(JSON)

    recommendation_reason: Mapped[str] = mapped_column(String(500))

    analysis = relationship(
        "RepositoryAnalysis",
        back_populates="contributor_matches",
    )

    response_tracker_entries = relationship(
        "ResponseTracker",
        back_populates="contributor_match",
        cascade="save-update, merge",
    )