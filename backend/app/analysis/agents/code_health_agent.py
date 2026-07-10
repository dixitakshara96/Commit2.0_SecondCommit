from datetime import datetime, timezone

from app.llm.ollama import OllamaProvider


class CodeHealthAgent:
    """
    Calculates code health metrics using rule-based formulas from GitHub metadata.
    Uses LLM only for the final summary.
    """

    async def run(
        self,
        *,
        stars: int,
        forks: int,
        open_issues: int,
        commits_count: int,
        pull_requests_count: int,
        releases_count: int,
        contributors_count: int,
        latest_commit_date: datetime,
        languages: list[str],
        topics: list[str],
        readme: str | None = None,
    ) -> dict:
        now = datetime.now(timezone.utc)

        # Calculate days since last commit
        days_since_last_commit = 9999
        if latest_commit_date:
            if latest_commit_date.tzinfo is None:
                latest_commit_date = latest_commit_date.replace(tzinfo=timezone.utc)
            days_since_last_commit = (now - latest_commit_date).days

        # ---- Technical Debt Score (0-100, lower is better) ----
        # Older projects with few commits relative to age have more debt
        tech_debt = 50  # baseline
        if days_since_last_commit > 365:
            tech_debt += 20
        elif days_since_last_commit > 180:
            tech_debt += 10
        elif days_since_last_commit < 30:
            tech_debt -= 10

        if commits_count < 10:
            tech_debt += 15
        elif commits_count > 100:
            tech_debt -= 10

        if releases_count == 0:
            tech_debt += 10
        elif releases_count > 5:
            tech_debt -= 5

        tech_debt = max(0, min(100, tech_debt))

        # ---- Maintenance Score (0-100, higher is better) ----
        maintenance = 50  # baseline
        if days_since_last_commit < 30:
            maintenance += 20
        elif days_since_last_commit < 90:
            maintenance += 10
        elif days_since_last_commit > 365:
            maintenance -= 20

        if pull_requests_count > 10:
            maintenance += 10
        if contributors_count > 5:
            maintenance += 10
        if releases_count > 3:
            maintenance += 10
        if commits_count > 50:
            maintenance += 10

        maintenance = max(0, min(100, maintenance))

        # ---- Risk Score (0-100, lower is better) ----
        risk = 30  # baseline
        if days_since_last_commit > 365:
            risk += 25
        elif days_since_last_commit > 180:
            risk += 15
        if stars < 10:
            risk += 10
        if forks < 5:
            risk += 5
        if commits_count < 20:
            risk += 10
        if contributors_count == 0:
            risk += 10

        risk = max(0, min(100, risk))

        # ---- Health Score (0-100, higher is better) ----
        health = (
            (maintenance * 0.3) +
            ((100 - tech_debt) * 0.3) +
            ((100 - risk) * 0.4)
        )
        health = max(0, min(100, int(health)))

        # LLM summary
        llm = OllamaProvider()
        summary = ""
        try:
            prompt = f"""Repository Stats:
- Stars: {stars}
- Forks: {forks}
- Open Issues: {open_issues}
- Total Commits: {commits_count}
- Pull Requests: {pull_requests_count}
- Releases: {releases_count}
- Contributors: {contributors_count}
- Days Since Last Commit: {days_since_last_commit}
- Languages: {', '.join(languages) if languages else 'N/A'}
- Topics: {', '.join(topics) if topics else 'N/A'}
- Maintenance Score: {maintenance}/100
- Technical Debt: {tech_debt}/100
- Risk Score: {risk}/100
- Health Score: {health}/100

Provide a one-paragraph summary of this repository's code health.
"""
            result = await llm.generate(
                prompt=prompt,
                system_prompt="You are a code health analyst. Provide a concise, data-driven summary.",
                temperature=0.3,
            )
            summary = result[:500]
        finally:
            await llm.close()

        return {
            "technical_debt_score": tech_debt,
            "maintenance_score": maintenance,
            "risk_score": risk,
            "health_score": health,
            "summary": summary,
        }


code_health_agent = CodeHealthAgent()
