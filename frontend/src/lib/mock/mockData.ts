import type {
  RepositoryRead,
  AnalysisRead,
  FindingRead,
  RequiredRoleRead,
  ContributorMatchRead,
  OutreachMessageRead,
} from '@/lib/types'

// ──────────────────────────────────────────────
// MOCK REFINEMENT (concise, 3-line output)
// ──────────────────────────────────────────────

export const MOCK_REFINED_PROMPTS: Record<string, string> = {
  default:
    'An AI-powered code review assistant that integrates with GitHub PRs to automatically detect bugs, security vulnerabilities, and style issues. Uses advanced ML models for real-time analysis and provides actionable fix suggestions with code examples. Designed for development teams to accelerate code review cycles and improve code quality.',
}

// ──────────────────────────────────────────────
// MOCK REPOSITORIES
// ──────────────────────────────────────────────

export const MOCK_REPOSITORIES: RepositoryRead[] = [
  {
    id: 101,
    idea_id: 1,
    github_repo_id: 45281394,
    owner: 'ml-toolkit',
    repo_name: 'ml-pipeline-orchestrator',
    url: 'https://github.com/ml-toolkit/ml-pipeline-orchestrator',
    description:
      'A visual ML pipeline builder with pre-built components for data preprocessing, model training, and deployment. Supports TensorFlow, PyTorch, and scikit-learn.',
    stars: 342,
    forks: 56,
    language: 'Python',
    license: 'Apache 2.0',
    last_commit: '2025-05-28T14:32:00Z',
    is_selected: false,
    created_at: '2025-05-01T10:00:00Z',
  },
  {
    id: 102,
    idea_id: 1,
    github_repo_id: 58231947,
    owner: 'ui-labs',
    repo_name: 'react-admin-dashboard',
    url: 'https://github.com/ui-labs/react-admin-dashboard',
    description:
      'Enterprise-grade React admin dashboard with built-in theming, data tables, charts, and form builders. Includes role-based access control and real-time updates.',
    stars: 187,
    forks: 43,
    language: 'TypeScript',
    license: 'MIT',
    last_commit: '2025-06-10T09:15:00Z',
    is_selected: false,
    created_at: '2025-05-01T10:00:00Z',
  },
  {
    id: 103,
    idea_id: 1,
    github_repo_id: 73829104,
    owner: 'ops-ai',
    repo_name: 'devops-automation-suite',
    url: 'https://github.com/ops-ai/devops-automation-suite',
    description:
      'Automated DevOps pipeline tool with CI/CD integration, infrastructure-as-code templates, monitoring dashboards, and incident response workflows.',
    stars: 95,
    forks: 28,
    language: 'Go',
    license: 'MIT',
    last_commit: '2025-04-22T16:45:00Z',
    is_selected: false,
    created_at: '2025-05-01T10:00:00Z',
  },
]

// ──────────────────────────────────────────────
// MOCK ANALYSIS REPORT
// ──────────────────────────────────────────────

const MOCK_FINDINGS: FindingRead[] = [
  {
    id: 1,
    analysis_id: 1,
    type: 'ISSUE',
    severity: 'CRITICAL',
    title: 'Outdated Dependencies with Known Vulnerabilities',
    description:
      'Several core dependencies (TensorFlow 2.8, Flask 1.1) have known CVEs. Requires immediate update to patched versions. Potential security risks in production deployment.',
    recommendation:
      'Update TensorFlow to 2.15+, Flask to 3.0+. Run dependency audit tool to identify all vulnerable packages and create a migration plan.',
  },
  {
    id: 2,
    analysis_id: 1,
    type: 'ISSUE',
    severity: 'HIGH',
    title: 'Missing Unit Tests for Critical Modules',
    description:
      'Core pipeline execution engine has less than 15% test coverage. Error handling paths and edge cases are untested, increasing regression risk during revival.',
    recommendation:
      'Prioritize writing unit tests for the pipeline orchestrator, data validators, and model deployment modules. Aim for 70%+ coverage before production release.',
  },
  {
    id: 3,
    analysis_id: 1,
    type: 'FEATURE',
    severity: 'MEDIUM',
    title: 'No REST API for External Integration',
    description:
      'The project lacks a well-defined REST API layer, making it difficult for external tools and services to integrate with the pipeline programmatically.',
    recommendation:
      'Design and implement a RESTful API using FastAPI. Include OpenAPI documentation, rate limiting, and authentication from the start.',
  },
  {
    id: 4,
    analysis_id: 1,
    type: 'AI_TASK',
    severity: 'LOW',
    title: 'Automated Documentation Generation',
    description:
      'API documentation and developer guides are maintained manually. An automated documentation pipeline would reduce maintenance burden and ensure accuracy.',
    recommendation:
      'Set up Sphinx or MkDocs with auto-generation from docstrings. Integrate into the CI pipeline to rebuild on every merge to main.',
  },
  {
    id: 5,
    analysis_id: 1,
    type: 'HUMAN_TASK',
    severity: 'MEDIUM',
    title: 'Code Style Consistency Across Modules',
    description:
      'Different modules use different coding styles and conventions. This creates friction for new contributors and makes code review more difficult.',
    recommendation:
      'Adopt a project-wide linter (Black for Python, ESLint for TS) and formatter configuration. Run formatting checks in CI. Allocate 2-3 days for initial cleanup.',
  },
  {
    id: 6,
    analysis_id: 1,
    type: 'RISK',
    severity: 'HIGH',
    title: 'Single Maintainer Bus Factor',
    description:
      '95% of commits in the last 6 months came from a single contributor. Project revival requires building a distributed maintainer team to ensure sustainability.',
    recommendation:
      'Identify and onboard 2-3 core maintainers during the revival phase. Set up clear contribution guidelines, review processes, and maintainer documentation.',
  },
  {
    id: 7,
    analysis_id: 1,
    type: 'ISSUE',
    severity: 'LOW',
    title: 'Deprecated Python 3.7 Features Used',
    description:
      'Several modules use Python 3.7 deprecated APIs (asyncio loop methods, typing extensions). These will break when upgrading to Python 3.12+.',
    recommendation:
      'Run pyupgrade or modernize tooling to automatically fix deprecated patterns. Target Python 3.11+ for the revived codebase.',
  },
]

