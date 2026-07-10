"""
Database seed script for SecondCommit.

Creates realistic interconnected demo data for hackathon demonstration.
Minimum 25 rows in every table.

Usage:
    cd backend
    PYTHONPATH=. python seed.py

This script must be run after alembic migrations have been applied:
    alembic upgrade head
    python seed.py

Demo Accounts Created:
    Startup Owner: startup@demo.com / password123
    Freelancer: freelancer@demo.com / password123
    Admin: admin@demo.com / password123
"""

import sys
import os
import random

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db.enums import (
    UserRole,
    IdeaStatus,
    FindingType,
    Severity,
    ResponseStatus,
    OutreachType,
)
from app.db.models.user import User
from app.db.models.idea import Idea
from app.db.models.repository import Repository
from app.db.models.repository_analysis import RepositoryAnalysis
from app.db.models.analysis_finding import AnalysisFinding
from app.db.models.required_role import RequiredRole
from app.db.models.contributor_match import ContributorMatch
from app.db.models.outreach_message import OutreachMessage
from app.db.models.response_tracker import ResponseTracker
from app.db.models.freelancer_profile import FreelancerProfile
from app.db.models.github_repository_snapshot import GitHubRepositorySnapshot

now = datetime.now(timezone.utc)

# ── Realistic helper data ──

STARTUP_NAMES = [
    ("Alice Chen", "alice.chen@example.com"),
    ("Bob Martinez", "bob.m@example.com"),
    ("Carol Wu", "carol.wu@example.com"),
    ("David Kim", "david.k@example.com"),
    ("Eve Johnson", "eve.j@example.com"),
    ("Frank Lee", "frank.lee@example.com"),
    ("Grace Patel", "grace.p@example.com"),
    ("Hank Williams", "hank.w@example.com"),
    ("Irene Costa", "irene.c@example.com"),
    ("Jake Morrison", "jake.m@example.com"),
    ("Karen O'Brien", "karen.o@example.com"),
    ("Leo Thompson", "leo.t@example.com"),
    ("Mia Garcia", "mia.g@example.com"),
    ("Noah Brown", "noah.b@example.com"),
    ("Olivia Davis", "olivia.d@example.com"),
]

FREELANCER_NAMES = [
    ("Priya Sharma", "priya.s@example.com", "priya-dev"),
    ("Marcus Johnson", "marcus.j@example.com", "marcus-codes"),
    ("Sarah Chen", "sarah.c@example.com", "sarah-dev"),
    ("Tom Wilson", "tom.w@example.com", "tom-builds"),
    ("Uma Patel", "uma.p@example.com", "uma-tech"),
    ("Victor Nguyen", "victor.n@example.com", "victor-coder"),
    ("Wendy Liu", "wendy.l@example.com", "wendy-js"),
    ("Xavier Smith", "xavier.s@example.com", "xavier-ops"),
    ("Yuki Tanaka", "yuki.t@example.com", "yuki-ml"),
    ("Zara Ahmed", "zara.a@example.com", "zara-ui"),
]

SKILLS_POOL = [
    "React", "TypeScript", "Python", "FastAPI", "PostgreSQL", "Docker",
    "AWS", "GraphQL", "Node.js", "Next.js", "Tailwind CSS", "Redis",
    "Kubernetes", "Terraform", "Go", "Rust", "Vue.js", "Angular",
    "MongoDB", "Elasticsearch", "Kafka", "RabbitMQ", "CI/CD", "GitHub Actions",
    "Machine Learning", "TensorFlow", "PyTorch", "NLP", "Computer Vision",
    "Flutter", "React Native", "Swift", "Kotlin", "Firebase",
    "Svelte", "Solid.js", "WebAssembly", "Three.js", "D3.js",
]

REPO_POOL = [
    ("facebook", "react", "A declarative UI library", "JavaScript", "MIT", 230000, 47000),
    ("vercel", "next.js", "The React framework for production", "JavaScript", "MIT", 128000, 27000),
    ("sveltejs", "svelte", "Cybernetically enhanced web apps", "JavaScript", "MIT", 81000, 4500),
    ("microsoft", "TypeScript", "TypeScript is a superset of JavaScript", "TypeScript", "Apache-2.0", 102000, 13000),
    ("tailwindlabs", "tailwindcss", "A utility-first CSS framework", "JavaScript", "MIT", 85000, 4300),
    ("python", "cpython", "The Python programming language", "Python", "Python-2.0", 64000, 29000),
    ("django", "django", "The Web framework for perfectionists", "Python", "BSD-3-Clause", 82000, 34000),
    ("fastapi", "fastapi", "FastAPI framework", "Python", "MIT", 80000, 6500),
    ("grafana", "grafana", "The open observability platform", "TypeScript", "AGPL-3.0", 67000, 12000),
    ("prometheus", "prometheus", "The Prometheus monitoring system", "Go", "Apache-2.0", 57000, 9500),
    ("kubernetes", "kubernetes", "Production-Grade Container Scheduling", "Go", "Apache-2.0", 113000, 40000),
    ("ansible", "ansible", "Ansible is a radically simple IT automation", "Python", "GPL-3.0", 64000, 24000),
    ("hashicorp", "terraform", "Terraform enables you to safely and predictably create infrastructure", "Go", "MPL-2.0", 44000, 9700),
    ("apache", "spark", "Apache Spark - Unified engine for large-scale data analytics", "Scala", "Apache-2.0", 41000, 28000),
    ("apache", "airflow", "Apache Airflow - A platform to programmatically author, schedule and monitor workflows", "Python", "Apache-2.0", 38000, 14000),
]

