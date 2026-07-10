from sqlalchemy.orm import Session

from app.analysis.agents.ai_capability_agent import ai_capability_agent
from app.analysis.agents.code_health_agent import code_health_agent
from app.analysis.agents.contributor_agent import contributor_agent
from app.analysis.agents.documentation_agent import documentation_agent
from app.analysis.agents.report_generator import report_generator
from app.analysis.agents.skill_gap_agent import skill_gap_agent
from app.analysis.agents.snapshot_agent import snapshot_agent
from app.analysis.agents.trend_agent import trend_agent
from app.db.models.repository import Repository


class AnalysisOrchestrator:
    """
    Internal multi-agent pipeline that runs all analysis steps in sequence.
    Each agent reads from the snapshot where possible to avoid repeated API calls.
    """

    async def run(
        self,
        db: Session,
        *,
        repository: Repository,
    ) -> int:
        # Step 1: Snapshot Agent - fetch all GitHub data once
        snapshot = await snapshot_agent.run(
            db=db,
            owner=repository.owner,
            repo_name=repository.repo_name,
            repository_id=repository.id,
        )

        # Extract common data from snapshot
        readme = snapshot.raw_snapshot.get("readme", "")
        open_issues = snapshot.raw_snapshot.get("issues", [])

        # Step 2: Documentation Agent
        doc_result = await documentation_agent.run(
            repo_name=repository.repo_name,
            description=repository.description,
            readme=readme,
            topics=snapshot.topics,
        )

        # Step 3: Code Health Agent (rule-based)
        health_result = await code_health_agent.run(
            stars=snapshot.stars,
            forks=snapshot.forks,
            open_issues=snapshot.open_issues,
            commits_count=snapshot.commits_count,
            pull_requests_count=snapshot.pull_requests_count,
            releases_count=snapshot.releases_count,
            contributors_count=snapshot.contributors_count,
            latest_commit_date=snapshot.latest_commit_date,
            languages=snapshot.languages,
            topics=snapshot.topics,
            readme=readme,
        )

        # Step 4: Trend Agent (signal-based + LLM explanation)
        trend_result = await trend_agent.run(
            stars=snapshot.stars,
            forks=snapshot.forks,
            open_issues=snapshot.open_issues,
            commits_count=snapshot.commits_count,
            pull_requests_count=snapshot.pull_requests_count,
            releases_count=snapshot.releases_count,
            contributors_count=snapshot.contributors_count,
            latest_commit_date=snapshot.latest_commit_date,
        )

        # Step 5: AI Capability Agent
        ai_result = await ai_capability_agent.run(
            repo_name=repository.repo_name,
            description=repository.description,
            readme=readme,
            languages=snapshot.languages,
            topics=snapshot.topics,
        )

        # Step 6: Skill Gap Agent
        skill_result = await skill_gap_agent.run(
            repo_name=repository.repo_name,
            description=repository.description,
            readme=readme,
            languages=snapshot.languages,
            topics=snapshot.topics,
            open_issues=open_issues,
        )

        # Step 7: Contributor Recommendation Agent
        contributor_result = await contributor_agent.run(
            required_roles=skill_result.get("required_roles", []),
            languages=snapshot.languages,
            topics=snapshot.topics,
        )

        # Step 8: Report Generator - compose everything into DB records
        analysis_id = await report_generator.run(
            db=db,
            repository_id=repository.id,
            doc_result=doc_result,
            health_result=health_result,
            trend_result=trend_result,
            ai_result=ai_result,
            skill_result=skill_result,
            contributor_result=contributor_result,
        )

        return analysis_id


analysis_orchestrator = AnalysisOrchestrator()
