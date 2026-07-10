from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.enums import FindingType, Severity


class AnalysisFinding(Base):
    __tablename__ = "analysis_findings"

    id: Mapped[int] = mapped_column(primary_key=True)

    analysis_id: Mapped[int] = mapped_column(
        ForeignKey("repository_analysis.id", ondelete="CASCADE"),
        index=True,
    )

    type: Mapped[FindingType] = mapped_column(
        Enum(FindingType)
    )

    severity: Mapped[Severity] = mapped_column(
        Enum(Severity)
    )

    title: Mapped[str] = mapped_column(
        String(255)
    )

    description: Mapped[str] = mapped_column(
        Text
    )

    recommendation: Mapped[str] = mapped_column(
        Text
    )

    analysis = relationship(
        "RepositoryAnalysis",
        back_populates="findings",
    )