IDEA_PROMPTS = [
    "Build an AI-powered code review assistant that automatically reviews pull requests and suggests improvements based on best practices.",
    "Create a platform that connects open-source maintainers with contributors who want to revive abandoned but valuable projects.",
    "Develop a developer productivity dashboard that aggregates metrics from GitHub, Jira, and CI/CD pipelines into a single unified view.",
    "Build a documentation generator that automatically creates and maintains API documentation from code comments and type definitions.",
    "Create an automated dependency update bot that scans repositories and creates pull requests for outdated dependencies.",
    "Build a real-time collaboration tool for remote pair programming with integrated video calls and shared terminals.",
    "Develop a machine learning platform for automated code quality assessment and technical debt prediction.",
    "Create a serverless application framework that simplifies deploying microservices to AWS Lambda.",
    "Build an open-source alternative to Datadog for application performance monitoring.",
    "Develop a static site generator optimized for technical documentation with built-in search and versioning.",
    "Create a cross-platform mobile app builder that compiles React components to native iOS and Android code.",
    "Build a privacy-first analytics platform that doesn't use cookies and respects user consent.",
    "Develop a natural language query interface for databases that lets non-technical users ask questions in plain English.",
    "Create a peer-to-peer content delivery network for serving static assets using WebRTC.",
    "Build an AI-powered test generation tool that automatically creates unit tests from code analysis.",
    "Develop a visual workflow builder for data pipelines with drag-and-drop ETL transformations.",
    "Create an open-source feature flag management system with A/B testing capabilities.",
    "Build a real-time notification infrastructure service with support for web push, email, SMS, and Slack.",
    "Develop a schema-less API gateway that auto-generates REST endpoints from database tables.",
    "Create a developer-first secrets management tool for encrypting environment variables across teams.",
    "Build an intelligent log aggregator that uses ML to detect anomalies and correlate events.",
    "Develop a multi-cloud deployment orchestrator with a unified interface for AWS, GCP, and Azure.",
    "Create a Git-based CMS that lets non-developers edit website content through pull requests.",
    "Build a WebAssembly runtime for running serverless functions at the edge with sub-millisecond cold starts.",
    "Develop an open-source Canary deployment tool with automatic rollback based on error budget analysis.",
    "Create a developer experience dashboard that measures DORA metrics and provides actionable insights.",
    "Build an AI-powered code completion engine that works offline with local LLM inference.",
    "Develop a real-time database synchronization tool for offline-first mobile applications.",
    "Create an automated security vulnerability scanner for open-source dependencies.",
    "Build a distributed task queue with WebSocket-based progress reporting and retry logic.",
]

