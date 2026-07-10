from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.enums import IdeaStatus, UserRole
from app.db.models.contributor_match import ContributorMatch
from app.db.models.idea import Idea
from app.db.models.outreach_message import OutreachMessage
from app.db.models.repository import Repository
from app.db.models.repository_analysis import RepositoryAnalysis
from app.db.models.response_tracker import ResponseTracker
from app.db.models.user import User
from app.crud.response_tracker import response_tracker_crud


class DashboardCRUD:
    """
    Aggregation queries for startup, freelancer, and admin dashboards.
    All queries execute as single-roundtrip SQL aggregates where possible.
    """

    # ──────────────────────────────────────────────
    #  Startup Dashboard Queries
    # ──────────────────────────────────────────────

    @staticmethod
    def startup_summary(
        db: Session,
        *,
        user_id: int,
    ) -> dict:
        """Return aggregate counts for a startup user."""
        # Total ideas submitted by this user
        total_ideas = db.execute(
            select(func.count(Idea.id)).where(Idea.owner_id == user_id)
        ).scalar() or 0

        # Ideas that have reached ANALYZED status (active analyses)
        active_analyses = db.execute(
            select(func.count(Idea.id)).where(
                Idea.owner_id == user_id,
                Idea.status == IdeaStatus.ANALYZED,
            )
        ).scalar() or 0

        # Total outreach messages sent for analyses owned by this user
        # Join: idea -> repository -> repository_analysis -> outreach_message
        contributors_contacted = db.execute(
            select(func.count(OutreachMessage.id)).select_from(OutreachMessage)
            .join(RepositoryAnalysis, OutreachMessage.analysis_id == RepositoryAnalysis.id)
            .join(Repository, RepositoryAnalysis.repository_id == Repository.id)
            .join(Idea, Repository.idea_id == Idea.id)
            .where(Idea.owner_id == user_id)
        ).scalar() or 0

        # Real pending count from ResponseTracker lifecycle data
        stats = response_tracker_crud.get_startup_response_stats(
            db=db, user_id=user_id,
        )
        pending_responses = stats["pending_responses_count"]

        return {
            "total_ideas_submitted": total_ideas,
            "active_analyses_count": active_analyses,
            "contributors_contacted": contributors_contacted,
            "pending_responses_count": pending_responses,
        }

    @staticmethod
    def startup_advanced_analytics(
        db: Session,
        *,
        user_id: int,
        summary: dict,
    ) -> dict:
        """Derive composite analytics from raw aggregates."""
        total_ideas = summary["total_ideas_submitted"]
        active = summary["active_analyses_count"]
        contacted = summary["contributors_contacted"]
        pending = summary["pending_responses_count"]

        # Response rate = ((contacted - pending) / contacted) * 100, zero-safe
        if contacted > 0:
            response_rate = round(((contacted - pending) / contacted) * 100, 1)
        else:
            response_rate = 0.0

        # Analysis velocity — analyses executed in the last 7 days
        # This measures the startup's current engagement pace
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        analyses_last_7d = db.execute(
            select(func.count(RepositoryAnalysis.id)).select_from(RepositoryAnalysis)
            .join(Repository, RepositoryAnalysis.repository_id == Repository.id)
            .join(Idea, Repository.idea_id == Idea.id)
            .where(
                Idea.owner_id == user_id,
                RepositoryAnalysis.created_at >= seven_days_ago,
            )
        ).scalar() or 0

        # Velocity: average per 7-day window over lifetime
        # Use total ideas as a rough proxy for weeks active
        # Cap denominator at 1 to avoid division by zero
        weeks_active = max(1, total_ideas)
        analysis_velocity = round(analyses_last_7d / weeks_active, 2)

        # Outreach conversion index = contributors contacted / active analyses
        if active > 0:
            outreach_conversion = round(contacted / active, 2)
        else:
            outreach_conversion = 0.0

        # Idea revival score = (active * 10) + (response_rate * 0.5) + (total_ideas * 2), capped at 100
        revival_score = min(
            100.0,
            round((active * 10) + (response_rate * 0.5) + (total_ideas * 2), 1),
        )

        return {
            "idea_revival_score": revival_score,
            "response_rate_percentage": response_rate,
            "analysis_velocity": analysis_velocity,
            "outreach_conversion_index": outreach_conversion,
        }

    # ──────────────────────────────────────────────
    #  Freelancer Dashboard Queries
    # ──────────────────────────────────────────────

    @staticmethod
    def freelancer_collaboration_overview(
        db: Session,
        *,
        github_username: str,
    ) -> dict:
        """Return collaboration counts for a freelancer based on their GitHub username."""
        # Real invitation stats from ResponseTracker lifecycle data
        stats = response_tracker_crud.get_freelancer_invitation_stats(
            db=db, github_username=github_username,
        )

        # Fallback: count raw outreach messages for total invitations
        # in case no tracker entries exist yet
        total_invitations = stats["total_invitations_received"]
        if total_invitations == 0:
            total_invitations = db.execute(
                select(func.count(OutreachMessage.id)).where(
                    OutreachMessage.recipient == github_username,
                )
            ).scalar() or 0

        accepted = stats["accepted_collaborations_count"]
        pending = stats["pending_invitations_count"]

        return {
            "total_invitations_received": total_invitations,
            "accepted_collaborations_count": accepted,
            "pending_invitations_count": pending,
        }

    @staticmethod
    def freelancer_smart_analytics(
        db: Session,
        *,
        github_username: str,
        overview: dict,
    ) -> dict:
        """Derive smart analytics from collaboration data."""
        total_invitations = overview["total_invitations_received"]
        accepted = overview["accepted_collaborations_count"]

        # Invitation acceptance rate
        if total_invitations > 0:
            acceptance_rate = round((accepted / total_invitations) * 100, 1)
        else:
            acceptance_rate = 0.0

        # Average match score across all contributor matches
        # Used for both profile_matching_score and avg_collaboration_fit_rating
        avg_match = db.execute(
            select(func.avg(ContributorMatch.match_score)).where(
                ContributorMatch.github_username == github_username,
            )
        ).scalar()

        profile_matching_score = round(avg_match, 1) if avg_match else 75.0
        avg_collaboration_fit = round(avg_match, 1) if avg_match else 70.0

        # Market demand index based on invitations in last 7 days
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        invitations_7d = db.execute(
            select(func.count(OutreachMessage.id)).where(
                OutreachMessage.recipient == github_username,
                OutreachMessage.created_at >= seven_days_ago,
            )
        ).scalar() or 0

        if invitations_7d > 5:
            demand_index = "High"
        elif invitations_7d >= 2:
            demand_index = "Medium"
        else:
            demand_index = "Low"

        return {
            "profile_matching_score": profile_matching_score,
            "invitation_acceptance_rate": acceptance_rate,
            "market_demand_index": demand_index,
            "avg_collaboration_fit_rating": avg_collaboration_fit,
        }

    @staticmethod
    def freelancer_recommended_projects(
        db: Session,
        *,
        github_username: str,
    ) -> list[dict]:
        """Return projects where this freelancer is a recommended contributor."""
        results = (
            db.execute(
                select(
                    ContributorMatch,
                    RepositoryAnalysis,
                    Repository,
                    Idea,
                    User,
                )
                .join(
                    RepositoryAnalysis,
                    ContributorMatch.analysis_id == RepositoryAnalysis.id,
                )
                .join(
                    Repository,
                    RepositoryAnalysis.repository_id == Repository.id,
                )
                .join(Idea, Repository.idea_id == Idea.id)
                .join(User, Idea.owner_id == User.id)
                .where(ContributorMatch.github_username == github_username)
                .limit(10)
            )
            .unique()
            .all()
        )

        projects = []
        for match, analysis, repo, idea, owner in results:
            # Build matching reasons from the recommendation reason and matched skills
            reasons = [match.recommendation_reason] if match.recommendation_reason else []
            reasons.extend(
                f"Skilled in: {s}" for s in (match.matched_skills or [])[:3]
            )

            projects.append({
                "project_id": analysis.id,
                "title": f"{repo.owner}/{repo.repo_name}" if repo else "Unknown",
                "startup_name": owner.name if owner else "Unknown",
                "matching_score": match.match_score,
                "matching_reasons": reasons,
            })

        return projects

    # ──────────────────────────────────────────────
    #  Admin Dashboard Queries
    # ──────────────────────────────────────────────

    @staticmethod
    def admin_system_aggregates(db: Session) -> dict:
        """Return platform-wide aggregate counts."""
        total_startups = db.execute(
            select(func.count(User.id)).where(User.role == UserRole.STARTUP)
        ).scalar() or 0

        total_freelancers = db.execute(
            select(func.count(User.id)).where(User.role == UserRole.FREELANCER)
        ).scalar() or 0

        total_analyses = db.execute(
            select(func.count(RepositoryAnalysis.id))
        ).scalar() or 0

        return {
            "total_startup_users": total_startups,
            "total_freelancer_users": total_freelancers,
            "total_analyses_executed": total_analyses,
        }

    @staticmethod
    def admin_ecosystem_health(
        db: Session,
        aggregates: dict,
    ) -> dict:
        """Derive ecosystem health metrics."""
        total_startups = aggregates["total_startup_users"]

        # Freelancer-to-startup ratio
        if total_startups > 0:
            ratio = round(
                aggregates["total_freelancer_users"] / total_startups, 2
            )
        else:
            ratio = 0.0

        # Platform activity rate in last 7 days
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        active_users_last_7d = db.execute(
            select(func.count(func.distinct(Idea.owner_id)))
            .where(Idea.created_at >= seven_days_ago)
        ).scalar() or 0

        total_users = total_startups + aggregates["total_freelancer_users"]
        if total_users > 0:
            activity_rate = round((active_users_last_7d / total_users) * 100, 1)
        else:
            activity_rate = 0.0

        # Unverified users
        unverified = db.execute(
            select(func.count(User.id)).where(User.is_verified.is_(False))
        ).scalar() or 0

        # Average analyses per startup
        if total_startups > 0:
            avg_analyses = round(
                aggregates["total_analyses_executed"] / total_startups, 2
            )
        else:
            avg_analyses = 0.0

        return {
            "freelancer_to_startup_ratio": ratio,
            "platform_activity_rate_7d": activity_rate,
            "unverified_users_count": unverified,
            "avg_analyses_per_startup": avg_analyses,
        }


dashboard_crud = DashboardCRUD()
