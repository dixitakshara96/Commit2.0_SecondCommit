from sqlalchemy.orm import Session

from app.crud.idea import idea_crud
from app.db.models.idea import Idea
from app.db.models.user import User
from app.llm.ollama import OllamaProvider


class IdeaService:

    @staticmethod
    def create(
        db: Session,
        *,
        owner: User,
        original_prompt: str,
        voice_transcript: str | None,
    ) -> Idea:

        return idea_crud.create(
            db=db,
            owner=owner,
            original_prompt=original_prompt,
            voice_transcript=voice_transcript,
        )

    @staticmethod
    async def refine(
        db: Session,
        *,
        idea: Idea,
    ) -> Idea:
        """
        Refine the idea using Ollama LLM.
        Constructs a prompt from the original_prompt (and voice_transcript if present)
        and asks the LLM to produce a clearer, more refined version.
        """
        llm = OllamaProvider()

        try:
            # Build the input prompt for the LLM
            idea_content = f"Original idea:\n{idea.original_prompt}"

            if idea.voice_transcript:
                idea_content += f"\n\nVoice transcript (additional context):\n{idea.voice_transcript}"

            system_prompt = (
                "You are an expert startup advisor who helps refine and clarify business ideas. "
                "Given a raw idea, your job is to:"
                "\n1. Rewrite it in clear, professional language"
                "\n2. Improve its structure and clarity"
                "\n3. Preserve the original intent — do NOT change the core concept"
                "\n\n"
                "Output only the refined version of the idea. Do not add any introductory or closing remarks."
            )

            refined = await llm.generate(
                prompt=idea_content,
                system_prompt=system_prompt,
                temperature=0.3,
            )

        finally:
            await llm.close()

        return idea_crud.update_refinement(
            db=db,
            idea=idea,
            refined_prompt=refined,
        )

    @staticmethod
    async def refine_and_mark_refined(
        db: Session,
        *,
        idea: Idea,
    ) -> Idea:
        """
        Refine the idea and set status to REFINED.
        Used by POST /ideas/{id}/refine.
        """
        idea = await IdeaService.refine(
            db=db,
            idea=idea,
        )

        return idea_crud.mark_refined(
            db=db,
            idea=idea,
        )

    @staticmethod
    def approve(
        db: Session,
        *,
        idea: Idea,
    ) -> Idea:

        return idea_crud.approve(
            db=db,
            idea=idea,
        )

    @staticmethod
    def update(
        db: Session,
        *,
        idea: Idea,
        original_prompt: str | None = None,
        voice_transcript: str | None = None,
    ) -> Idea:

        return idea_crud.update(
            db=db,
            idea=idea,
            original_prompt=original_prompt,
            voice_transcript=voice_transcript,
        )

    @staticmethod
    def delete(
        db: Session,
        *,
        idea: Idea,
    ) -> None:

        idea_crud.delete(
            db=db,
            idea=idea,
        )


idea_service = IdeaService()