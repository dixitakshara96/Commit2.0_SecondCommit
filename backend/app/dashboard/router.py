from fastapi import APIRouter, HTTPException, status

from app.core.dependencies import CurrentUser
from app.core.types import DBSession
from app.crud.dashboard import dashboard_crud
from app.db.enums import UserRole
from app.schemas.dashboard import (
    AdminDashboardResponse,
    AdminEcosystemHealth,
    AdminSystemAggregates,
    FreelancerCollaborationOverview,
    FreelancerDashboardResponse,
    FreelancerSmartAnalytics,
    RecommendedProject,
    StartupAdvancedAnalytics,
    StartupDashboardResponse,
    StartupSummaryMetrics,
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


# ──────────────────────────────────────────────
#  Startup Dashboard
# ──────────────────────────────────────────────


@router.get(
    "/startup",
    response_model=StartupDashboardResponse,
)
def startup_dashboard(
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Return the startup owner's personal dashboard with summary metrics
    and advanced operational analytics.

    Requires the current user to have role = 'startup'.
    """
    if current_user.role != UserRole.STARTUP:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only startup users can access the startup dashboard.",
        )

    summary = dashboard_crud.startup_summary(db=db, user_id=current_user.id)
    analytics = dashboard_crud.startup_advanced_analytics(
        db=db, user_id=current_user.id, summary=summary,
    )

    return StartupDashboardResponse(
        summary_metrics=StartupSummaryMetrics(**summary),
        advanced_analytics=StartupAdvancedAnalytics(**analytics),
    )


# ──────────────────────────────────────────────
#  Freelancer Dashboard
# ──────────────────────────────────────────────


@router.get(
    "/freelancer",
    response_model=FreelancerDashboardResponse,
)
def freelancer_dashboard(
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Return the freelancer's personal dashboard with collaboration overview,
    smart analytics, and recommended projects.

    Requires the current user to have role = 'freelancer'
    and a GitHub username linked to their profile.
    """
    if current_user.role != UserRole.FREELANCER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only freelancer users can access the freelancer dashboard.",
        )

    github_username = current_user.github_username
    if not github_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "No GitHub username linked to your account. "
                "Please update your profile with a GitHub username."
            ),
        )

    overview = dashboard_crud.freelancer_collaboration_overview(
        db=db, github_username=github_username,
    )
    analytics = dashboard_crud.freelancer_smart_analytics(
        db=db, github_username=github_username, overview=overview,
    )
    projects = dashboard_crud.freelancer_recommended_projects(
        db=db, github_username=github_username,
    )

    return FreelancerDashboardResponse(
        collaboration_overview=FreelancerCollaborationOverview(**overview),
        smart_analytics=FreelancerSmartAnalytics(**analytics),
        recommended_projects=[
            RecommendedProject(**p) for p in projects
        ],
    )


# ──────────────────────────────────────────────
#  Admin Dashboard
# ──────────────────────────────────────────────


@router.get(
    "/admin",
    response_model=AdminDashboardResponse,
)
def admin_dashboard(
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Return the global admin dashboard with system-wide aggregates
    and ecosystem health metrics.

    Requires the current user to have role = 'admin'.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can access the admin dashboard.",
        )

    aggregates = dashboard_crud.admin_system_aggregates(db=db)
    health = dashboard_crud.admin_ecosystem_health(
        db=db, aggregates=aggregates,
    )

    return AdminDashboardResponse(
        system_aggregates=AdminSystemAggregates(**aggregates),
        ecosystem_health=AdminEcosystemHealth(**health),
    )
