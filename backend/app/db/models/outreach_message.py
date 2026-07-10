from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.enums import OutreachType


class OutreachMessage(Base):
    __tablename__ = "outreach_messages"

    id: Mapped[int] = mapped_column(primary_key=True)

    analysis_id: Mapped[int] = mapped_column(
        ForeignKey("repository_analysis.id", ondelete="CASCADE")
    )

    recipient: Mapped[str]

    type: Mapped[OutreachType]

    generated_message: Mapped[str] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    analysis = relationship(
        "RepositoryAnalysis",
        back_populates="outreach_messages",
    )

    response_tracker_entries = relationship(
        "ResponseTracker",
        back_populates="outreach_message",
        cascade="save-update, merge",
    )