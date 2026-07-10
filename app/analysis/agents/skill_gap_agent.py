from app.llm.ollama import OllamaProvider


class SkillGapAgent:
    """
    Analyzes repository languages, frameworks, issues, and README to
    identify the skill gaps and required roles needed to revive the project.
    """

    async def run(
        self,
        *,
        repo_name: str,
        description: str | None,
        readme: str,
        languages: list[str],
        topics: list[str],
        open_issues: list[dict],
    ) -> dict:
        # Extract issue labels and titles for skill inference
        issue_summary = ""
        if open_issues:
            labels_seen = set()
            for issue in open_issues[:15]:
                title = issue.get("title", "")
                labels = [l.get("name", "") for l in issue.get("labels", []) if isinstance(l, dict)]
                labels_seen.update(labels)
                issue_summary += f"- [{', '.join(labels)}] {title}\n"

        llm = OllamaProvider()
        try:
            prompt = f"""Repository: {repo_name}
Description: {description or "N/A"}
Languages: {', '.join(languages) if languages else "N/A"}
Topics: {', '.join(topics) if topics else "N/A"}

Open Issues Summary:
{issue_summary[:2000] or "No open issues."}

README (first 2000 chars):
{readme[:2000]}

Based on this repository's tech stack and open issues, what skills/roles
would be needed to revive and maintain this project?

Output ONLY a JSON object with:
- required_roles: array of {"role": "role name", "priority": 1-5, "reason": "why this role is needed"}
- frameworks: array of framework names detected
- skill_summary: one-paragraph summary of skill requirements

Be specific about the roles (e.g., "React Frontend Developer", "Python Backend Engineer",
"DevOps Engineer", "UI/UX Designer", "ML Engineer", etc.)
"""

            result = await llm.generate(
                prompt=prompt,
                system_prompt="You are a technical recruiter and skill analyst. Output ONLY valid JSON. No markdown, no code fences.",
                temperature=0.3,
                response_format={"type": "object"},
            )

            import json
            try:
                parsed = json.loads(result)
                return {
                    "required_roles": parsed.get("required_roles", []),
                    "frameworks": parsed.get("frameworks", []),
                    "skill_summary": parsed.get("skill_summary", ""),
                }
            except (json.JSONDecodeError, ValueError, TypeError):
                pass

        finally:
            await llm.close()

        return {
            "required_roles": [],
            "frameworks": [],
            "skill_summary": "Skill gap analysis completed.",
        }


skill_gap_agent = SkillGapAgent()
