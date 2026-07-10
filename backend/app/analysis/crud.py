from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.analysis_finding import AnalysisFinding
from app.db.models.contributor_match import ContributorMatch
from app.db.models.outreach_message import OutreachMessage
from app.db.models.repository_analysis import RepositoryAnalysis
from app.db.models.required_role import RequiredRole


class AnalysisCRUD:

    # ---- RepositoryAnalysis ----

    @staticmethod
    def create_analysis(
        db: Session,
        *,
        repository_id: int,
        executive_summary: str = "",
        revival_score: int = 0,
        project_health_score: int = 0,
        documentation_score: int = 0,
        technical_debt_score: int = 0,
        trend_score: int = 0,
        safe_to_revive: bool = False,
        ai_effort_percentage: float = 0.0,
        human_effort_percentage: float = 0.0,
        analysis_metadata: dict | None = None,
    ) -> RepositoryAnalysis:

        analysis = RepositoryAnalysis(
            repository_id=repository_id,
            executive_summary=executive_summary,
            revival_score=revival_score,
            project_health_score=project_health_score,
            documentation_score=documentation_score,
            technical_debt_score=technical_debt_score,
            trend_score=trend_score,
            safe_to_revive=safe_to_revive,
            ai_effort_percentage=ai_effort_percentage,
            human_effort_percentage=human_effort_percentage,
            analysis_metadata=analysis_metadata or {},
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        return analysis

    @staticmethod
    def get_analysis(
        db: Session,
        *,
        analysis_id: int,
    ) -> RepositoryAnalysis | None:
        return db.get(RepositoryAnalysis, analysis_id)

    @staticmethod
    def get_analysis_by_repository(
        db: Session,
        *,
        repository_id: int,
    ) -> RepositoryAnalysis | None:
        stmt = (
            select(RepositoryAnalysis)
            .where(RepositoryAnalysis.repository_id == repository_id)
        )
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def update_analysis(
        db: Session,
        *,
        analysis: RepositoryAnalysis,
        **kwargs,
    ) -> RepositoryAnalysis:
        for key, value in kwargs.items():
            if hasattr(analysis, key):
                setattr(analysis, key, value)
        db.commit()
        db.refresh(analysis)
        return analysis

    # ---- AnalysisFinding ----

    @staticmethod
    def create_finding(
        db: Session,
        *,
        analysis_id: int,
        type: str,
        severity: str,
        title: str,
        description: str,
        recommendation: str,
    ) -> AnalysisFinding:
        finding = AnalysisFinding(
            analysis_id=analysis_id,
            type=type,
            severity=severity,
            title=title,
            description=description,
            recommendation=recommendation,
        )
        db.add(finding)
        db.commit()
        db.refresh(finding)
        return finding

    @staticmethod
    def bulk_create_findings(
        db: Session,
        *,
        analysis_id: int,
        findings: list[dict],
    ) -> list[AnalysisFinding]:
        created = []
        for f in findings:
            finding = AnalysisFinding(
                analysis_id=analysis_id,
                type=f["type"],
                severity=f["severity"],
                title=f["title"],
                description=f["description"],
                recommendation=f.get("recommendation", ""),
            )
            db.add(finding)
            created.append(finding)
        db.commit()
        for f in created:
            db.refresh(f)
        return created

    # ---- RequiredRole ----

    @staticmethod
    def create_role(
        db: Session,
        *,
        analysis_id: int,
        role: str,
        priority: int,
        reason: str,
    ) -> RequiredRole:
        required_role = RequiredRole(
            analysis_id=analysis_id,
            role=role,
            priority=priority,
            reason=reason,
        )
        db.add(required_role)
        db.commit()
        db.refresh(required_role)
        return required_role

    @staticmethod
    def bulk_create_roles(
        db: Session,
        *,
        analysis_id: int,
        roles: list[dict],
    ) -> list[RequiredRole]:
        created = []
        for r in roles:
            role_obj = RequiredRole(
                analysis_id=analysis_id,
                role=r["role"],
                priority=r.get("priority", 0),
                reason=r.get("reason", ""),
            )
            db.add(role_obj)
            created.append(role_obj)
        db.commit()
        for r in created:
            db.refresh(r)
        return created

    # ---- ContributorMatch ----

    @staticmethod
    def create_contributor(
        db: Session,
        *,
        analysis_id: int,
        github_username: str,
        github_profile: str,
        avatar_url: str | None = None,
        match_score: float = 0.0,
        recent_activity_score: float = 0.0,
        matched_skills: list | None = None,
        recent_repositories: list | None = None,
        recommendation_reason: str = "",
    ) -> ContributorMatch:
        match = ContributorMatch(
            analysis_id=analysis_id,
            github_username=github_username,
            github_profile=github_profile,
            avatar_url=avatar_url,
            match_score=match_score,
            recent_activity_score=recent_activity_score,
            matched_skills=matched_skills or [],
            recent_repositories=recent_repositories or [],
            recommendation_reason=recommendation_reason,
        )
        db.add(match)
        db.commit()
        db.refresh(match)
        return match

    @staticmethod
    def bulk_create_contributors(
        db: Session,
        *,
        analysis_id: int,
        contributors: list[dict],
    ) -> list[ContributorMatch]:
        created = []
        for c in contributors:
            match = ContributorMatch(
                analysis_id=analysis_id,
                github_username=c["github_username"],
                github_profile=c.get("github_profile", ""),
                avatar_url=c.get("avatar_url"),
                match_score=c.get("match_score", 0.0),
                recent_activity_score=c.get("recent_activity_score", 0.0),
                matched_skills=c.get("matched_skills", []),
                recent_repositories=c.get("recent_repositories", []),
                recommendation_reason=c.get("recommendation_reason", ""),
            )
            db.add(match)
            created.append(match)
        db.commit()
        for m in created:
            db.refresh(m)
        return created


    # ---- OutreachMessage ----

    @staticmethod
    def bulk_create_outreach_messages(
        db: Session,
        *,
        analysis_id: int,
        messages: list[dict],
    ) -> list[OutreachMessage]:
        """
        Create multiple outreach messages at once.

        Each message dict should contain:
            - recipient: str (GitHub username)
            - type: str (OutreachType value, e.g. "contributor")
            - generated_message: str
        """
        created = []
        for msg in messages:
            outreach = OutreachMessage(
                analysis_id=analysis_id,
                recipient=msg["recipient"],
                type=msg["type"],
                generated_message=msg["generated_message"],
            )
            db.add(outreach)
            created.append(outreach)
        db.commit()
        for m in created:
            db.refresh(m)
        return created

    @staticmethod
    def get_outreach_messages(
        db: Session,
        *,
        analysis_id: int,
    ) -> list[OutreachMessage]:
        """Get all outreach messages for a given analysis."""
        stmt = (
            select(OutreachMessage)
            .where(OutreachMessage.analysis_id == analysis_id)
            .order_by(OutreachMessage.created_at)
        )
        return list(db.execute(stmt).scalars().all())

    @staticmethod
    def get_contributors_by_ids(
        db: Session,
        *,
        analysis_id: int,
        contributor_ids: list[int],
    ) -> list[ContributorMatch]:
        """Fetch specific contributor matches by IDs for a given analysis."""
        stmt = (
            select(ContributorMatch)
            .where(ContributorMatch.analysis_id == analysis_id)
            .where(ContributorMatch.id.in_(contributor_ids))
        )
        return list(db.execute(stmt).scalars().all())


analysis_crud = AnalysisCRUD()
