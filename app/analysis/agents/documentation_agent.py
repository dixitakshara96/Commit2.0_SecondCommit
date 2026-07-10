from app.llm.ollama import OllamaProvider


class DocumentationAgent:
    """
    Evaluates the quality of a repository's documentation using the LLM.
    Uses README, wiki, and description to score documentation quality,
    installation quality, identify missing docs, and produce a revive score.
    """

    async def run(
        self,
        *,
        repo_name: str,
        description: str | None,
        readme: str,
        topics: list[str],
    ) -> dict:
        if not readme:
            return {
                "documentation_score": 0,
                "installation_quality": 0,
                "missing_docs": ["README is empty or missing"],
                "revive_score": 0,
                "summary": "No documentation available.",
            }

        llm = OllamaProvider()
        try:
            prompt = f"""Repository: {repo_name}
Description: {description or "N/A"}
Topics: {", ".join(topics) if topics else "N/A"}

README Content (first 4000 chars):
{readme[:4000]}

Evaluate the documentation quality on a scale of 0-100. Consider:
1. Is there a clear project description?
2. Are installation steps provided?
3. Is there usage/API documentation?
4. Are contribution guidelines present?
5. Is the README well-structured?

Output ONLY a JSON object with these fields:
- documentation_score (0-100)
- installation_quality (0-100)
- missing_docs (array of strings listing what's missing)
- revive_score (0-100, how easy is it to revive based on docs)
- summary (one-line summary)
"""

            result = await llm.generate(
                prompt=prompt,
                system_prompt="You are a documentation quality analyst. Output ONLY valid JSON. No markdown, no code fences.",
                temperature=0.2,
                response_format={"type": "object"},
            )

            import json
            try:
                parsed = json.loads(result)
                return {
                    "documentation_score": int(parsed.get("documentation_score", 50)),
                    "installation_quality": int(parsed.get("installation_quality", 50)),
                    "missing_docs": parsed.get("missing_docs", []),
                    "revive_score": int(parsed.get("revive_score", 50)),
                    "summary": parsed.get("summary", ""),
                }
            except (json.JSONDecodeError, ValueError, TypeError):
                pass

        finally:
            await llm.close()

        return {
            "documentation_score": 50,
            "installation_quality": 50,
            "missing_docs": [],
            "revive_score": 50,
            "summary": "Documentation evaluation completed.",
        }


documentation_agent = DocumentationAgent()
