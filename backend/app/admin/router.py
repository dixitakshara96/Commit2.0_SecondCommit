from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from app.core.dependencies import CurrentUser
from app.core.types import DBSession
from app.crud.dashboard import dashboard_crud
from app.crud.idea import idea_crud
from app.crud.user import user_crud
from app.db.enums import IdeaStatus, ResponseStatus, UserRole
from app.db.models.idea import Idea
from app.db.models.user import User
from app.schemas.dashboard import (
    AdminDashboardResponse,
    AdminEcosystemHealth,
    AdminSystemAggregates,
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


def _require_admin(current_user: CurrentUser) -> None:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can access this endpoint.",
        )


# ── GET /admin/dashboard ───────────────────────


@router.get("/dashboard", response_model=AdminDashboardResponse)
def admin_dashboard(
    db: DBSession,
    current_user: CurrentUser,
):
    """Platform-wide analytics dashboard (admin only)."""
    _require_admin(current_user)

    aggregates = dashboard_crud.admin_system_aggregates(db=db)
    health = dashboard_crud.admin_ecosystem_health(
        db=db, aggregates=aggregates,
    )

    return AdminDashboardResponse(
        system_aggregates=AdminSystemAggregates(**aggregates),
        ecosystem_health=AdminEcosystemHealth(**health),
    )


# ── GET /admin/users ───────────────────────────


@router.get("/users")
def list_users(
    db: DBSession,
    current_user: CurrentUser,
    role: str | None = None,
):
    """List all platform users, optionally filtered by role."""
    _require_admin(current_user)

    stmt = select(User)
    if role:
        try:
            role_enum = UserRole(role)
            stmt = stmt.where(User.role == role_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role: {role}. Must be one of: startup, freelancer, admin.",
            )

    stmt = stmt.order_by(User.created_at.desc())
    users = list(db.execute(stmt).scalars().all())

    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role.value,
            "github_username": u.github_username,
            "is_verified": u.is_verified,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]


# ── PATCH /admin/users/{user_id} ───────────────


@router.patch("/users/{user_id}")
def update_user(
    user_id: int,
    db: DBSession,
    current_user: CurrentUser,
    is_verified: bool | None = None,
    github_username: str | None = None,
):
    """Update a user's verification status or GitHub username."""
    _require_admin(current_user)

    user = user_crud.get_by_id(db=db, user_id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if is_verified is not None:
        user.is_verified = is_verified
    if github_username is not None:
        user.github_username = github_username

    db.commit()
    db.refresh(user)

    return {
        "message": "User updated.",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.value,
            "is_verified": user.is_verified,
            "github_username": user.github_username,
        },
    }


# ── DELETE /admin/users/{user_id} ──────────────


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: DBSession,
    current_user: CurrentUser,
):
    """Delete a user account and all associated data."""
    _require_admin(current_user)

    user = user_crud.get_by_id(db=db, user_id=user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    user_crud.delete(db=db, user=user)


# ── GET /admin/ideas ───────────────────────────


@router.get("/ideas")
def list_all_ideas(
    db: DBSession,
    current_user: CurrentUser,
    status_filter: str | None = None,
):
    """List all ideas across all users, with optional status filter."""
    _require_admin(current_user)

    stmt = select(Idea)
    if status_filter:
        try:
            status_enum = IdeaStatus(status_filter)
            stmt = stmt.where(Idea.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status_filter}.",
            )

    stmt = stmt.order_by(Idea.created_at.desc())
    ideas = list(db.execute(stmt).scalars().all())

    return [
        {
            "id": idea.id,
            "owner_id": idea.owner_id,
            "original_prompt": (
                idea.original_prompt[:100] + "..."
                if len(idea.original_prompt) > 100
                else idea.original_prompt
            ),
            "status": idea.status.value,
            "has_refined_prompt": idea.refined_prompt is not None,
            "created_at": idea.created_at.isoformat(),
        }
        for idea in ideas
    ]


# ── DELETE /admin/ideas/{idea_id} ──────────────


@router.delete("/ideas/{idea_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_idea(
    idea_id: int,
    db: DBSession,
    current_user: CurrentUser,
):
    """Delete a spam or fake idea."""
    _require_admin(current_user)

    idea = idea_crud.get(db=db, idea_id=idea_id)
    if idea is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Idea not found.",
        )

    idea_crud.delete(db=db, idea=idea)


# ── GET /admin/analytics ───────────────────────


@router.get("/analytics")
def platform_analytics(
    db: DBSession,
    current_user: CurrentUser,
):
    """Deep platform analytics — aggregates across all entities."""
    _require_admin(current_user)

    from app.db.models.contributor_match import ContributorMatch
    from app.db.models.outreach_message import OutreachMessage
    from app.db.models.repository_analysis import RepositoryAnalysis
    from app.db.models.response_tracker import ResponseTracker

    aggregates = dashboard_crud.admin_system_aggregates(db=db)

    total_ideas = db.execute(select(func.count(Idea.id))).scalar() or 0
    total_contributor_matches = db.execute(
        select(func.count(ContributorMatch.id))
    ).scalar() or 0
    total_outreach_sent = db.execute(
        select(func.count(OutreachMessage.id))
    ).scalar() or 0
    total_responses = db.execute(
        select(func.count(ResponseTracker.id))
    ).scalar() or 0
    accepted_responses = db.execute(
        select(func.count(ResponseTracker.id)).where(
            ResponseTracker.status == ResponseStatus.ACCEPTED
        )
    ).scalar() or 0

    return {
        "users": aggregates,
        "ideas": {"total": total_ideas},
        "analyses": {"total": aggregates["total_analyses_executed"]},
        "contributor_matches": {"total": total_contributor_matches},
        "outreach": {"total_sent": total_outreach_sent},
        "responses": {
            "total": total_responses,
            "accepted": accepted_responses,
            "acceptance_rate": round(
                (accepted_responses / total_responses * 100), 1
            ) if total_responses > 0 else 0.0,
        },
    }
