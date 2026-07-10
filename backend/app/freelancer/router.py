from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.analysis.crud import analysis_crud
from app.core.dependencies import CurrentUser
from app.core.types import DBSession
from app.crud.dashboard import dashboard_crud
from app.crud.response_tracker import response_tracker_crud
from app.crud.user import user_crud
from app.db.enums import ResponseStatus, UserRole
from app.db.models.contributor_match import ContributorMatch
from app.db.models.freelancer_profile import FreelancerProfile
from app.repositories.github_service import github_service

router = APIRouter(
    prefix="/profile",
    tags=["Freelancer"],
)


class ProfileUpdateRequest(BaseModel):
    bio: str | None = None
    experience_level: str | None = None
    portfolio: str | None = None
    linkedin: str | None = None


class GitHubConnectRequest(BaseModel):
    github_username: str = Field(
        min_length=1,
        max_length=100,
        description="GitHub username to connect to this freelancer account.",
    )


def _require_freelancer(current_user: CurrentUser) -> None:
    if current_user.role != UserRole.FREELANCER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only freelancers can access this endpoint.",
        )


def _get_or_create_profile(db: DBSession, user_id: int) -> FreelancerProfile:
    stmt = select(FreelancerProfile).where(FreelancerProfile.user_id == user_id)
    profile = db.execute(stmt).scalar_one_or_none()
    if profile is None:
        profile = FreelancerProfile(user_id=user_id, skills=[], tech_stack=[])
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def _update_invitation_status(
    db: DBSession,
    analysis_id: int,
    github_username: str,
    new_status: str,
) -> list[int]:
    """Update all pending invitation entries for a freelancer on a project."""
    entries = response_tracker_crud.get_by_analysis(db=db, analysis_id=analysis_id)
    updated = []
    for entry in entries:
        if entry.status != ResponseStatus.PENDING:
            continue
        if entry.contributor_match_id:
            match = db.get(ContributorMatch, entry.contributor_match_id)
            if match and match.github_username == github_username:
                response_tracker_crud.update_status(
                    db=db, entry_id=entry.id, new_status=new_status,
                )
                updated.append(entry.id)
    return updated


# ── GET /profile ───────────────────────────────


@router.get("")
def get_profile(
    db: DBSession,
    current_user: CurrentUser,
):
    """Get the current freelancer's profile and skill data."""
    _require_freelancer(current_user)

    profile = _get_or_create_profile(db, current_user.id)

    return {
        "user_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "github_username": current_user.github_username,
        "is_verified": current_user.is_verified,
        "profile": {
            "bio": profile.bio,
            "experience_level": profile.experience_level,
            "portfolio": profile.portfolio,
            "linkedin": profile.linkedin,
            "skills": profile.skills,
            "tech_stack": profile.tech_stack,
            "priority_score": profile.priority_score,
        },
    }


# ── PATCH /profile ─────────────────────────────


@router.patch("")
def update_profile(
    payload: ProfileUpdateRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    """Update freelancer profile fields (bio, experience, portfolio, linkedin)."""
    _require_freelancer(current_user)

    profile = _get_or_create_profile(db, current_user.id)

    if payload.bio is not None:
        profile.bio = payload.bio
    if payload.experience_level is not None:
        profile.experience_level = payload.experience_level
    if payload.portfolio is not None:
        profile.portfolio = payload.portfolio
    if payload.linkedin is not None:
        profile.linkedin = payload.linkedin

    db.commit()
    db.refresh(profile)

    return {"message": "Profile updated.", "profile": {
        "bio": profile.bio,
        "experience_level": profile.experience_level,
        "portfolio": profile.portfolio,
        "linkedin": profile.linkedin,
        "skills": profile.skills,
        "tech_stack": profile.tech_stack,
    }}


# ── POST /github/connect ───────────────────────


@router.post("/github/connect")
async def connect_github(
    payload: GitHubConnectRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Connect a GitHub username to the freelancer account.

    Validates the GitHub user exists via the GitHub API before saving.
    """
    _require_freelancer(current_user)

    # Verify the GitHub user exists
    try:
        repos = await github_service.get_user_repos(
            username=payload.github_username, per_page=1
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub user not found or API unavailable.",
        )

    # Update the user's github_username
    user_crud.update_profile(
        db=db, user=current_user, github_username=payload.github_username,
    )

    return {
        "message": "GitHub account connected successfully.",
        "github_username": payload.github_username,
    }


# ── POST /profile/analyze (GitHub Skill Extraction) ──


@router.post("/analyze")
async def analyze_github_profile(
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Analyze the freelancer's GitHub profile to extract skills.

    Fetches recent repositories, languages, and topics from GitHub,
    then saves the skill vector to the freelancer's profile.
    """
    _require_freelancer(current_user)

    github_username = current_user.github_username
    if not github_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No GitHub username linked. Use POST /profile/github/connect first.",
        )

    repos = await github_service.get_user_repos(
        username=github_username, per_page=10
    )

    languages = set()
    topics = set()
    for repo in repos:
        lang = repo.get("language")
        if lang:
            languages.add(lang)
        repo_topics = repo.get("topics", []) or []
        topics.update(repo_topics)

    skills = list(languages) + list(topics)[:10]
    tech_stack = list(languages)

    profile = _get_or_create_profile(db, current_user.id)
    profile.skills = skills
    profile.tech_stack = tech_stack
    db.commit()
    db.refresh(profile)

    return {
        "message": "GitHub profile analyzed successfully.",
        "extracted_skills": skills,
        "tech_stack": tech_stack,
        "repositories_analyzed": len(repos),
    }


# ── GET /projects/recommended ──────────────────


@router.get("/projects/recommended")
def get_recommended_projects(
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Get recommended projects for the freelancer based on skill matches.
    Returns the same dashboard data as GET /dashboard/freelancer.
    """
    _require_freelancer(current_user)

    github_username = current_user.github_username
    if not github_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No GitHub username linked.",
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

    return {
        "collaboration_overview": overview,
        "smart_analytics": analytics,
        "recommended_projects": projects,
    }


# ── POST /projects/{analysis_id}/accept ────────


@router.post("/projects/{analysis_id}/accept")
def accept_project_invitation(
    analysis_id: int,
    db: DBSession,
    current_user: CurrentUser,
):
    """Accept an invitation to collaborate on a project."""
    _require_freelancer(current_user)

    github_username = current_user.github_username
    if not github_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No GitHub username linked.",
        )

    updated = _update_invitation_status(
        db, analysis_id, github_username, "accepted",
    )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending invitations found for this project.",
        )

    return {"message": "Invitation accepted.", "updated_entries": updated}


# ── POST /projects/{analysis_id}/decline ───────


@router.post("/projects/{analysis_id}/decline")
def decline_project_invitation(
    analysis_id: int,
    db: DBSession,
    current_user: CurrentUser,
):
    """Decline an invitation to collaborate on a project."""
    _require_freelancer(current_user)

    github_username = current_user.github_username
    if not github_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No GitHub username linked.",
        )

    updated = _update_invitation_status(
        db, analysis_id, github_username, "declined",
    )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending invitations found for this project.",
        )

    return {"message": "Invitation declined.", "updated_entries": updated}

