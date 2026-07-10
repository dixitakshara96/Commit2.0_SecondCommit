from fastapi import APIRouter, HTTPException, status

from app.analysis.agents.outreach_agent import outreach_agent
from app.analysis.crud import analysis_crud
from app.analysis.schemas import (
    OutreachGenerateRequest,
    OutreachGenerateResponse,
    OutreachMessageRead,
)
from app.core.dependencies import CurrentUser
from app.core.types import DBSession
from app.crud.idea import idea_crud
from app.repositories.crud import repository_crud

router = APIRouter(
    prefix="/outreach",
    tags=["Outreach"],
)


@router.post(
    "/generate",
    response_model=OutreachGenerateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def generate_outreach(
    payload: OutreachGenerateRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Generate personalized outreach messages for selected contributors.

    Takes an analysis_id and a list of contributor_match IDs, then:
      1. Verifies ownership of the analysis
      2. Fetches the selected contributor records
      3. Uses LLM to generate a personalized message for each contributor
      4. Saves messages to the database
      5. Returns the generated messages

    The messages are tailored to each contributor's skills, recent work,
    and the project being revived.
    """
    # 1. Fetch the analysis and verify ownership
    analysis = analysis_crud.get_analysis(db=db, analysis_id=payload.analysis_id)

    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found.",
        )

    repo = repository_crud.get(db=db, repository_id=analysis.repository_id)
    if repo:
        idea = idea_crud.get(db=db, idea_id=repo.idea_id)
        if idea is None or idea.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found.",
            )

    # 2. Fetch the selected contributor records
    contributors = analysis_crud.get_contributors_by_ids(
        db=db,
        analysis_id=analysis.id,
        contributor_ids=payload.contributor_ids,
    )

    if not contributors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid contributor matches found for the given IDs.",
        )

    # 3. Build contributor data for the outreach agent
    contributor_data = []
    for c in contributors:
        contributor_data.append({
            "github_username": c.github_username,
            "match_score": c.match_score,
            "matched_skills": c.matched_skills,
            "recent_repositories": c.recent_repositories,
            "recommendation_reason": c.recommendation_reason,
        })

    # Build project info from the repository
    project_name = f"{repo.owner}/{repo.repo_name}" if repo else "Unknown"
    project_description = repo.description if repo else ""
    metadata = analysis.analysis_metadata or {}

    # Extract languages from metadata or fallback to repo language
    project_languages = []
    if repo and repo.language:
        project_languages = [repo.language]

    # Extract topics from metadata or snapshot data
    project_topics = []
    if metadata:
        skill_summary = metadata.get("skill_summary", "")
        if skill_summary:
            project_topics = [t.strip() for t in skill_summary.split(",") if t.strip()]

    # 4. Generate outreach messages via LLM
    messages = await outreach_agent.run(
        project_name=project_name,
        project_description=project_description or "",
        project_languages=project_languages,
        project_topics=project_topics,
        contributors=contributor_data,
    )

    # 5. Save to database and return the created messages
    if messages:
        created = analysis_crud.bulk_create_outreach_messages(
            db=db,
            analysis_id=analysis.id,
            messages=messages,
        )
    else:
        created = []

    return OutreachGenerateResponse(
        analysis_id=analysis.id,
        messages=[
            OutreachMessageRead.model_validate(m)
            for m in created
        ],
    )
