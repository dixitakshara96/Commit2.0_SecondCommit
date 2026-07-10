from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.analysis.agents.contributor_agent import contributor_agent
from app.analysis.crud import analysis_crud
from app.analysis.schemas import (
    ContributorRecommendRequest,
    ContributorRecommendResponse,
    ContributorMatchRead,
)
from app.core.dependencies import CurrentUser
from app.core.types import DBSession
from app.crud.idea import idea_crud
from app.db.models.github_repository_snapshot import GitHubRepositorySnapshot
from app.repositories.crud import repository_crud

router = APIRouter(
    prefix="/contributors",
    tags=["Contributors"],
)


@router.post(
    "/recommend",
    response_model=ContributorRecommendResponse,
    status_code=status.HTTP_201_CREATED,
)
async def recommend_contributors(
    payload: ContributorRecommendRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Find and recommend contributors for a given analysis.

    This is a standalone endpoint that re-runs the contributor
    recommendation logic for an existing analysis. It:
      1. Fetches the analysis and its required roles/skills
      2. Searches GitHub for matching contributors
      3. Filters by recent activity and ranks them
      4. Saves/replaces the contributor recommendations
      5. Returns the ranked list

    Requires the analysis to be owned by the current user.
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

    # 2. Extract required roles, languages, and topics
    required_roles = [r for r in analysis.required_roles]
    role_dicts = [
        {"role": r.role, "priority": r.priority, "reason": r.reason}
        for r in required_roles
    ]

    # Fetch languages and topics from the snapshot data
    languages: list[str] = []
    topics: list[str] = []

    if repo:
        stmt = select(GitHubRepositorySnapshot).where(
            GitHubRepositorySnapshot.repository_id == repo.id
        )
        snapshot = db.execute(stmt).scalar_one_or_none()
        if snapshot:
            languages = snapshot.languages or []
            topics = snapshot.topics or []

    # Fallback: use repo's primary language
    if not languages and repo and repo.language:
        languages = [repo.language]

    # 3. Run the contributor agent
    contributor_result = await contributor_agent.run(
        required_roles=role_dicts,
        languages=languages,
        topics=topics,
    )

    # 4. Delete old contributor matches for this analysis and save new ones
    old_matches = analysis.contributor_matches
    for match in old_matches:
        db.delete(match)
    db.commit()

    if contributor_result:
        analysis_crud.bulk_create_contributors(
            db=db,
            analysis_id=analysis.id,
            contributors=contributor_result,
        )

    # 5. Fetch fresh contributor matches and return them
    db.refresh(analysis)
    contributors = [
        ContributorMatchRead.model_validate(m)
        for m in analysis.contributor_matches
    ]

    return ContributorRecommendResponse(
        recommendation_id=analysis.id,
        contributors=contributors,
    )
