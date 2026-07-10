from fastapi import APIRouter, HTTPException, status

from app.analysis.crud import analysis_crud
from app.analysis.orchestrator import analysis_orchestrator
from app.analysis.schemas import (
    AnalysisRead,
    AnalysisRunRequest,
    AnalysisRunResponse,
)
from app.core.dependencies import CurrentUser
from app.core.types import DBSession
from app.crud.idea import idea_crud
from app.db.enums import IdeaStatus
from app.repositories.crud import repository_crud

router = APIRouter(
    prefix="/analysis",
    tags=["Analysis"],
)


@router.post(
    "/run",
    response_model=AnalysisRunResponse,
    status_code=status.HTTP_201_CREATED,
)
async def run_analysis(
    payload: AnalysisRunRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Run the full multi-agent analysis pipeline on a selected repository.

    This endpoint does NOT contain analysis logic itself. It delegates to the
    Workflow Orchestrator which internally runs:
        1. GitHub Snapshot Agent → fetches all data once → Snapshot DB
        2. Documentation Agent → LLM evaluation
        3. Code Health Agent → rule-based calculations
        4. Trend Agent → GitHub signals + LLM explanation
        5. AI Capability Agent → LLM estimates
        6. Skill Gap Agent → LLM skill extraction
        7. Contributor Recommendation Agent → GitHub Search Users + ranking
        8. Report Generator → composes RepositoryAnalysis + Findings + Roles + Matches

    Returns analysis_id. Frontend calls GET /analysis/{id} to render the report.
    """
    # 1. Fetch the repository
    repo = repository_crud.get(db=db, repository_id=payload.repository_id)

    if repo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found.",
        )

    if not repo.is_selected:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Repository must be selected first via POST /repositories/select.",
        )

    # 2. Verify ownership through the idea
    idea = idea_crud.get(db=db, idea_id=repo.idea_id)
    if idea is None or idea.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found.",
        )

    # 3. Run the orchestrator
    analysis_id = await analysis_orchestrator.run(
        db=db,
        repository=repo,
    )

    # 4. Update idea status to ANALYZED
    idea_crud.set_status(db=db, idea=idea, status=IdeaStatus.ANALYZED)

    return AnalysisRunResponse(analysis_id=analysis_id)


@router.get(
    "/{analysis_id}",
    response_model=AnalysisRead,
)
def get_analysis(
    analysis_id: int,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Get a full analysis report by ID, including all findings,
    required roles, and contributor matches.
    """
    analysis = analysis_crud.get_analysis(db=db, analysis_id=analysis_id)

    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found.",
        )

    # Verify ownership through the repository → idea chain
    repo = repository_crud.get(db=db, repository_id=analysis.repository_id)
    if repo:
        idea = idea_crud.get(db=db, idea_id=repo.idea_id)
        if idea is None or idea.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Analysis not found.",
            )

    return analysis
