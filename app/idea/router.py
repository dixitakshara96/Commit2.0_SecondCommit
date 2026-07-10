from fastapi import APIRouter, HTTPException, status

from app.core.dependencies import CurrentUser
from app.core.types import DBSession
from app.crud.idea import idea_crud
from app.db.models.idea import Idea
from app.idea.service import idea_service
from app.schemas.idea import (
    IdeaRead,
    IdeaRefineResponse,
    IdeaSubmit,
    IdeaUpdate,
)

router = APIRouter(
    prefix="/ideas",
    tags=["Ideas"],
)


def _get_owned_idea(
    db: DBSession,
    idea_id: int,
    current_user: CurrentUser,
) -> Idea:
    """
    Fetch an idea and verify it belongs to the current user.
    Raises 404 if not found or not owned.
    """
    idea = idea_crud.get(
        db=db,
        idea_id=idea_id,
    )

    if idea is None or idea.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Idea not found.",
        )

    return idea


@router.post(
    "",
    response_model=IdeaRead,
    status_code=status.HTTP_201_CREATED,
)
def create_idea(
    payload: IdeaSubmit,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Create a new idea (text or audio transcript).

    The idea is created in DRAFT status with no refinement yet.
    Use POST /ideas/{id}/refine afterward to refine it with the LLM.
    """
    return idea_service.create(
        db=db,
        owner=current_user,
        original_prompt=payload.original_prompt,
        voice_transcript=payload.voice_transcript,
    )


@router.get(
    "",
    response_model=list[IdeaRead],
)
def list_ideas(
    db: DBSession,
    current_user: CurrentUser,
):
    """
    List all ideas belonging to the current user.
    """
    return idea_crud.get_by_owner(
        db=db,
        owner=current_user,
    )


@router.get(
    "/{idea_id}",
    response_model=IdeaRead,
)
def get_idea(
    idea_id: int,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Get a specific idea by ID.
    """
    return _get_owned_idea(db, idea_id, current_user)


@router.patch(
    "/{idea_id}",
    response_model=IdeaRead,
)
def update_idea(
    idea_id: int,
    payload: IdeaUpdate,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Update an existing idea's content.

    If any content field changes (original_prompt, voice_transcript),
    the refined_prompt is reset to None and status reverts to DRAFT
    so the user must re-refine.
    """
    idea = _get_owned_idea(db, idea_id, current_user)

    return idea_service.update(
        db=db,
        idea=idea,
        original_prompt=payload.original_prompt,
        voice_transcript=payload.voice_transcript,
    )


@router.post(
    "/{idea_id}/refine",
    response_model=IdeaRefineResponse,
)
async def refine_idea(
    idea_id: int,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Refine an idea using the LLM (Ollama).

    Fetches the idea, sends it to the LLM for refinement,
    saves the refined_prompt, and sets status to REFINED.

    Flow: Idea → Prompt Template → LLM → JSON Output → Save → status = REFINED
    """
    idea = _get_owned_idea(db, idea_id, current_user)

    idea = await idea_service.refine_and_mark_refined(
        db=db,
        idea=idea,
    )

    return IdeaRefineResponse(
        refined_prompt=idea.refined_prompt,
    )


@router.post(
    "/{idea_id}/approve",
    response_model=IdeaRead,
)
def approve_idea(
    idea_id: int,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Approve a refined idea. This marks the idea as APPROVED.

    The idea must be in REFINED status (refined_prompt must exist).
    Once approved, the idea is ready for repository search.
    """
    idea = _get_owned_idea(db, idea_id, current_user)

    if idea.refined_prompt is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Idea has not been refined yet. Use POST /ideas/{id}/refine first.",
        )

    return idea_service.approve(
        db=db,
        idea=idea,
    )


@router.delete(
    "/{idea_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_idea(
    idea_id: int,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Delete an idea.
    """
    idea = _get_owned_idea(db, idea_id, current_user)

    idea_service.delete(
        db=db,
        idea=idea,
    )