const MOCK_ROLES: RequiredRoleRead[] = [
  {
    id: 1,
    analysis_id: 1,
    role: 'Senior ML Engineer',
    priority: 1,
    reason:
      'Core pipeline architecture redesign requires deep ML systems knowledge. Must understand TensorFlow/PyTorch internals and distributed training.',
  },
  {
    id: 2,
    analysis_id: 1,
    role: 'Full-Stack Developer',
    priority: 2,
    reason:
      'Need to build the dashboard UI, REST API layer, and integrate frontend with backend services. React and FastAPI experience required.',
  },
  {
    id: 3,
    analysis_id: 1,
    role: 'DevOps / Platform Engineer',
    priority: 3,
    reason:
      'Revival includes setting up modern CI/CD, containerization, cloud deployment infra, and monitoring. Kubernetes and cloud platform experience needed.',
  },
  {
    id: 4,
    analysis_id: 1,
    role: 'Technical Writer',
    priority: 4,
    reason:
      'Documentation overhaul is critical for contributor onboarding. Must create API docs, tutorials, migration guides, and contribution guidelines.',
  },
]

export const MOCK_CONTRIBUTOR_MATCHES: ContributorMatchRead[] = [
  {
    id: 201,
    analysis_id: 1,
    github_username: 'sarahkim',
    github_profile: 'https://github.com/sarahkim',
    avatar_url: null,
    match_score: 96,
    recent_activity_score: 92,
    matched_skills: ['Python', 'TensorFlow', 'ML Pipelines', 'Docker', 'FastAPI'],
    recent_repositories: ['mlops-toolkit', 'model-serving-benchmarks', 'kubeflow-pipelines'],
    recommendation_reason:
      'Sarah has extensive experience building ML pipelines at scale. Her contributions to Kubeflow and MLOps projects align perfectly with the ML Pipeline Orchestrator architecture. Strong Python and TensorFlow expertise.',
  },
  {
    id: 202,
    analysis_id: 1,
    github_username: 'marcuschen',
    github_profile: 'https://github.com/marcuschen',
    avatar_url: null,
    match_score: 89,
    recent_activity_score: 87,
    matched_skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'GraphQL'],
    recent_repositories: ['react-admin-panel', 'graphql-codegen', 'prisma-utils'],
    recommendation_reason:
      'Marcus is a skilled full-stack developer with a strong track record in building admin dashboards and data visualization tools. His React expertise would be valuable for the pipeline monitoring dashboard.',
  },
  {
    id: 203,
    analysis_id: 1,
    github_username: 'arialiu',
    github_profile: 'https://github.com/arialiu',
    avatar_url: null,
    match_score: 84,
    recent_activity_score: 78,
    matched_skills: ['Go', 'Kubernetes', 'Terraform', 'AWS', 'Prometheus'],
    recent_repositories: ['k8s-operator-sdk', 'terraform-modules', 'observability-stack'],
    recommendation_reason:
      'Aria has deep DevOps and platform engineering experience. Her Kubernetes operator and infrastructure-as-code work would be crucial for the deployment and CI/CD aspects of the revival.',
  },
]

const MOCK_CONTRIBUTORS_FOR_OUTREACH: ContributorMatchRead[] = [
  ...MOCK_CONTRIBUTOR_MATCHES,
  {
    id: 204,
    analysis_id: 1,
    github_username: 'jordanlee',
    github_profile: 'https://github.com/jordanlee',
    avatar_url: null,
    match_score: 76,
    recent_activity_score: 71,
    matched_skills: ['Documentation', 'API Design', 'OpenAPI', 'Markdown', 'Sphinx'],
    recent_repositories: ['docs-as-code', 'openapi-specs', 'technical-writing-guide'],
    recommendation_reason:
      'Jordan specializes in developer documentation and API design. Their experience with docs-as-code workflows and OpenAPI specifications makes them ideal for improving project documentation.',
  },
]

