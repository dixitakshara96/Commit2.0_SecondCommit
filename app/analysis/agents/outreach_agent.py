from app.llm.ollama import OllamaProvider


class OutreachAgent:
    """
    Generates personalized outreach messages for potential contributors
    using the LLM. Each message is tailored to the contributor's skills,
    recent work, and the project being revived.
    """

    async def run(
        self,
        *,
        project_name: str,
        project_description: str,
        project_languages: list[str],
        project_topics: list[str],
        contributors: list[dict],
    ) -> list[dict]:
        """
        Generate personalized outreach messages for each contributor.

        Each contributor dict should contain:
            - github_username: str
            - match_score: float
            - matched_skills: list[str]
            - recent_repositories: list[dict]  (optional, with name/description/language/stars)
            - recommendation_reason: str

        Returns list of dicts with:
            - recipient: str
            - type: str  ("contributor")
            - generated_message: str
        """
        llm = OllamaProvider()
        messages = []

        try:
            for contributor in contributors:
                username = contributor.get("github_username", "unknown")
                matched_skills = contributor.get("matched_skills", [])
                reason = contributor.get("recommendation_reason", "")
                recent_repos = contributor.get("recent_repositories", [])

                # Build a brief summary of the contributor's recent work
                repo_summary = ""
                if recent_repos:
                    repo_lines = []
                    for r in recent_repos[:3]:
                        name = r.get("name", "")
                        desc = r.get("description", "")
                        lang = r.get("language", "")
                        stars = r.get("stars", 0)
                        if name:
                            repo_lines.append(
                                f"- {name}: {desc or 'No description'} "
                                f"({lang or 'Unknown'}, {stars} stars)"
                            )
                    if repo_lines:
                        repo_summary = "Recent repositories:\n" + "\n".join(repo_lines)

                prompt = f"""Write a friendly, professional outreach message to a GitHub user inviting them to contribute to an open-source revival project.

Recipient: {username}
Their matched skills: {', '.join(matched_skills) if matched_skills else 'General development'}
Recommendation reason: {reason}

Project to be revived:
  Name: {project_name}
  Description: {project_description or 'No description available'}
  Languages: {', '.join(project_languages) if project_languages else 'Various'}
  Topics: {', '.join(project_topics) if project_topics else 'Open source'}

{repo_summary}

Guidelines:
- Be personal and specific — reference the contributor's skills and recent work
- Explain why the project revival is exciting and how their skills align
- Keep it to 3-4 sentences max
- Use a warm but professional tone
- Do NOT include placeholders like [your name] or [company]
- Sign off as "The Second Commit Team"
- Do NOT include a subject line — just the message body

Output ONLY the message text, nothing else."""

                result = await llm.generate(
                    prompt=prompt,
                    system_prompt=(
                        "You are a friendly open-source community manager composing "
                        "personalized outreach messages. Output ONLY the message text."
                    ),
                    temperature=0.7,
                )

                # Clean up the result — remove any markdown code fences if present
                clean_message = result.strip()
                if clean_message.startswith("```"):
                    # Remove markdown code fences if LLM wraps output
                    lines = clean_message.split("\n")
                    lines = [l for l in lines if not l.strip().startswith("```")]
                    clean_message = "\n".join(lines).strip()

                messages.append({
                    "recipient": username,
                    "type": "contributor",
                    "generated_message": clean_message,
                })

        finally:
            await llm.close()

        return messages


outreach_agent = OutreachAgent()
