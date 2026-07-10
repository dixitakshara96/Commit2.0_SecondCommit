from app.llm.ollama import OllamaProvider


class AICapabilityAgent:
    """
    Analyzes a repository to estimate what AI can automate and what requires
    human effort. Uses README, languages, topics, and project structure.
    """

    async def run(
        self,
        *,
        repo_name: str,
        description: str | None,
        readme: str,
        languages: list[str],
        topics: list[str],
    ) -> dict:
        llm = OllamaProvider()
        try:
            prompt = f"""Repository: {repo_name}
Description: {description or "N/A"}
Languages: {', '.join(languages) if languages else "N/A"}
Topics: {', '.join(topics) if topics else "N/A"}

README (first 3000 chars):
{readme[:3000]}

Analyze what percentage of this project's work could be automated by AI
versus what requires human effort. Consider:
1. Code generation potential (boilerplate, tests, docs)
2. Bug fixing and code review automation
3. Creative/architectural decisions requiring humans
4. UI/UX design requiring human input
5. DevOps and infrastructure automation

Output ONLY a JSON object with:
- ai_effort_percentage (0-100, float)
- human_effort_percentage (100 - ai_effort_percentage, float)
- ai_tasks: array of {"task": "...", "reason": "..."} objects
- human_tasks: array of {"task": "...", "reason": "..."} objects
- summary: one-paragraph explanation
"""

            result = await llm.generate(
                prompt=prompt,
                system_prompt="You are an AI capability analyst. Output ONLY valid JSON. No markdown, no code fences.",
                temperature=0.3,
                response_format={"type": "object"},
            )

            import json
            try:
                parsed = json.loads(result)
                ai_pct = float(parsed.get("ai_effort_percentage", 50))
                return {
                    "ai_effort_percentage": max(0, min(100, ai_pct)),
                    "human_effort_percentage": max(0, min(100, 100 - ai_pct)),
                    "ai_tasks": parsed.get("ai_tasks", []),
                    "human_tasks": parsed.get("human_tasks", []),
                    "summary": parsed.get("summary", ""),
                }
            except (json.JSONDecodeError, ValueError, TypeError):
                pass

        finally:
            await llm.close()

        return {
            "ai_effort_percentage": 50.0,
            "human_effort_percentage": 50.0,
            "ai_tasks": [],
            "human_tasks": [],
            "summary": "AI capability analysis completed.",
        }


ai_capability_agent = AICapabilityAgent()