export const MOCK_ANALYSIS_REPORT: AnalysisRead = {
  id: 1,
  repository_id: 101,
  executive_summary:
    'The ML Pipeline Orchestrator shows strong revival potential with a well-defined architecture and clear market demand for ML infrastructure tools. The codebase has solid foundations but suffers from dependency rot, limited test coverage, and bus-factor risk. Revival requires a focused 8-10 week effort: modernize dependencies, build test coverage, implement a REST API layer, and onboard a distributed maintainer team. The project is safe to revive with moderate investment. Key strengths include clean modular architecture, comprehensive README, and active community interest evidenced by 342 stars and 56 forks despite 6 months of reduced activity.',
  revival_score: 72,
  project_health_score: 65,
  documentation_score: 58,
  technical_debt_score: 35,
  trend_score: 80,
  safe_to_revive: true,
  ai_effort_percentage: 42.5,
  human_effort_percentage: 57.5,
  analysis_metadata: {
    analyzed_at: new Date().toISOString(),
    total_files: 342,
    total_lines: 48700,
    languages: { Python: 72, TypeScript: 18, Shell: 7, Dockerfile: 3 },
    total_commits: 1247,
    total_contributors: 12,
    pipeline_duration_ms: 12450,
  },
  created_at: new Date().toISOString(),
  findings: MOCK_FINDINGS,
  required_roles: MOCK_ROLES,
  contributor_matches: MOCK_CONTRIBUTOR_MATCHES,
}

// ──────────────────────────────────────────────
// MOCK OUTREACH MESSAGES
// ──────────────────────────────────────────────

export const MOCK_OUTREACH_MESSAGES: OutreachMessageRead[] = [
  {
    id: 301,
    analysis_id: 1,
    recipient: 'sarahkim',
    type: 'CONTRIBUTOR',
    generated_message: `Hi Sarah! 👋

I came across your impressive work on MLOps and Kubeflow pipelines, and I was really inspired by your contributions to the open source ML ecosystem.

We're currently reviving the ML Pipeline Orchestrator project (github.com/ml-toolkit/ml-pipeline-orchestrator) — a visual ML pipeline builder that aligns perfectly with your expertise in TensorFlow and distributed ML systems.

Given your experience building scalable ML pipelines, I believe you'd be an incredible addition to the revival team. The project has strong foundations and we're looking for core maintainers to help shape its future direction.

Would you be open to a quick call this week to discuss how you might contribute? I'd love to hear your thoughts on the project direction and any ideas you might have.

Best,
The Second Commit Team`,
    created_at: new Date().toISOString(),
  },
  {
    id: 302,
    analysis_id: 1,
    recipient: 'marcuschen',
    type: 'CONTRIBUTOR',
    generated_message: `Hi Marcus! 👋

I've been following your work on React admin panels and GraphQL tooling — your Prisma utils library has been really useful in my own projects!

We're currently reviving the ML Pipeline Orchestrator (github.com/ml-toolkit/ml-pipeline-orchestrator) and we're looking for a skilled full-stack developer to build the monitoring dashboard and REST API layer. Your experience with React, TypeScript, and data visualization makes you a perfect fit.

The project has a solid backend foundation but needs frontend expertise to build an intuitive dashboard experience for pipeline monitoring, model performance tracking, and configuration management.

I'd love to discuss how you might shape the frontend architecture and user experience. Are you interested in joining the revival effort?

Looking forward to hearing from you,
The Second Commit Team`,
    created_at: new Date().toISOString(),
  },
  {
    id: 303,
    analysis_id: 1,
    recipient: 'arialiu',
    type: 'CONTRIBUTOR',
    generated_message: `Hi Aria! 🚀

Your Kubernetes operator work and infrastructure-as-code expertise caught my attention — the terraform-modules repo is exceptionally well-organized!

We're kicking off the revival of the ML Pipeline Orchestrator (github.com/ml-toolkit/ml-pipeline-orchestrator) and we need a platform engineering expert to lead the DevOps transformation. The project needs modern CI/CD pipelines, containerization strategy, Kubernetes deployment manifests, and cloud infrastructure setup.

This is a greenfield opportunity to design the deployment architecture from scratch — exactly the kind of challenge your skill set is built for. We're looking for someone to own the entire platform infrastructure layer.

Would you be interested in a chat about the project roadmap? I'd love to hear your ideas on the infrastructure design.

Best,
The Second Commit Team`,
    created_at: new Date().toISOString(),
  },
]

// ──────────────────────────────────────────────
// HELPER: Map repository ID to mock analysis
// Since the analysis is generated for the first selected repo
// ──────────────────────────────────────────────

export function getMockAnalysisForRepo(repoId: number): AnalysisRead {
  const repo = MOCK_REPOSITORIES.find((r) => r.id === repoId)
  return {
    ...MOCK_ANALYSIS_REPORT,
    repository_id: repoId,
    executive_summary: repo
      ? `Analysis report for ${repo.owner}/${repo.repo_name}. ${MOCK_ANALYSIS_REPORT.executive_summary}`
      : MOCK_ANALYSIS_REPORT.executive_summary,
  }
}
