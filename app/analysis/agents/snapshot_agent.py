import asyncio
from datetime import datetime

from sqlalchemy.orm import Session

from app.db.models.github_repository_snapshot import GitHubRepositorySnapshot
from app.repositories.github_service import github_service


class SnapshotAgent:
    """
    Fetches comprehensive repository data from GitHub APIs and stores
    it in GitHubRepositorySnapshot. All subsequent agents read from
    this snapshot rather than calling GitHub APIs again.
    """

    async def run(
        self,
        db: Session,
        *,
        owner: str,
        repo_name: str,
        repository_id: int,
    ) -> GitHubRepositorySnapshot:
        # Fetch data from GitHub APIs in parallel
        import asyncio

        repo_data_task = github_service.get_repository(owner=owner, repo=repo_name)
        readme_task = github_service.get_readme(owner=owner, repo=repo_name)
        languages_task = github_service.get_languages(owner=owner, repo=repo_name)
        topics_task = github_service.get_topics(owner=owner, repo=repo_name)
        contributors_task = github_service.get_contributors(owner=owner, repo=repo_name, per_page=30)
        commits_task = github_service.get_commits(owner=owner, repo=repo_name, per_page=30)
        issues_task = github_service.get_issues(owner=owner, repo=repo_name, state="open", per_page=30)
        issues_task = github_service.get_issues(owner=owner, repo=repo_name, state="open", per_page=30)
        pulls_task = github_service.get_pull_requests(owner=owner, repo=repo_name, state="open", per_page=30)
        releases_task = github_service.get_releases(owner=owner, repo=repo_name, per_page=10)

        (
            repo_data,
            readme,
            languages,
            topics,
            contributors,
            commits,
            issues,
            pulls,
            releases,
        ) = await asyncio.gather(
            repo_data_task,
            readme_task,
            languages_task,
            topics_task,
            contributors_task,
            commits_task,
            issues_task,
            pulls_task,
            releases_task,
        )

        # Build raw snapshot
        raw_snapshot = {
            "readme": readme,
            "issues": issues,
            "pull_requests": pulls,
            "releases": releases,
        }

        # Determine latest commit info
        latest_commit_sha = ""
        latest_commit_date = datetime.utcnow()
        if commits:
            latest_commit_sha = commits[0].get("sha", "")
            commit_date = commits[0].get("commit", {}).get("committer", {}).get("date")
            if commit_date:
                try:
                    latest_commit_date = datetime.fromisoformat(commit_date.replace("Z", "+00:00"))
                except (ValueError, TypeError):
                    pass

        # Create or update the snapshot
        existing = db.query(GitHubRepositorySnapshot).filter(
            GitHubRepositorySnapshot.repository_id == repository_id
        ).first()

        if existing:
            snapshot = existing
        else:
            snapshot = GitHubRepositorySnapshot(repository_id=repository_id)

        snapshot.default_branch = repo_data.get("default_branch", "main")
        snapshot.latest_commit_sha = latest_commit_sha
        snapshot.latest_commit_date = latest_commit_date
        snapshot.stars = repo_data.get("stargazers_count", 0)
        snapshot.forks = repo_data.get("forks_count", 0)
        snapshot.open_issues = repo_data.get("open_issues_count", 0)
        snapshot.watchers = repo_data.get("subscribers_count", 0)
        snapshot.contributors_count = len(contributors)
        snapshot.commits_count = len(commits)
        snapshot.pull_requests_count = len(pulls)
        snapshot.releases_count = len(releases)
        snapshot.languages = list(languages.keys()) if isinstance(languages, dict) else list(languages)
        snapshot.topics = topics
        snapshot.raw_snapshot = raw_snapshot
        snapshot.snapshot_version = f"v1-{datetime.utcnow().isoformat()}"
        snapshot.fetched_at = datetime.utcnow()

        if not existing:
            db.add(snapshot)

        db.commit()
        db.refresh(snapshot)

        return snapshot


snapshot_agent = SnapshotAgent()
