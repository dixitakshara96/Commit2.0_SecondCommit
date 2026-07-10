// ── ENUMS ──
export type UserRole = 'startup' | 'freelancer' | 'admin'

export type IdeaStatus = 'draft' | 'refined' | 'approved' | 'analyzed' | 'completed'

export type ResponseStatus = 'pending' | 'accepted' | 'declined'

export type FindingType = 'issue' | 'feature' | 'ai_task' | 'human_task' | 'risk'

export type Severity = 'low' | 'medium' | 'high' | 'critical'

// ── AUTH ──
export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  github_username: string | null
  is_verified: boolean
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  tokens: TokenPair
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role: UserRole
  github_username?: string
}

// ── IDEAS ──
export interface IdeaSubmit {
  original_prompt: string
  voice_transcript?: string
}

export interface IdeaUpdate {
  original_prompt?: string
  voice_transcript?: string
}

export interface IdeaRead {
  id: number
  owner_id: number
  original_prompt: string
  voice_transcript: string | null
  refined_prompt: string | null
  status: string
  created_at: string
}

export interface IdeaRefineResponse {
  refined_prompt: string
}

// ── REPOSITORIES ──
export interface RepositoryRead {
  id: number
  idea_id: number
  github_repo_id: number
  owner: string
  repo_name: string
  url: string
  description: string | null
  stars: number
  forks: number
  language: string | null
  license: string | null
  last_commit: string | null
  is_selected: boolean
  created_at: string
}

export interface RepositorySearchRequest {
  idea_id: number
}

export interface RepositorySelectRequest {
  repository_id: number
}

// ── ANALYSIS ──
export interface AnalysisRunRequest {
  repository_id: number
}

export interface AnalysisRunResponse {
  analysis_id: number
}

export interface FindingRead {
  id: number
  analysis_id: number
  type: string
  severity: string
  title: string
  description: string
  recommendation: string
}

export interface RequiredRoleRead {
  id: number
  analysis_id: number
  role: string
  priority: number
  reason: string
}

export interface ContributorMatchRead {
  id: number
  analysis_id: number
  github_username: string
  github_profile: string
  avatar_url: string | null
  match_score: number
  recent_activity_score: number
  matched_skills: string[]
  recent_repositories: string[]
  recommendation_reason: string
}

export interface AnalysisRead {
  id: number
  repository_id: number
  executive_summary: string
  revival_score: number
  project_health_score: number
  documentation_score: number
  technical_debt_score: number
  trend_score: number
  safe_to_revive: boolean
  ai_effort_percentage: number
  human_effort_percentage: number
  analysis_metadata: Record<string, unknown>
  created_at: string
  findings: FindingRead[]
  required_roles: RequiredRoleRead[]
  contributor_matches: ContributorMatchRead[]
}

// ── DASHBOARD ──
export interface StartupSummaryMetrics {
  total_ideas_submitted: number
  active_analyses_count: number
  contributors_contacted: number
  pending_responses_count: number
}

export interface StartupAdvancedAnalytics {
  idea_revival_score: number
  response_rate_percentage: number
  analysis_velocity: number
  outreach_conversion_index: number
}

export interface StartupDashboardResponse {
  summary_metrics: StartupSummaryMetrics
  advanced_analytics: StartupAdvancedAnalytics
}

export interface FreelancerCollaborationOverview {
  total_invitations_received: number
  accepted_collaborations_count: number
  pending_invitations_count: number
}

export interface FreelancerSmartAnalytics {
  profile_matching_score: number
  invitation_acceptance_rate: number
  market_demand_index: string
  avg_collaboration_fit_rating: number
}

export interface RecommendedProject {
  project_id: number
  title: string
  startup_name: string
  matching_score: number
  matching_reasons: string[]
}

export interface FreelancerDashboardResponse {
  collaboration_overview: FreelancerCollaborationOverview
  smart_analytics: FreelancerSmartAnalytics
  recommended_projects: RecommendedProject[]
}

export interface AdminSystemAggregates {
  total_startup_users: number
  total_freelancer_users: number
  total_analyses_executed: number
}

export interface AdminEcosystemHealth {
  freelancer_to_startup_ratio: number
  platform_activity_rate_7d: number
  unverified_users_count: number
  avg_analyses_per_startup: number
}

export interface AdminDashboardResponse {
  system_aggregates: AdminSystemAggregates
  ecosystem_health: AdminEcosystemHealth
}

// ── OUTREACH ──
export interface OutreachGenerateRequest {
  analysis_id: number
  contributor_ids: number[]
}

export interface OutreachMessageRead {
  id: number
  analysis_id: number
  recipient: string
  type: string
  generated_message: string
  created_at: string
}

export interface OutreachGenerateResponse {
  analysis_id: number
  messages: OutreachMessageRead[]
}

export interface ContributorRecommendRequest {
  analysis_id: number
}

export interface ContributorRecommendResponse {
  recommendation_id: number
  contributors: ContributorMatchRead[]
}

// ── RESPONSE TRACKER ──
export interface ResponseTrackerRead {
  id: number
  analysis_id: number
  contributor_match_id: number | null
  outreach_message_id: number | null
  status: string
  responded_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ResponseTrackerSummary {
  total_sent: number
  pending_count: number
  accepted_count: number
  declined_count: number
  response_rate: number
  acceptance_rate: number
}

// ── FREELANCER PROFILE ──
export interface FreelancerProfile {
  user_id: number
  name: string
  email: string
  github_username: string | null
  is_verified: boolean
  profile: {
    bio: string | null
    experience_level: string | null
    portfolio: string | null
    linkedin: string | null
    skills: string[]
    tech_stack: string[]
    priority_score: number
  }
}

export interface ProfileUpdateRequest {
  bio?: string
  experience_level?: string
  portfolio?: string
  linkedin?: string
}

// ── ADMIN ──
export interface AdminUser {
  id: number
  name: string
  email: string
  role: string
  github_username: string | null
  is_verified: boolean
  created_at: string
}

export interface AdminIdea {
  id: number
  owner_id: number
  original_prompt: string
  status: string
  has_refined_prompt: boolean
  created_at: string
}

export interface AdminAnalytics {
  users: {
    total_startup_users: number
    total_freelancer_users: number
    total_analyses_executed: number
  }
  ideas: { total: number }
  analyses: { total: number }
  contributor_matches: { total: number }
  outreach: { total_sent: number }
  responses: {
    total: number
    accepted: number
    acceptance_rate: number
  }
}
