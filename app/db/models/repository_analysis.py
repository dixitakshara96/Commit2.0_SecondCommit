from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RepositoryAnalysis(Base):
    __tablename__ = "repository_analysis"

    id: Mapped[int] = mapped_column(primary_key=True)

    repository_id: Mapped[int] = mapped_column(
        ForeignKey("repositories.id", ondelete="CASCADE"),
        unique=True,
    )

    executive_summary: Mapped[str] = mapped_column(Text)

    revival_score: Mapped[int] = mapped_column(Integer)

    project_health_score: Mapped[int] = mapped_column(Integer)

    documentation_score: Mapped[int] = mapped_column(Integer)

    technical_debt_score: Mapped[int] = mapped_column(Integer)

    trend_score: Mapped[int] = mapped_column(Integer)

    safe_to_revive: Mapped[bool]

    ai_effort_percentage: Mapped[float] = mapped_column(Float)

    human_effort_percentage: Mapped[float] = mapped_column(Float)

    analysis_metadata: Mapped[dict] = mapped_column(JSON)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    repository = relationship(
        "Repository",
        back_populates="analysis",
    )

    required_roles = relationship(
        "RequiredRole",
        back_populates="analysis",
        cascade="all, delete-orphan",
    )

    contributor_matches = relationship(
        "ContributorMatch",
        back_populates="analysis",
        cascade="all, delete-orphan",
    )

    outreach_messages = relationship(
        "OutreachMessage",
        back_populates="analysis",
        cascade="all, delete-orphan",
    )
    findings = relationship(
        "AnalysisFinding",
        back_populates="analysis",
        cascade="all, delete-orphan",
    )

    response_tracker_entries = relationship(
        "ResponseTracker",
        back_populates="analysis",
        cascade="all, delete-orphan",
    )