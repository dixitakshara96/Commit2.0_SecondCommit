from datetime import datetime

from pydantic import BaseModel, Field


# ──────────────────────────────────────────────
#  Startup Dashboard
# ──────────────────────────────────────────────


class StartupSummaryMetrics(BaseModel):
    total_ideas_submitted: int = Field(
        description="Total number of ideas the startup has ever submitted.",
    )
    active_analyses_count: int = Field(
        description="Number of analyses currently in ANALYZED status.",
    )
    contributors_contacted: int = Field(
        description="Total contributors reached via outreach messages.",
    )
    pending_responses_count: int = Field(
        description="Number of outreach messages awaiting a response.",
    )


class StartupAdvancedAnalytics(BaseModel):
    idea_revival_score: float = Field(
        description="Weighted composite score (0–100) measuring idea-to-revival efficacy.",
    )
    response_rate_percentage: float = Field(
        description="Percentage of contacted contributors that received follow-up.",
    )
    analysis_velocity: float = Field(
        description="Average number of analyses executed per 7-day window.",
    )
    outreach_conversion_index: float = Field(
        description="Ratio of contributors contacted per analysis (contacts / analyses).",
    )


class StartupDashboardResponse(BaseModel):
    summary_metrics: StartupSummaryMetrics
    advanced_analytics: StartupAdvancedAnalytics


# ──────────────────────────────────────────────
#  Freelancer Dashboard
# ──────────────────────────────────────────────


class FreelancerCollaborationOverview(BaseModel):
    total_invitations_received: int = Field(
        description="Total outreach messages sent to this freelancer.",
    )
    accepted_collaborations_count: int = Field(
        description="Number of collaborations the freelancer accepted.",
    )
    pending_invitations_count: int = Field(
        description="Number of invitations awaiting a decision.",
    )


class FreelancerSmartAnalytics(BaseModel):
    profile_matching_score: float = Field(
        description="Match quality (0–100) based on skills vs project requirements.",
    )
    invitation_acceptance_rate: float = Field(
        description="Percentage of invitations accepted out of total received.",
    )
    market_demand_index: str = Field(
        description="Current market demand level: 'High', 'Medium', or 'Low'.",
    )
    avg_collaboration_fit_rating: float = Field(
        description="Average match score of collaborations the freelancer was invited to.",
    )


class RecommendedProject(BaseModel):
    project_id: int = Field(
        description="ID of the analysis/project suggested for this freelancer.",
    )
    title: str = Field(
        description="Name of the project / repository.",
    )
    startup_name: str = Field(
        description="Name of the startup that owns the project.",
    )
    matching_score: float = Field(
        description="How well the freelancer's skills match this project.",
    )
    matching_reasons: list[str] = Field(
        description="Human-readable reasons why this project is a good fit.",
    )


class FreelancerDashboardResponse(BaseModel):
    collaboration_overview: FreelancerCollaborationOverview
    smart_analytics: FreelancerSmartAnalytics
    recommended_projects: list[RecommendedProject]


# ──────────────────────────────────────────────
#  Admin Dashboard
# ──────────────────────────────────────────────


class AdminSystemAggregates(BaseModel):
    total_startup_users: int = Field(
        description="Total registered users with role = 'startup'.",
    )
    total_freelancer_users: int = Field(
        description="Total registered users with role = 'freelancer'.",
    )
    total_analyses_executed: int = Field(
        description="Total count of repository analyses across all users.",
    )


class AdminEcosystemHealth(BaseModel):
    freelancer_to_startup_ratio: float = Field(
        description="Number of freelancers per startup (0 if no startups).",
    )
    platform_activity_rate_7d: float = Field(
        description="Percentage of users who performed an action in the last 7 days.",
    )
    unverified_users_count: int = Field(
        description="Number of users who have not verified their email.",
    )
    avg_analyses_per_startup: float = Field(
        description="Average number of analyses executed per startup user.",
    )


class AdminDashboardResponse(BaseModel):
    system_aggregates: AdminSystemAggregates
    ecosystem_health: AdminEcosystemHealth