IDEA_REFINEMENTS = [
    "An intelligent code review automation platform that integrates with GitHub to analyze pull requests in real-time. Uses machine learning to detect code quality issues, security vulnerabilities, and deviations from best practices, providing actionable suggestions directly within the PR workflow.",
    "A community-driven marketplace connecting skilled developers with abandoned open-source projects in need of revival. Uses skill matching, project health scoring, and automated outreach to facilitate project handoffs and community-driven maintenance.",
    "A unified developer productivity intelligence platform that aggregates metrics from GitHub, Jira, and CI/CD pipelines. Features include team velocity tracking, bottleneck identification, sprint health scoring, and automated standup report generation.",
    "An automated API documentation engine that extracts type definitions and JSDoc/annotations from source code and generates comprehensive OpenAPI/Swagger documentation. Supports multiple frameworks and languages with live preview.",
    "A proactive dependency management bot that monitors repository dependencies and automatically creates pull requests with version bumps, changelog summaries, and compatibility checks based on semantic versioning analysis.",
    "A real-time collaborative development environment with WebRTC-based video, shared terminal sessions, and synchronized code editing. Designed for remote pair programming with minimal latency and no central server dependency.",
    "A machine learning framework for analyzing codebases and predicting technical debt accumulation. Trained on historical refactoring data to identify risky code patterns and prioritize remediation efforts with estimated effort scores.",
    "A lightweight serverless framework that abstracts AWS Lambda deployment complexities through declarative configuration. Handles routing, middleware, error handling, and cold start optimization with a local development server.",
    "An open-source APM solution providing distributed tracing, metric aggregation, and log correlation. Uses OpenTelemetry standard with pluggable storage backends (Prometheus, Grafana Loki, Elasticsearch) for flexible deployment.",
    "A documentation-first static site generator with built-in full-text search, multi-version documentation, and automated changelog generation. Designed for open-source projects with MDX support and customizable themes.",
    "A cross-platform mobile framework that compiles React/TypeScript components to native iOS and Android code using a custom intermediate representation. Eliminates the need for WebView bridges while maintaining hot reload.",
    "A privacy-preserving analytics platform using differential privacy techniques. Collects essential usage data without cookies or personal identifiers, providing aggregate insights while being fully GDPR/CCPA compliant.",
    "A natural language query interface that converts plain English questions into optimized SQL queries using LLM-powered semantic parsing. Supports joins, aggregations, and complex filtering with explainable query generation.",
    "A decentralized CDN using WebRTC data channels and browser-based peer discovery. Reduces bandwidth costs by serving static assets from nearby peers while maintaining reliability through redundant seed nodes.",
    "An AI-powered unit test generation tool that analyzes code paths, edge cases, and error states to automatically produce comprehensive test suites. Supports Jest, Vitest, PyTest, and Go test frameworks with configurable coverage targets.",
    "A visual data pipeline builder with a drag-and-drop interface for ETL transformations. Supports multiple data sources (S3, PostgreSQL, Kafka), built-in transformation nodes, and automatic schema inference for target systems.",
    "An open-source feature flag platform with multi-variant A/B testing, gradual rollouts, and real-time analytics. Features include SDK support for major languages, targeting rules, and automatic cleanup of stale flags.",
    "A unified notification infrastructure that normalizes sending across email (SendGrid), SMS (Twilio), push (Firebase), and Slack. Provides idempotent delivery, retry logic, rate limiting, and a single webhook for status callbacks.",
    "A no-code REST API generator that introspects database schemas and automatically produces CRUD endpoints with filtering, pagination, sorting, and OpenAPI documentation. Supports PostgreSQL, MySQL, and SQLite backends.",
    "A secrets management tool for developer teams that encrypts environment variables using age encryption. Features include Git integration, role-based access, audit logging, and CLI tooling with IDE plugins.",
    "An AI-powered log analysis platform that uses unsupervised learning to detect anomalies, correlate related events, and reduce alert fatigue. Supports structured and unstructured logs with real-time streaming ingestion.",
    "A multi-cloud deployment abstraction layer with a unified Terraform-like configuration language. Supports AWS, GCP, Azure, and DigitalOcean with automatic resource mapping, cost estimation, and drift detection.",
    "A Git-backed CMS that stores content as Markdown files in a repository. Non-technical users can edit content through a WYSIWYG interface that creates pull requests, triggering automated preview deployments.",
    "A WebAssembly serverless runtime using Wasmtime for near-native performance at the edge. Features sub-millisecond cold starts, sandboxed execution, and language-agnostic function development (Rust, Go, C, AssemblyScript).",
    "A canary deployment orchestrator with automatic rollback based on error budget consumption. Integrates with Kubernetes, supports traffic mirroring, gradual traffic shifting, and real-time comparison of metrics between versions.",
    "A developer experience analytics platform tracking DORA metrics (deployment frequency, lead time, MTTR, change failure rate). Integrates with GitHub, GitLab, and Bitbucket to provide actionable team performance insights.",
    "An offline-first code completion engine that runs local LLM inference using WebGPU for acceleration. Supports multiple programming languages with context-aware suggestions without sending code to external servers.",
    "A real-time database sync engine for offline-first mobile apps using CRDT-based conflict resolution. Supports SQLite local storage with automatic merging, delta-sync protocol, and optional cloud backup.",
    "An automated dependency vulnerability scanner that monitors open-source dependencies from multiple ecosystems (npm, PyPI, Maven, Go modules). Generates prioritized remediation reports and automatic patch pull requests.",
    "A distributed task queue with WebSocket-based real-time progress updates, automatic retry with exponential backoff, and support for scheduled/cron tasks. Uses PostgreSQL as the backend with optional Redis for performance.",
]


