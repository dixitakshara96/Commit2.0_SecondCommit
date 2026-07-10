from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.enums import IdeaStatus
from app.db.models.idea import Idea
from app.db.models.user import User


class IdeaCRUD:

    @staticmethod
    def create(
        db: Session,
        *,
        owner: User,
        original_prompt: str,
        voice_transcript: str | None,
    ) -> Idea:

        idea = Idea(
            owner_id=owner.id,
            original_prompt=original_prompt,
            voice_transcript=voice_transcript,
            status=IdeaStatus.DRAFT,
        )

        db.add(idea)
        db.commit()
        db.refresh(idea)

        return idea

    @staticmethod
    def get(
        db: Session,
        *,
        idea_id: int,
    ) -> Idea | None:

        return db.get(Idea, idea_id)

    @staticmethod
    def get_by_owner(
        db: Session,
        *,
        owner: User,
    ) -> list[Idea]:

        stmt = (
            select(Idea)
            .where(Idea.owner_id == owner.id)
            .order_by(Idea.created_at.desc())
        )

        return list(db.execute(stmt).scalars().all())

    @staticmethod
    def update_refinement(
        db: Session,
        *,
        idea: Idea,
        refined_prompt: str,
    ) -> Idea:

        idea.refined_prompt = refined_prompt

        db.commit()
        db.refresh(idea)

        return idea

    @staticmethod
    def set_status(
        db: Session,
        *,
        idea: Idea,
        status: IdeaStatus,
    ) -> Idea:

        idea.status = status

        db.commit()
        db.refresh(idea)

        return idea

    @staticmethod
    def approve(
        db: Session,
        *,
        idea: Idea,
    ) -> Idea:

        return IdeaCRUD.set_status(
            db=db,
            idea=idea,
            status=IdeaStatus.APPROVED,
        )

    @staticmethod
    def mark_refined(
        db: Session,
        *,
        idea: Idea,
    ) -> Idea:

        return IdeaCRUD.set_status(
            db=db,
            idea=idea,
            status=IdeaStatus.REFINED,
        )

    @staticmethod
    def update(
        db: Session,
        *,
        idea: Idea,
        original_prompt: str | None = None,
        voice_transcript: str | None = None,
    ) -> Idea:
        """
        Update the idea's content fields.
        If content changes, reset refined_prompt and status to DRAFT
        since the old refinement is now stale.
        """
        changed = False

        if original_prompt is not None:
            idea.original_prompt = original_prompt
            changed = True

        if voice_transcript is not None:
            idea.voice_transcript = voice_transcript
            changed = True

        if changed:
            idea.refined_prompt = None
            idea.status = IdeaStatus.DRAFT

        db.commit()
        db.refresh(idea)

        return idea

    @staticmethod
    def delete(
        db: Session,
        *,
        idea: Idea,
    ) -> None:

        db.delete(idea)
        db.commit()


idea_crud = IdeaCRUD()