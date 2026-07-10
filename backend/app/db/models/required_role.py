from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RequiredRole(Base):
    __tablename__ = "required_roles"

    id: Mapped[int] = mapped_column(primary_key=True)

    analysis_id: Mapped[int] = mapped_column(
        ForeignKey("repository_analysis.id", ondelete="CASCADE")
    )

    role: Mapped[str] = mapped_column(String(100))

    priority: Mapped[int] = mapped_column(Integer)

    reason: Mapped[str] = mapped_column(String(500))

    analysis = relationship(
        "RepositoryAnalysis",
        back_populates="required_roles",
    )