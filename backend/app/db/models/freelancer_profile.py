from sqlalchemy import ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class FreelancerProfile(Base):
    __tablename__ = "freelancer_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
    )

    bio: Mapped[str | None] = mapped_column(String(600))

    experience_level: Mapped[str | None] = mapped_column(String(60))

    portfolio: Mapped[str | None] = mapped_column(String(255))

    linkedin: Mapped[str | None] = mapped_column(String(255))

    resume: Mapped[str | None] = mapped_column(String(255))

    priority_score: Mapped[float] = mapped_column(default=0.0)

    skills: Mapped[list] = mapped_column(JSON)

    tech_stack: Mapped[list] = mapped_column(JSON)

    user = relationship(
        "User",
        back_populates="freelancer_profile",
    )