import math

from app.llm.ollama import OllamaProvider
from app.repositories.github_service import github_service


class ContributorRecommendationAgent:
    """
    Searches GitHub for potential contributors matching the required skills.
    Uses GitHub Search Users API for deterministic results, then LLM for explanation.
    """

    async def run(
        self,
        *,
        required_roles: list[dict],
        languages: list[str],
        topics: list[str],
    ) -> list[dict]:
        # Build search queries from required roles
        search_queries = set()

        for role in required_roles:
            role_name = role.get("role", "")
            query_parts = []

            if "frontend" in role_name.lower() or "react" in role_name.lower():
                query_parts.extend(["react", "javascript", "typescript", "frontend"])
            elif "backend" in role_name.lower():
                query_parts.extend(["backend", "api", "python", "go", "rust"])
            elif "devops" in role_name.lower() or "infra" in role_name.lower():
                query_parts.extend(["devops", "docker", "kubernetes", "aws"])
            elif "ml" in role_name.lower() or "ai" in role_name.lower() or "data" in role_name.lower():
                query_parts.extend(["machine-learning", "python", "data-science"])
            elif "ui" in role_name.lower() or "ux" in role_name.lower() or "design" in role_name.lower():
                query_parts.extend(["ui", "ux", "design", "css", "figma"])
            elif "mobile" in role_name.lower():
                query_parts.extend(["mobile", "ios", "android", "react-native", "flutter"])
            elif "fullstack" in role_name.lower() or "full" in role_name.lower():
                query_parts.extend(["fullstack", "react", "python", "nodejs"])
            else:
                # Fall back to languages
                query_parts.extend([w for w in role_name.lower().split() if len(w) > 2])

            if query_parts:
                search_queries.add(" ".join(query_parts[:3]))

        # Also add queries from languages
        for lang in languages[:3]:
            search_queries.add(lang)

        # Search GitHub for each query
        seen_usernames = set()
        candidates = []

        for query in list(search_queries)[:5]:  # Max 5 queries
            try:
                users = await github_service.search_users(
                    query=f"{query} repos:>5 followers:>5",
                    sort="repositories",
                    per_page=5,
                )
                for user in users:
                    username = user.get("login", "")
                    if username and username not in seen_usernames:
                        seen_usernames.add(username)
                        candidates.append(user)
                        if len(candidates) >= 15:
                            break
            except Exception:
                continue
            if len(candidates) >= 15:
                break

        # Fetch additional data for top candidates and score them
        scored = []
        for user in candidates[:10]:
            username = user.get("login", "")
            score = 0.0

            # Base score from search rank
            score += max(0, 50 - len(scored) * 5)

            # Get user's recent repos for activity score
            try:
                repos = await github_service.get_user_repos(username=username, per_page=5)
                recent_repos = []
                for repo in repos:
                    recent_repos.append({
                        "name": repo.get("name", ""),
                        "description": repo.get("description", ""),
                        "language": repo.get("language", ""),
                        "stars": repo.get("stargazers_count", 0),
                        "url": repo.get("html_url", ""),
                    })

                # Activity score based on recent repos
                activity_score = min(100, len(repos) * 20)
                if any(r.get("stars", 0) > 50 for r in recent_repos):
                    activity_score += 10

                score = min(100, score + activity_score * 0.5)

                scored.append({
                    "github_username": username,
                    "github_profile": user.get("html_url", f"https://github.com/{username}"),
                    "avatar_url": user.get("avatar_url"),
                    "match_score": round(score, 1),
                    "recent_activity_score": round(activity_score, 1),
                    "matched_skills": list({lang for lang in languages if lang.lower() in username.lower()}) or languages[:2],
                    "recent_repositories": recent_repos,
                })
            except Exception:
                scored.append({
                    "github_username": username,
                    "github_profile": f"https://github.com/{username}",
                    "avatar_url": user.get("avatar_url"),
                    "match_score": 30.0,
                    "recent_activity_score": 30.0,
                    "matched_skills": [],
                    "recent_repositories": [],
                })

        # Sort by match score
        scored.sort(key=lambda x: x["match_score"], reverse=True)

        # Generate LLM explanations for top 5
        llm = OllamaProvider()
        try:
            top_names = [c["github_username"] for c in scored[:5]]
            prompt = f"""Given these GitHub users found as potential contributors:

{chr(10).join(f'- {name}' for name in top_names)}

For each user, provide a one-sentence recommendation explaining why they
would be a good contributor for a project using these languages: {', '.join(languages)}
and these topics: {', '.join(topics)}.

Output ONLY a JSON object mapping username to recommendation string.
"""

            result = await llm.generate(
                prompt=prompt,
                system_prompt="You are a contributor matching expert. Output ONLY valid JSON.",
                temperature=0.3,
                response_format={"type": "object"},
            )

            import json
            try:
                explanations = json.loads(result)
                for c in scored:
                    c["recommendation_reason"] = explanations.get(c["github_username"], "")

            except (json.JSONDecodeError, ValueError, TypeError):
                pass

        finally:
            await llm.close()

        # Ensure all have recommendation_reason
        for c in scored:
            if not c.get("recommendation_reason"):
                c["recommendation_reason"] = f"Matched for {', '.join(c['matched_skills'][:2])}."

        return scored[:8]


contributor_agent = ContributorRecommendationAgent()
