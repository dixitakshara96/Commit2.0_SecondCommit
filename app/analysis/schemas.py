from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AnalysisRunRequest(BaseModel):
    repository_id: int = Field(
        description="ID of the selected repository to analyze.",
    )


class AnalysisRunResponse(BaseModel):
    analysis_id: int = Field(
        description="ID of the created analysis report.",
    )


class FindingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    analysis_id: int
    type: str
    severity: str
    title: str
    description: str
    recommendation: str


class RequiredRoleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    analysis_id: int
    role: str
    priority: int
    reason: str


class ContributorMatchRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    analysis_id: int
    github_username: str
    github_profile: str
    avatar_url: str | None
    match_score: float
    recent_activity_score: float
    matched_skills: list
    recent_repositories: list
    recommendation_reason: str


class ContributorRecommendRequest(BaseModel):
    analysis_id: int = Field(
        description="ID of the analysis to recommend contributors for.",
    )


class ContributorRecommendResponse(BaseModel):
    recommendation_id: int = Field(
        description="ID of the analysis these contributors are linked to.",
    )
    contributors: list[ContributorMatchRead] = Field(
        description="List of recommended contributors.",
    )


class OutreachGenerateRequest(BaseModel):
    analysis_id: int = Field(
        description="ID of the analysis to generate outreach for.",
    )
    contributor_ids: list[int] = Field(
        description="IDs of the contributor matches to message.",
    )


class OutreachMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    analysis_id: int
    recipient: str
    type: str
    generated_message: str
    created_at: datetime


class OutreachGenerateResponse(BaseModel):
    analysis_id: int
    messages: list[OutreachMessageRead] = Field(
        description="Generated outreach messages.",
    )


class AnalysisRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    repository_id: int
    executive_summary: str
    revival_score: int
    project_health_score: int
    documentation_score: int
    technical_debt_score: int
    trend_score: int
    safe_to_revive: bool
    ai_effort_percentage: float
    human_effort_percentage: float
    analysis_metadata: dict
    created_at: datetime

    findings: list[FindingRead] = []
    required_roles: list[RequiredRoleRead] = []
    contributor_matches: list[ContributorMatchRead] = []
