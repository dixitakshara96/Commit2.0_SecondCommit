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
                "You are an expert software architect and startup technical advisor. "
                "Given a raw idea description, produce a comprehensive Software Requirements Summary (SRS).\n\n"
                "Structure the output as follows:\n\n"
                "## Summary\n"
                "A one-paragraph professional rewrite that improves wording, removes ambiguity, and clarifies the core value proposition.\n\n"
                "## Technical Architecture\n"
                "Infer the most likely architecture (monolith, microservices, serverless, etc.), key components, data flow, and integration points. Only include what logically follows from the user's intent.\n\n"
                "## Key Features\n"
                "List the essential features implied by the description. Be specific but do not hallucinate.\n\n"
                "## Technology Stack\n"
                "Suggest an appropriate tech stack (languages, frameworks, databases, infrastructure) that aligns with the described use case.\n\n"
                "## Scalability Considerations\n"
                "Identify potential bottlenecks and how the system could scale. Include caching, database sharding, CDN, horizontal scaling, etc., where applicable.\n\n"
                "## Security Considerations\n"
                "Note relevant security concerns: authentication, authorization, data encryption, rate limiting, input validation, etc.\n\n"
                "## Deployment Considerations\n"
                "Suggest deployment strategy: CI/CD pipeline, containerization, cloud provider considerations, environment configuration, monitoring.\n\n"
                "## AI Opportunities\n"
                "Identify where AI/ML could enhance the product (e.g., recommendation engine, NLP, anomaly detection, predictive analytics). Only suggest what is realistic for the described idea.\n\n"
                "Preserve the original intent — do NOT change the core concept. Do not add introductory or closing remarks. Output only the refined version."
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