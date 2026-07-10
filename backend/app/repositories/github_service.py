import httpx

from app.core.config import settings


class GitHubService:

    def __init__(self) -> None:
        self.api_base = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "SecondCommit/1.0",
        }
        if settings.GITHUB_TOKEN:
            self.headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"

    async def search_repositories(
        self,
        *,
        query: str,
        sort: str = "stars",
        order: str = "desc",
        per_page: int = 10,
    ) -> list[dict]:
        """
        Search GitHub repositories with the given query.
        Returns raw API response items.
        """
        params = {
            "q": query,
            "sort": sort,
            "order": order,
            "per_page": min(per_page, 100),
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/search/repositories",
                headers=self.headers,
                params=params,
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("items", [])

    async def get_repository(self, *, owner: str, repo: str) -> dict:
        """Fetch a single repository's metadata."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/repos/{owner}/{repo}",
                headers=self.headers,
                timeout=30,
            )
            response.raise_for_status()
            return response.json()

    async def get_readme(self, *, owner: str, repo: str) -> str:
        """Fetch the README content as decoded text."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/repos/{owner}/{repo}/readme",
                headers={**self.headers, "Accept": "application/vnd.github.raw+json"},
                timeout=30,
            )
            if response.status_code == 404:
                return ""
            response.raise_for_status()
            return response.text

    async def get_languages(self, *, owner: str, repo: str) -> dict[str, int]:
        """Fetch language breakdown."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/repos/{owner}/{repo}/languages",
                headers=self.headers,
                timeout=30,
            )
            response.raise_for_status()
            return response.json()

    async def get_topics(self, *, owner: str, repo: str) -> list[str]:
        """Fetch repository topics."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/repos/{owner}/{repo}/topics",
                headers={**self.headers, "Accept": "application/vnd.github.mercy-preview+json"},
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("names", [])

    async def get_contributors(self, *, owner: str, repo: str, per_page: int = 30) -> list[dict]:
        """Fetch top contributors."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/repos/{owner}/{repo}/contributors",
                headers=self.headers,
                params={"per_page": per_page, "page": 1},
                timeout=30,
            )
            response.raise_for_status()
            return response.json()

    async def get_commits(self, *, owner: str, repo: str, per_page: int = 30) -> list[dict]:
        """Fetch recent commits."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/repos/{owner}/{repo}/commits",
                headers=self.headers,
                params={"per_page": per_page, "page": 1},
                timeout=30,
            )
            response.raise_for_status()
            return response.json()

    async def get_issues(self, *, owner: str, repo: str, state: str = "open", per_page: int = 30) -> list[dict]:
        """Fetch issues."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/repos/{owner}/{repo}/issues",
                headers=self.headers,
                params={"state": state, "per_page": per_page, "page": 1},
                timeout=30,
            )
            response.raise_for_status()
            return response.json()

    async def get_pull_requests(self, *, owner: str, repo: str, state: str = "open", per_page: int = 30) -> list[dict]:
        """Fetch pull requests."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/repos/{owner}/{repo}/pulls",
                headers=self.headers,
                params={"state": state, "per_page": per_page, "page": 1},
                timeout=30,
            )
            response.raise_for_status()
            return response.json()

    async def get_releases(self, *, owner: str, repo: str, per_page: int = 10) -> list[dict]:
        """Fetch releases."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/repos/{owner}/{repo}/releases",
                headers=self.headers,
                params={"per_page": per_page, "page": 1},
                timeout=30,
            )
            response.raise_for_status()
            return response.json()

    async def get_workflow_runs(self, *, owner: str, repo: str, per_page: int = 10) -> list[dict]:
        """Fetch recent workflow runs."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/repos/{owner}/{repo}/actions/runs",
                headers=self.headers,
                params={"per_page": per_page, "page": 1},
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("workflow_runs", [])

    async def search_users(
        self,
        *,
        query: str,
        sort: str = "repositories",
        per_page: int = 10,
    ) -> list[dict]:
        """Search GitHub users by skill/query."""
        params = {
            "q": query,
            "sort": sort,
            "per_page": min(per_page, 100),
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/search/users",
                headers=self.headers,
                params=params,
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("items", [])

    async def get_user_repos(self, *, username: str, per_page: int = 10) -> list[dict]:
        """Fetch a user's recent repositories."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/users/{username}/repos",
                headers=self.headers,
                params={"sort": "updated", "per_page": per_page, "page": 1},
                timeout=30,
            )
            response.raise_for_status()
            return response.json()

    async def get_user_events(self, *, username: str, per_page: int = 10) -> list[dict]:
        """Fetch a user's recent public events (for activity scoring)."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/users/{username}/events",
                headers=self.headers,
                params={"per_page": per_page, "page": 1},
                timeout=30,
            )
            response.raise_for_status()
            return response.json()


github_service = GitHubService()
