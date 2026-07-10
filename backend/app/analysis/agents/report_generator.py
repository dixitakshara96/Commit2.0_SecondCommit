from sqlalchemy.orm import Session

from app.analysis.crud import analysis_crud


class ReportGenerator:
    """
    Composes all agent results into a RepositoryAnalysis record with
    associated AnalysisFindings, RequiredRoles, and ContributorMatches.
    """

    async def run(
        self,
        db: Session,
        *,
        repository_id: int,
        doc_result: dict,
        health_result: dict,
        trend_result: dict,
        ai_result: dict,
        skill_result: dict,
        contributor_result: list[dict],
    ) -> int:
        # Calculate revival_score as weighted average
        doc_revive = doc_result.get("revive_score", 50)
        health_health = health_result.get("health_score", 50)
        trend_trend = trend_result.get("trend_score", 50)

        revival_score = int((doc_revive * 0.2) + (health_health * 0.4) + (trend_trend * 0.4))

        # Create the main analysis record
        analysis = analysis_crud.create_analysis(
            db=db,
            repository_id=repository_id,
            executive_summary=self._build_executive_summary(
                doc_result, health_result, trend_result, ai_result, skill_result,
            ),
            revival_score=revival_score,
            project_health_score=health_result.get("health_score", 50),
            documentation_score=doc_result.get("documentation_score", 50),
            technical_debt_score=health_result.get("technical_debt_score", 50),
            trend_score=trend_trend,
            safe_to_revive=revival_score >= 50,
            ai_effort_percentage=ai_result.get("ai_effort_percentage", 50.0),
            human_effort_percentage=ai_result.get("human_effort_percentage", 50.0),
            analysis_metadata={
                "doc_summary": doc_result.get("summary", ""),
                "health_summary": health_result.get("summary", ""),
                "trend_reasoning": trend_result.get("reasoning", ""),
                "ai_summary": ai_result.get("summary", ""),
                "skill_summary": skill_result.get("skill_summary", ""),
            },
        )

        # Create findings
        findings = []
        findings.append({
            "type": "feature",
            "severity": "low" if doc_result.get("documentation_score", 50) >= 60 else "high",
            "title": "Documentation Quality",
            "description": doc_result.get("summary", "Documentation analysis completed."),
            "recommendation": "Improve README with installation steps, usage examples, and contribution guidelines."
            if doc_result.get("documentation_score", 50) < 60 else "Documentation is adequate.",
        })

        findings.append({
            "type": "human_task",
            "severity": "medium" if health_result.get("risk_score", 50) >= 50 else "low",
            "title": "Code Health Assessment",
            "description": health_result.get("summary", "Code health analysis completed."),
            "recommendation": "Consider addressing technical debt and improving test coverage."
            if health_result.get("technical_debt_score", 50) > 50 else "Code health is acceptable.",
        })

        findings.append({
            "type": "issue",
            "severity": "critical" if trend_result.get("trend_score", 50) < 30 else "low",
            "title": "Project Trend Analysis",
            "description": trend_result.get("reasoning", "Trend analysis completed."),
            "recommendation": "Project needs active maintenance to stay relevant."
            if trend_result.get("trend_score", 50) < 40 else "Project shows good momentum.",
        })

        for ai_task in ai_result.get("ai_tasks", [])[:3]:
            findings.append({
                "type": "ai_task",
                "severity": "medium",
                "title": f"AI-Automatable: {ai_task.get('task', 'Task')}",
                "description": ai_task.get("reason", ""),
                "recommendation": "Consider using AI tools to automate this task.",
            })

        for human_task in ai_result.get("human_tasks", [])[:3]:
            findings.append({
                "type": "human_task",
                "severity": "high",
                "title": f"Requires Human: {human_task.get('task', 'Task')}",
                "description": human_task.get("reason", ""),
                "recommendation": "Allocate human resources for this task.",
            })

        analysis_crud.bulk_create_findings(db=db, analysis_id=analysis.id, findings=findings)

        # Create required roles
        roles = skill_result.get("required_roles", [])
        if roles:
            analysis_crud.bulk_create_roles(db=db, analysis_id=analysis.id, roles=roles)

        # Create contributor matches
        if contributor_result:
            analysis_crud.bulk_create_contributors(
                db=db,
                analysis_id=analysis.id,
                contributors=contributor_result,
            )

        return analysis.id

    def _build_executive_summary(
        self,
        doc_result: dict,
        health_result: dict,
        trend_result: dict,
        ai_result: dict,
        skill_result: dict,
    ) -> str:
        parts = []

        doc_score = doc_result.get("documentation_score", 50)
        parts.append(f"Documentation: {doc_score}/100.")

        health_score = health_result.get("health_score", 50)
        parts.append(f"Code Health: {health_score}/100.")

        trend_score = trend_result.get("trend_score", 50)
        parts.append(f"Trend: {trend_score}/100.")

        ai_pct = ai_result.get("ai_effort_percentage", 50)
        parts.append(f"AI Automation Potential: {ai_pct:.0f}%.")

        skill_summary = skill_result.get("skill_summary", "")
        if skill_summary:
            parts.append(f"Skills: {skill_summary}")

        return " | ".join(parts)


report_generator = ReportGenerator()
