from fastapi import APIRouter, HTTPException, status

from app.analysis.crud import analysis_crud
from app.core.dependencies import CurrentUser
from app.core.types import DBSession
from app.crud.idea import idea_crud
from app.crud.response_tracker import response_tracker_crud
from app.repositories.crud import repository_crud
from app.schemas.response_tracker import (
    ResponseTrackerCreate,
    ResponseTrackerRead,
    ResponseTrackerSummary,
    ResponseTrackerUpdate,
)

router = APIRouter(
    prefix="/responses",
    tags=["Response Tracking"],
)


def _verify_analysis_ownership(
    db: DBSession,
    analysis_id: int,
    current_user: CurrentUser,
) -> None:
    """Verify the current user owns the analysis (via analysis -> repository -> idea -> user)."""
    analysis = analysis_crud.get_analysis(db=db, analysis_id=analysis_id)
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


@router.post(
    "",
    response_model=ResponseTrackerRead,
    status_code=status.HTTP_201_CREATED,
)
def create_response_entry(
    payload: ResponseTrackerCreate,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Create a new pending response tracking entry.

    Intended to be called after outreach is generated to wire
    the tracking record for each sent message.
    """
    _verify_analysis_ownership(
        db=db, analysis_id=payload.analysis_id, current_user=current_user,
    )

    entry = response_tracker_crud.create(
        db=db,
        analysis_id=payload.analysis_id,
        contributor_match_id=payload.contributor_match_id,
        outreach_message_id=payload.outreach_message_id,
        notes=payload.notes,
    )
    return entry


@router.patch(
    "/{entry_id}",
    response_model=ResponseTrackerRead,
)
def update_response_status(
    entry_id: int,
    payload: ResponseTrackerUpdate,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Update a tracking entry's status to 'accepted' or 'declined'.

    This is the main lifecycle transition endpoint that startups
    call when a freelancer responds to an outreach message.
    """
    valid_statuses = {"accepted", "declined"}
    if payload.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Status must be one of: {', '.join(valid_statuses)}.",
        )

    entry = response_tracker_crud.get_by_id(db=db, entry_id=entry_id)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Response tracking entry not found.",
        )

    _verify_analysis_ownership(
        db=db, analysis_id=entry.analysis_id, current_user=current_user,
    )

    updated = response_tracker_crud.update_status(
        db=db,
        entry_id=entry_id,
        new_status=payload.status,
        notes=payload.notes,
    )
    return updated


@router.get(
    "/{entry_id}",
    response_model=ResponseTrackerRead,
)
def get_response_entry(
    entry_id: int,
    db: DBSession,
    current_user: CurrentUser,
):
    """Get a single response tracking entry by ID."""
    entry = response_tracker_crud.get_by_id(db=db, entry_id=entry_id)

    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Response tracking entry not found.",
        )

    _verify_analysis_ownership(
        db=db, analysis_id=entry.analysis_id, current_user=current_user,
    )

    return entry


@router.get(
    "/by-analysis/{analysis_id}",
    response_model=list[ResponseTrackerRead],
)
def list_responses_by_analysis(
    analysis_id: int,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    List all response tracking entries for a given analysis.
    """
    _verify_analysis_ownership(
        db=db, analysis_id=analysis_id, current_user=current_user,
    )

    return response_tracker_crud.get_by_analysis(
        db=db,
        analysis_id=analysis_id,
    )


@router.get(
    "/summary/{analysis_id}",
    response_model=ResponseTrackerSummary,
)
def get_response_summary(
    analysis_id: int,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Get aggregated response stats (total, pending, accepted, declined,
    response rate, acceptance rate) for a given analysis.
    """
    _verify_analysis_ownership(
        db=db, analysis_id=analysis_id, current_user=current_user,
    )

    summary = response_tracker_crud.get_summary(
        db=db,
        analysis_id=analysis_id,
    )
    return ResponseTrackerSummary(**summary)
