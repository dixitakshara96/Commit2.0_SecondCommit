from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.enums import ResponseStatus
from app.db.models.contributor_match import ContributorMatch
from app.db.models.idea import Idea
from app.db.models.outreach_message import OutreachMessage
from app.db.models.repository import Repository
from app.db.models.repository_analysis import RepositoryAnalysis
from app.db.models.response_tracker import ResponseTracker


class ResponseTrackerCRUD:

    # ── Lifecycle Operations ──

    @staticmethod
    def create(
        db: Session,
        *,
        analysis_id: int,
        contributor_match_id: int | None = None,
        outreach_message_id: int | None = None,
        notes: str | None = None,
    ) -> ResponseTracker:
        """Create a new pending tracking entry when outreach is dispatched."""
        entry = ResponseTracker(
            analysis_id=analysis_id,
            contributor_match_id=contributor_match_id,
            outreach_message_id=outreach_message_id,
            status=ResponseStatus.PENDING,
            notes=notes,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def bulk_create_from_outreach(
        db: Session,
        *,
        analysis_id: int,
        contributor_match_ids: list[int],
        outreach_message_ids: list[int],
    ) -> list[ResponseTracker]:
        """Create tracking entries after outreach generation."""
        created = []
        # Pair messages with matches by index
        for i, msg_id in enumerate(outreach_message_ids):
            match_id = contributor_match_ids[i] if i < len(contributor_match_ids) else None
            entry = ResponseTracker(
                analysis_id=analysis_id,
                contributor_match_id=match_id,
                outreach_message_id=msg_id,
                status=ResponseStatus.PENDING,
            )
            db.add(entry)
            created.append(entry)
        db.commit()
        for e in created:
            db.refresh(e)
        return created

    @staticmethod
    def update_status(
        db: Session,
        *,
        entry_id: int,
        new_status: str,
        notes: str | None = None,
    ) -> ResponseTracker | None:
        """
        Transition a tracking entry to accepted or declined.
        Sets responded_at on first transition out of pending.
        """
        entry = db.get(ResponseTracker, entry_id)
        if entry is None:
            return None

        entry.status = ResponseStatus(new_status)

        # Only stamp responded_at on the first actual response
        if entry.responded_at is None:
            entry.responded_at = datetime.now(timezone.utc)

        if notes is not None:
            entry.notes = notes

        db.commit()
        db.refresh(entry)
        return entry

    # ── Query Operations ──

    @staticmethod
    def get_by_analysis(
        db: Session,
        *,
        analysis_id: int,
    ) -> list[ResponseTracker]:
        stmt = (
            select(ResponseTracker)
            .where(ResponseTracker.analysis_id == analysis_id)
            .order_by(ResponseTracker.created_at.desc())
        )
        return list(db.execute(stmt).scalars().all())

    @staticmethod
    def get_by_id(
        db: Session,
        *,
        entry_id: int,
    ) -> ResponseTracker | None:
        return db.get(ResponseTracker, entry_id)

    @staticmethod
    def get_summary(
        db: Session,
        *,
        analysis_id: int,
    ) -> dict:
        """Return aggregated response stats for a given analysis."""
        entries = ResponseTrackerCRUD.get_by_analysis(db=db, analysis_id=analysis_id)
        total = len(entries)
        pending = sum(1 for e in entries if e.status == ResponseStatus.PENDING)
        accepted = sum(1 for e in entries if e.status == ResponseStatus.ACCEPTED)
        declined = sum(1 for e in entries if e.status == ResponseStatus.DECLINED)

        responded = accepted + declined

        if total > 0:
            response_rate = round((responded / total) * 100, 1)
        else:
            response_rate = 0.0

        if responded > 0:
            acceptance_rate = round((accepted / responded) * 100, 1)
        else:
            acceptance_rate = 0.0

        return {
            "total_sent": total,
            "pending_count": pending,
            "accepted_count": accepted,
            "declined_count": declined,
            "response_rate": response_rate,
            "acceptance_rate": acceptance_rate,
        }

    # ── Dashboard Aggregations ──

    @staticmethod
    def get_startup_response_stats(
        db: Session,
        *,
        user_id: int,
    ) -> dict:
        """
        Return real acceptance/pending counts for a startup user,
        joining through analysis -> repository -> idea -> user.
        """
        # All tracking entries belonging to this startup
        stmt = (
            select(ResponseTracker)
            .join(
                RepositoryAnalysis,
                ResponseTracker.analysis_id == RepositoryAnalysis.id,
            )
            .join(Repository, RepositoryAnalysis.repository_id == Repository.id)
            .join(Idea, Repository.idea_id == Idea.id)
            .where(Idea.owner_id == user_id)
        )
        entries = list(db.execute(stmt).scalars().all())

        total = len(entries)
        accepted = sum(1 for e in entries if e.status == ResponseStatus.ACCEPTED)
        declined = sum(1 for e in entries if e.status == ResponseStatus.DECLINED)
        pending = sum(1 for e in entries if e.status == ResponseStatus.PENDING)

        return {
            "contributors_contacted": total,
            "accepted_count": accepted,
            "declined_count": declined,
            "pending_responses_count": pending,
        }

    @staticmethod
    def get_freelancer_invitation_stats(
        db: Session,
        *,
        github_username: str,
    ) -> dict:
        """
        Return invitation stats for a freelancer based on their GitHub username.
        Joins through contributor_match -> response_tracker.
        """
        stmt = (
            select(ResponseTracker)
            .join(
                ContributorMatch,
                ResponseTracker.contributor_match_id == ContributorMatch.id,
            )
            .where(ContributorMatch.github_username == github_username)
        )
        entries = list(db.execute(stmt).scalars().all())

        total = len(entries)
        accepted = sum(1 for e in entries if e.status == ResponseStatus.ACCEPTED)
        declined = sum(1 for e in entries if e.status == ResponseStatus.DECLINED)
        pending = sum(1 for e in entries if e.status == ResponseStatus.PENDING)

        return {
            "total_invitations_received": total,
            "accepted_collaborations_count": accepted,
            "pending_invitations_count": pending,
            "declined_count": declined,
        }


response_tracker_crud = ResponseTrackerCRUD()