def seed():
    engine = create_engine(str(settings.DATABASE_URL))

    with Session(engine) as db:
        # ──────────────────────────────────────────
        # 1. Users (25+)
        # ──────────────────────────────────────────
        print("Creating users...")

        # Demo users
        startup = User(
            name="Alex Startup", email="startup@demo.com",
            password_hash=hash_password("password123"), role=UserRole.STARTUP,
            github_username=None, is_verified=True, token_version=1,
            created_at=now - timedelta(days=30),
        )
        freelancer = User(
            name="Jamie Freelancer", email="freelancer@demo.com",
            password_hash=hash_password("password123"), role=UserRole.FREELANCER,
            github_username="jami3-dev", is_verified=True, token_version=1,
            created_at=now - timedelta(days=20),
        )
        admin = User(
            name="Admin User", email="admin@demo.com",
            password_hash=hash_password("password123"), role=UserRole.ADMIN,
            github_username=None, is_verified=True, token_version=1,
            created_at=now - timedelta(days=60),
        )
        db.add_all([startup, freelancer, admin])

        # Additional startup users
        extra_startups = []
        for i, (name, email) in enumerate(STARTUP_NAMES):
            u = User(
                name=name, email=email,
                password_hash=hash_password("password123"), role=UserRole.STARTUP,
                github_username=None, is_verified=random.random() > 0.3,
                token_version=1, created_at=now - timedelta(days=random.randint(1, 60)),
            )
            extra_startups.append(u)
        db.add_all(extra_startups)

        # Additional freelancer users
        extra_freelancers = []
        for i, (name, email, gh) in enumerate(FREELANCER_NAMES):
            u = User(
                name=name, email=email,
                password_hash=hash_password("password123"), role=UserRole.FREELANCER,
                github_username=gh, is_verified=random.random() > 0.3,
                token_version=1, created_at=now - timedelta(days=random.randint(1, 45)),
            )
            extra_freelancers.append(u)
        db.add_all(extra_freelancers)

        db.commit()

        all_startups = [startup] + extra_startups
        all_freelancers = [freelancer] + extra_freelancers
        all_users = all_startups + all_freelancers + [admin]

        for u in all_users:
            db.refresh(u)

        # ──────────────────────────────────────────
        # 2. Freelancer Profiles (1 per freelancer = 10)
        # ──────────────────────────────────────────
        print("Creating freelancer profiles...")

        profiles = [
            FreelancerProfile(
                user_id=all_freelancers[i].id,
                bio=f"Full-stack developer with expertise in {', '.join(random.sample(SKILLS_POOL, 4))}.",
                experience_level=random.choice(["junior", "mid", "senior", "lead"]),
                portfolio=f"https://github.com/{all_freelancers[i].github_username}",
                linkedin=f"https://linkedin.com/in/{all_freelancers[i].github_username}",
                skills=random.sample(SKILLS_POOL, random.randint(3, 7)),
                tech_stack=random.sample(SKILLS_POOL, random.randint(2, 5)),
                priority_score=round(random.uniform(50, 100), 1),
            )
            for i in range(len(all_freelancers))
        ]
        db.add_all(profiles)
        db.commit()

        # ──────────────────────────────────────────
        # 3. Ideas (30 ideas distributed across startups)
        # ──────────────────────────────────────────
        print("Creating ideas...")

        all_ideas = []
        for i in range(min(30, len(IDEA_PROMPTS))):
            owner = random.choice(all_startups)
            status_choices = [IdeaStatus.DRAFT, IdeaStatus.REFINED, IdeaStatus.APPROVED, IdeaStatus.ANALYZED]
            weights = [0.15, 0.25, 0.25, 0.35]
            status = random.choices(status_choices, weights=weights, k=1)[0]
            has_refinement = status in (IdeaStatus.REFINED, IdeaStatus.APPROVED, IdeaStatus.ANALYZED)
            idea = Idea(
                owner_id=owner.id,
                original_prompt=IDEA_PROMPTS[i % len(IDEA_PROMPTS)],
                voice_transcript=random.choice([None, f"Voice note: {IDEA_PROMPTS[i % len(IDEA_PROMPTS)][:100]}..."]),
                refined_prompt=IDEA_REFINEMENTS[i % len(IDEA_REFINEMENTS)] if has_refinement else None,
                status=status,
                created_at=now - timedelta(days=random.randint(1, 60)),
            )
            all_ideas.append(idea)

        db.add_all(all_ideas)
        db.commit()
        for idea in all_ideas:
            db.refresh(idea)

        # ──────────────────────────────────────────
        # 4. Repositories (30+)
        # ──────────────────────────────────────────
        print("Creating repositories...")

        analyzed_ideas = [idea for idea in all_ideas if idea.status == IdeaStatus.ANALYZED]
        approved_ideas = [idea for idea in all_ideas if idea.status == IdeaStatus.APPROVED]

        all_repos = []
        for idea in analyzed_ideas + approved_ideas:
            num_repos = random.randint(1, 3)
            selected_indices = random.sample(range(len(REPO_POOL)), min(num_repos, len(REPO_POOL)))
            for j, idx in enumerate(selected_indices):
                owner, repo_name, desc, lang, lic, stars, forks = REPO_POOL[idx]
                repo = Repository(
                    idea_id=idea.id,
                    github_repo_id=random.randint(10000000, 99999999),
                    owner=owner,
                    repo_name=repo_name,
                    url=f"https://github.com/{owner}/{repo_name}",
                    description=desc,
                    stars=stars,
                    forks=forks,
                    language=lang,
                    license=lic,
                    last_commit=now - timedelta(hours=random.randint(1, 720)),
                    is_selected=(j == 0),
                    created_at=now - timedelta(days=random.randint(1, 30)),
                )
                all_repos.append(repo)

        db.add_all(all_repos)
        db.commit()
        for repo in all_repos:
            db.refresh(repo)

        # ──────────────────────────────────────────
        # 5. GitHub Snapshots (25+)
        # ──────────────────────────────────────────
        print("Creating GitHub snapshots...")

        all_snapshots = []
        for repo in all_repos[:30]:
            topics = random.sample(["react", "javascript", "python", "api", "web", "devops", "database", "ml", "frontend", "backend", "mobile", "testing", "security", "performance", "documentation"], random.randint(2, 5))
            snapshot = GitHubRepositorySnapshot(
                repository_id=repo.id,
                default_branch="main",
                latest_commit_sha=hex(random.randint(0, 2**40))[2:],
                latest_commit_date=now - timedelta(hours=random.randint(1, 720)),
                stars=repo.stars,
                forks=repo.forks,
                open_issues=random.randint(0, 500),
                watchers=random.randint(10, 5000),
                contributors_count=random.randint(5, 500),
                commits_count=random.randint(100, 20000),
                pull_requests_count=random.randint(10, 5000),
                releases_count=random.randint(1, 100),
                languages=random.sample(["JavaScript", "TypeScript", "Python", "Go", "Rust", "Java", "Ruby", "C++"], random.randint(1, 4)),
                topics=topics,
                raw_snapshot={"readme": f"# {repo.repo_name}\\n\\n{repo.description}\\n\\n## Getting Started\\nThis is a sample README for seed data.", "issues": []},
                snapshot_version="v1-seed",
                fetched_at=now - timedelta(days=random.randint(1, 14)),
            )
            all_snapshots.append(snapshot)

        db.add_all(all_snapshots)
        db.commit()

        # ──────────────────────────────────────────
        # 6. Repository Analyses (25+)
        # ──────────────────────────────────────────
        print("Creating analyses...")

        selected_repos = [repo for repo in all_repos if repo.is_selected][:28]
        all_analyses = []
        for repo in selected_repos:
            revival = random.randint(40, 95)
            health = random.randint(35, 98)
            docs = random.randint(30, 95)
            debt = random.randint(10, 70)
            trend = random.randint(30, 95)
            ai_pct = round(random.uniform(20, 60), 1)
            analysis = RepositoryAnalysis(
                repository_id=repo.id,
                executive_summary=f"Analysis of {repo.owner}/{repo.repo_name}: Revival score {revival}, Health {health}, Documentation {docs}, Tech Debt {debt}, Trend {trend}. AI automation potential: {ai_pct}%.",
                revival_score=revival,
                project_health_score=health,
                documentation_score=docs,
                technical_debt_score=debt,
                trend_score=trend,
                safe_to_revive=revival >= 50,
                ai_effort_percentage=ai_pct,
                human_effort_percentage=round(100 - ai_pct, 1),
                analysis_metadata={"repo_url": repo.url, "primary_language": repo.language, "skill_summary": ", ".join(random.sample(SKILLS_POOL, random.randint(3, 6)))},
                created_at=now - timedelta(days=random.randint(1, 20)),
            )
            all_analyses.append(analysis)

        db.add_all(all_analyses)
        db.commit()
        for analysis in all_analyses:
            db.refresh(analysis)

        # ──────────────────────────────────────────
        # 7. Analysis Findings (50+)
        # ──────────────────────────────────────────
        print("Creating findings...")

        finding_templates = [
            ("Large bundle size impact", "The application bundle size has grown significantly, impacting load times.", "Implement code splitting and lazy loading patterns."),
            ("TypeScript configuration gaps", "Strict mode is not enabled, allowing implicit any types.", "Enable strict: true in tsconfig.json and fix all type errors."),
            ("Test coverage below threshold", "Unit test coverage is below 60% for critical modules.", "Add tests for edge cases and error handling paths."),
            ("Missing error boundaries", "React error boundaries are not implemented, causing white screens on crashes.", "Add error boundaries at each route level."),
            ("No caching strategy", "API responses are not cached, causing repeated network requests.", "Implement SWR or React Query with stale-while-revalidate caching."),
            ("Deprecated package detected", "Several packages are using deprecated versions with known vulnerabilities.", "Run npm audit and update to latest compatible versions."),
            ("Accessibility violations found", "WCAG 2.1 AA compliance issues detected in navigation components.", "Add ARIA labels, focus management, and keyboard navigation support."),
            ("Missing input validation", "User inputs are not sanitized, leading to potential XSS vulnerabilities.", "Implement input validation and output encoding for all user-facing forms."),
            ("No rate limiting on API", "Public endpoints lack rate limiting, allowing potential abuse.", "Add rate limiting middleware with graduated response tiers."),
            ("Database query optimization needed", "N+1 query patterns detected in several API endpoints.", "Use eager loading and batch queries to reduce database roundtrips."),
            ("Missing API documentation", "Public API endpoints lack OpenAPI documentation.", "Add comprehensive docstrings and generate OpenAPI specs."),
            ("Environment variables not validated", "Required env vars are not checked at startup.", "Add config validation with clear error messages for missing vars."),
            ("No health check endpoint", "The service lacks a health check for orchestration.", "Add /health and /ready endpoints with dependency status."),
            ("Logging insufficient for debugging", "Errors are logged without sufficient context (request ID, stack trace).", "Implement structured logging with correlation IDs."),
            ("Memory leak suspected", "Event listeners and subscriptions are not properly cleaned up.", "Add cleanup logic in useEffect return functions and component unmount handlers."),
        ]

        all_findings = []
        for analysis in all_analyses:
            sample_findings = random.sample(finding_templates, min(random.randint(3, 6), len(finding_templates)))
            for title, desc, rec in sample_findings:
                f = AnalysisFinding(
                    analysis_id=analysis.id,
                    type=random.choice([f.value for f in FindingType]),
                    severity=random.choice([s.value for s in Severity]),
                    title=title,
                    description=desc,
                    recommendation=rec,
                )
                all_findings.append(f)

        db.add_all(all_findings)
        db.commit()

        # ──────────────────────────────────────────
        # 8. Required Roles (30+)
        # ──────────────────────────────────────────
        print("Creating required roles...")

        role_templates = [
            ("Senior React Engineer", 1, "Core UI architecture and component development."),
            ("TypeScript Developer", 2, "Type definitions and type-safe API integration."),
            ("Test Engineer", 3, "Comprehensive test suite and QA automation."),
            ("Documentation Writer", 4, "API docs, migration guides, and developer onboarding."),
            ("Accessibility Specialist", 5, "WCAG compliance audit and remediation."),
            ("Backend Engineer", 1, "API design and database schema optimization."),
            ("DevOps Engineer", 2, "CI/CD pipeline and infrastructure automation."),
            ("Security Auditor", 3, "Vulnerability assessment and security hardening."),
            ("Mobile Developer", 1, "Cross-platform mobile implementation."),
            ("ML Engineer", 1, "ML model development and deployment pipeline."),
            ("Data Engineer", 2, "Data pipeline architecture and ETL processes."),
            ("UI/UX Designer", 3, "User interface design and usability testing."),
        ]

        all_roles = []
        for analysis in all_analyses:
            num_roles = random.randint(2, 5)
            selected_roles = random.sample(role_templates, min(num_roles, len(role_templates)))
            for role, priority, reason in selected_roles:
                r = RequiredRole(
                    analysis_id=analysis.id,
                    role=role,
                    priority=priority,
                    reason=reason,
                )
                all_roles.append(r)

        db.add_all(all_roles)
        db.commit()

        # ──────────────────────────────────────────
        # 9. Contributor Matches (30+)
        # ──────────────────────────────────────────
        print("Creating contributor matches...")

        all_matches = []
        for analysis in all_analyses[:20]:
            # Pick random freelancers to match
            num_matches = random.randint(1, 4)
            matched_freelancers = random.sample(all_freelancers, min(num_matches, len(all_freelancers)))
            for freelancer_user in matched_freelancers:
                matched_skills = random.sample(SKILLS_POOL, random.randint(2, 5))
                match = ContributorMatch(
                    analysis_id=analysis.id,
                    github_username=freelancer_user.github_username or "unknown",
                    github_profile=f"https://github.com/{freelancer_user.github_username or 'unknown'}",
                    avatar_url=f"https://avatars.githubusercontent.com/u/{random.randint(10000, 99999)}",
                    match_score=round(random.uniform(60, 99), 1),
                    recent_activity_score=round(random.uniform(40, 100), 1),
                    matched_skills=matched_skills,
                    recent_repositories=[f"{random.choice(['react', 'vue', 'node', 'python', 'go'])}-{random.choice(['app', 'lib', 'cli', 'api', 'core'])}" for _ in range(random.randint(1, 4))],
                    recommendation_reason=f"Strong match with {', '.join(matched_skills[:3])}.",
                )
                all_matches.append(match)

        db.add_all(all_matches)
        db.commit()
        for match_obj in all_matches:
            db.refresh(match_obj)

        # ──────────────────────────────────────────
        # 10. Outreach Messages (25+)
        # ──────────────────────────────────────────
        print("Creating outreach messages...")

        all_messages = []
        for analysis in all_analyses[:15]:
            analysis_matches = [m for m in all_matches if m.analysis_id == analysis.id]
            for match_obj in analysis_matches[:3]:
                msg = OutreachMessage(
                    analysis_id=analysis.id,
                    recipient=match_obj.github_username,
                    type=OutreachType.CONTRIBUTOR.value,
                    generated_message=f"Hi @{match_obj.github_username}! Your expertise in {', '.join(match_obj.matched_skills[:3])} caught our attention. We're working on an exciting project revival and think your skills would be a great fit. Would you be interested in discussing potential collaboration? - The Second Commit Team",
                    created_at=now - timedelta(days=random.randint(1, 15)),
                )
                all_messages.append(msg)

        db.add_all(all_messages)
        db.commit()
        for msg in all_messages:
            db.refresh(msg)

        # ──────────────────────────────────────────
        # 11. Response Trackers (25+)
        # ──────────────────────────────────────────
        print("Creating response trackers...")

        all_trackers = []
        for msg in all_messages[:25]:
            # Find the match for this message
            match_for_msg = next((m for m in all_matches if m.analysis_id == msg.analysis_id and m.github_username == msg.recipient), None)
            statuses = [ResponseStatus.PENDING, ResponseStatus.ACCEPTED, ResponseStatus.DECLINED]
            weights = [0.4, 0.35, 0.25]
            status = random.choices(statuses, weights=weights, k=1)[0]
            tracker = ResponseTracker(
                analysis_id=msg.analysis_id,
                contributor_match_id=match_for_msg.id if match_for_msg else None,
                outreach_message_id=msg.id,
                status=status,
                responded_at=now - timedelta(days=random.randint(1, 10)) if status != ResponseStatus.PENDING else None,
                notes=None if status == ResponseStatus.PENDING else random.choice(["Excited to join!", "Currently occupied with other work.", "Happy to contribute!"]),
                created_at=msg.created_at,
                updated_at=now - timedelta(days=random.randint(1, 5)),
            )
            all_trackers.append(tracker)

        db.add_all(all_trackers)
        db.commit()

        # ──────────────────────────────────────────
        # Validate & Fill — ensure 25+ rows per table
        # ──────────────────────────────────────────
        print("\nValidating row counts (target: 25+ per table)...")

        from sqlalchemy import func as sa_func

        TABLES_INFO = [
            ("Users", User),
            ("Freelancer Profiles", FreelancerProfile),
            ("Ideas", Idea),
            ("Repositories", Repository),
            ("GitHub Snapshots", GitHubRepositorySnapshot),
            ("Repository Analyses", RepositoryAnalysis),
            ("Analysis Findings", AnalysisFinding),
            ("Required Roles", RequiredRole),
            ("Contributor Matches", ContributorMatch),
            ("Outreach Messages", OutreachMessage),
            ("Response Trackers", ResponseTracker),
        ]

        TARGET_MIN = 25

        def _validate_and_fill():
            """Check each table's row count and add rows if below 25."""
            for label, model in TABLES_INFO:
                count = db.query(sa_func.count(model.id)).scalar() or 0
                if count < TARGET_MIN:
                    needed = TARGET_MIN - count
                    print(f"   {label}: {count} rows — adding {needed} more...")

                    if model == User:
                        for i in range(needed):
                            idx = len(STARTUP_NAMES) + len(FREELANCER_NAMES) + i
                            u = User(
                                name=f"Generated User {idx}",
                                email=f"gen{idx}@example.com",
                                password_hash=hash_password("password123"),
                                role=random.choice([UserRole.STARTUP, UserRole.FREELANCER]),
                                github_username=f"gen-user-{idx}",
                                is_verified=True,
                                token_version=1,
                                created_at=now - timedelta(days=random.randint(1, 30)),
                            )
                            db.add(u)

                    elif model == FreelancerProfile:
                        # Find freelancer user IDs that do NOT already have a profile
                        # (freelancer_profiles has a UNIQUE constraint on user_id)
                        existing_profile_user_ids = {r[0] for r in db.query(FreelancerProfile.user_id).all()}
                        available = [u.id for u in db.query(User.id).filter(
                            User.role == UserRole.FREELANCER
                        ).all() if u.id not in existing_profile_user_ids]
                        # If not enough unprofiled freelancers exist, create new ones on the fly
                        if len(available) < needed:
                            shortfall = needed - len(available)
                            for j in range(shortfall):
                                idx = len(STARTUP_NAMES) + len(FREELANCER_NAMES) + j + 999
                                new_user = User(
                                    name=f"Auto-fill Freelancer {idx}",
                                    email=f"autofill.freelancer.{idx}@example.com",
                                    password_hash=hash_password("password123"),
                                    role=UserRole.FREELANCER,
                                    github_username=f"autofill-freelancer-{idx}",
                                    is_verified=True,
                                    token_version=1,
                                    created_at=now - timedelta(days=random.randint(1, 30)),
                                )
                                db.add(new_user)
                                db.flush()  # get the ID
                                available.append(new_user.id)
                        # Now create profiles for all available user IDs
                        for i in range(min(needed, len(available))):
                            p = FreelancerProfile(
                                user_id=available[i],
                                bio=f"Automatically generated freelancer profile #{i}.",
                                experience_level=random.choice(["junior", "mid", "senior"]),
                                portfolio=f"https://github.com/gen-user-{i}",
                                skills=random.sample(SKILLS_POOL, min(3, len(SKILLS_POOL))),
                                tech_stack=random.sample(SKILLS_POOL, min(2, len(SKILLS_POOL))),
                                priority_score=round(random.uniform(50, 100), 1),
                            )
                            db.add(p)

                    elif model == Idea:
                        for i in range(needed):
                            all_sids = [u.id for u in db.query(User.id).filter(
                                User.role == UserRole.STARTUP
                            ).all()]
                            if not all_sids:
                                break
                            idea = Idea(
                                owner_id=random.choice(all_sids),
                                original_prompt=f"Auto-generated idea #{i}: {random.choice(IDEA_PROMPTS)}",
                                status=random.choice(list(IdeaStatus)),
                                created_at=now - timedelta(days=random.randint(1, 30)),
                            )
                            db.add(idea)

                    elif model == Repository:
                        all_idea_ids = [r.id for r in db.query(Idea.id).all()]
                        for i in range(needed):
                            if not all_idea_ids:
                                break
                            owner, rname, desc, lang, lic, stars, forks = random.choice(REPO_POOL)
                            repo = Repository(
                                idea_id=random.choice(all_idea_ids),
                                github_repo_id=random.randint(10000000, 99999999),
                                owner=owner,
                                repo_name=rname,
                                url=f"https://github.com/{owner}/{rname}",
                                description=desc,
                                stars=stars,
                                forks=forks,
                                language=lang,
                                license=lic,
                                last_commit=now - timedelta(hours=random.randint(1, 720)),
                                is_selected=random.random() > 0.5,
                                created_at=now - timedelta(days=random.randint(1, 30)),
                            )
                            db.add(repo)

                    elif model == GitHubRepositorySnapshot:
                        # Exclude repo IDs that already have a snapshot (UNIQUE constraint)
                        existing = {r[0] for r in db.query(GitHubRepositorySnapshot.repository_id).all()}
                        all_repo_ids = [r.id for r in db.query(Repository.id).all() if r.id not in existing]
                        for i in range(min(needed, len(all_repo_ids))):
                            rid = all_repo_ids[i]
                            topics = random.sample(
                                ["react", "javascript", "python", "api", "web", "devops"],
                                random.randint(2, 4)
                            )
                            snap = GitHubRepositorySnapshot(
                                repository_id=rid,
                                default_branch="main",
                                latest_commit_sha=hex(random.randint(0, 2**40))[2:],
                                latest_commit_date=now - timedelta(hours=random.randint(1, 720)),
                                stars=random.randint(100, 50000),
                                forks=random.randint(10, 5000),
                                open_issues=random.randint(0, 200),
                                watchers=random.randint(10, 2000),
                                contributors_count=random.randint(5, 200),
                                commits_count=random.randint(100, 10000),
                                pull_requests_count=random.randint(10, 2000),
                                releases_count=random.randint(1, 50),
                                languages=random.sample(["JavaScript", "Python", "Go", "Rust"], random.randint(1, 3)),
                                topics=topics,
                                raw_snapshot={"readme": "# Auto-generated snapshot", "issues": []},
                                snapshot_version="v1-seed-fill",
                                fetched_at=now - timedelta(days=random.randint(1, 14)),
                            )
                            db.add(snap)

                    elif model == RepositoryAnalysis:
                        # Exclude repo IDs that already have an analysis (UNIQUE constraint)
                        existing = {r[0] for r in db.query(RepositoryAnalysis.repository_id).all()}
                        all_repo_ids = [r.id for r in db.query(Repository.id).all() if r.id not in existing]
                        for i in range(min(needed, len(all_repo_ids))):
                            rid = all_repo_ids[i]
                            revival = random.randint(40, 95)
                            analysis = RepositoryAnalysis(
                                repository_id=rid,
                                executive_summary=f"Auto-generated analysis #{i}. Revival score: {revival}.",
                                revival_score=revival,
                                project_health_score=random.randint(35, 98),
                                documentation_score=random.randint(30, 95),
                                technical_debt_score=random.randint(10, 70),
                                trend_score=random.randint(30, 95),
                                safe_to_revive=revival >= 50,
                                ai_effort_percentage=round(random.uniform(20, 60), 1),
                                human_effort_percentage=round(random.uniform(20, 60), 1),
                                analysis_metadata={"source": "auto-fill"},
                                created_at=now - timedelta(days=random.randint(1, 20)),
                            )
                            db.add(analysis)

                    elif model == AnalysisFinding:
                        all_analysis_ids = [a.id for a in db.query(RepositoryAnalysis.id).all()]
                        titles = ["Auto-detected code issue", "Performance concern", "Security finding"]
                        for i in range(needed):
                            if not all_analysis_ids:
                                break
                            f = AnalysisFinding(
                                analysis_id=random.choice(all_analysis_ids),
                                type=random.choice([t.value for t in FindingType]),
                                severity=random.choice([s.value for s in Severity]),
                                title=random.choice(titles),
                                description="Auto-generated finding to meet minimum row count.",
                                recommendation="Review and address as appropriate.",
                            )
                            db.add(f)

                    elif model == RequiredRole:
                        all_analysis_ids = [a.id for a in db.query(RepositoryAnalysis.id).all()]
                        roles_pool = ["Frontend Developer", "Backend Developer", "DevOps Engineer"]
                        for i in range(needed):
                            if not all_analysis_ids:
                                break
                            r = RequiredRole(
                                analysis_id=random.choice(all_analysis_ids),
                                role=random.choice(roles_pool),
                                priority=random.randint(1, 5),
                                reason="Auto-generated role requirement.",
                            )
                            db.add(r)

                    elif model == ContributorMatch:
                        all_analysis_ids = [a.id for a in db.query(RepositoryAnalysis.id).all()]
                        all_gh_users = [u.github_username for u in db.query(User.github_username).filter(
                            User.github_username.isnot(None)
                        ).all()]
                        for i in range(needed):
                            if not all_analysis_ids:
                                break
                            gh_user = random.choice(all_gh_users) if all_gh_users else f"contributor-{i}"
                            cm = ContributorMatch(
                                analysis_id=random.choice(all_analysis_ids),
                                github_username=gh_user,
                                github_profile=f"https://github.com/{gh_user}",
                                match_score=round(random.uniform(60, 99), 1),
                                recent_activity_score=round(random.uniform(40, 100), 1),
                                matched_skills=random.sample(SKILLS_POOL, min(2, len(SKILLS_POOL))),
                                recent_repositories=["auto-repo"],
                                recommendation_reason="Auto-generated match.",
                            )
                            db.add(cm)

                    elif model == OutreachMessage:
                        all_analysis_ids = [a.id for a in db.query(RepositoryAnalysis.id).all()]
                        all_cm = db.query(ContributorMatch).all()
                        for i in range(min(needed, max(1, len(all_cm)))):
                            match_obj = all_cm[i % len(all_cm)] if all_cm else None
                            msg = OutreachMessage(
                                analysis_id=match_obj.analysis_id if match_obj else (
                                    random.choice(all_analysis_ids) if all_analysis_ids else 1
                                ),
                                recipient=match_obj.github_username if match_obj else f"contributor-{i}",
                                type=OutreachType.CONTRIBUTOR.value,
                                generated_message=f"Auto-generated outreach #{i}.",
                                created_at=now - timedelta(days=random.randint(1, 15)),
                            )
                            db.add(msg)

                    elif model == ResponseTracker:
                        all_msgs = db.query(OutreachMessage).all()
                        all_cm = db.query(ContributorMatch).all()
                        for i in range(min(needed, max(1, len(all_msgs)))):
                            msg = all_msgs[i % len(all_msgs)]
                            match_for_msg = next(
                                (m for m in all_cm if m.github_username == msg.recipient),
                                None,
                            ) if all_cm else None
                            rt = ResponseTracker(
                                analysis_id=msg.analysis_id,
                                contributor_match_id=match_for_msg.id if match_for_msg else None,
                                outreach_message_id=msg.id,
                                status=random.choice(list(ResponseStatus)),
                                created_at=msg.created_at,
                                updated_at=now - timedelta(days=random.randint(1, 5)),
                            )
                            db.add(rt)

                else:
                    print(f"   {label}: {count} rows ✓")

        _validate_and_fill()

        # ── Self-audit: recount every table after fill ──
        print("\n📊 Final Row Counts (Post-Validation):")
        for label, model in TABLES_INFO:
            final_count = db.query(sa_func.count(model.id)).scalar() or 0
            status = "✓" if final_count >= 25 else "⚠"
            print(f"   {status} {label}: {final_count}")

        # ──────────────────────────────────────────
        # Final commit with try/except rollback guard
        # ──────────────────────────────────────────
        try:
            db.commit()
            print("\n" + "=" * 60)
            print("✅ Database seeded successfully!")
            print("=" * 60)
            print(f"\n📋 Demo Accounts:")
            print(f"   Startup Owner: startup@demo.com / password123")
            print(f"   Freelancer:    freelancer@demo.com / password123")
            print(f"   Admin:         admin@demo.com / password123")
            print("=" * 60)
        except Exception as e:
            db.rollback()
            print("\n" + "=" * 60)
            print(f"❌ Database seeding FAILED: {e}")
            print("=" * 60)
            raise


if __name__ == "__main__":
    seed()
