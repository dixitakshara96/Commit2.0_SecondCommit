from datetime import datetime, timezone

from app.llm.ollama import OllamaProvider


class TrendAgent:
    """
    Determines if a repository is trending based on GitHub signals:
    recent commits, issue activity, PR activity, release cadence,
    stars, repository age. LLM is used only to explain the reasoning.
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
        created_at: datetime | None = None,
    ) -> dict:
        now = datetime.now(timezone.utc)

        days_since_last_commit = 9999
        if latest_commit_date:
            if latest_commit_date.tzinfo is None:
                latest_commit_date = latest_commit_date.replace(tzinfo=timezone.utc)
            days_since_last_commit = (now - latest_commit_date).days

        repo_age_days = 365
        if created_at:
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            repo_age_days = max(1, (now - created_at).days)

        # ---- Trending Score (0-100) ----
        score = 30  # baseline

        # Recent activity is the strongest signal
        if days_since_last_commit < 7:
            score += 25
        elif days_since_last_commit < 30:
            score += 15
        elif days_since_last_commit < 90:
            score += 5
        else:
            score -= 10

        # Issue/PR activity
        if open_issues > 5:
            score += 5  # community interest
        if pull_requests_count > 5:
            score += 10  # active contributions

        # Stars relative to age
        stars_per_year = (stars / repo_age_days) * 365
        if stars_per_year > 1000:
            score += 25
        elif stars_per_year > 100:
            score += 15
        elif stars_per_year > 10:
            score += 5

        # Release cadence
        releases_per_year = (releases_count / repo_age_days) * 365
        if releases_per_year > 12:
            score += 10  # monthly+ releases
        elif releases_per_year > 4:
            score += 5   # quarterly releases

        # Contributor count
        if contributors_count > 20:
            score += 10
        elif contributors_count > 5:
            score += 5

        score = max(0, min(100, score))

        # LLM explanation
        llm = OllamaProvider()
        reasoning = ""
        try:
            prompt = f"""Repository Activity Signals:
- Stars: {stars} | Forks: {forks}
- Open Issues: {open_issues}
- Commits: {commits_count} | PRs: {pull_requests_count}
- Releases: {releases_count} | Contributors: {contributors_count}
- Days Since Last Commit: {days_since_last_commit}
- Repository Age: {repo_age_days} days
- Trending Score: {score}/100

Is this repository trending? Explain the reasoning in 2-3 sentences.
"""
            result = await llm.generate(
                prompt=prompt,
                system_prompt="You are a trend analyst. Be concise and data-driven.",
                temperature=0.3,
            )
            reasoning = result[:500]
        finally:
            await llm.close()

        return {
            "trend_score": score,
            "reasoning": reasoning,
        }


trend_agent = TrendAgent()
