"""
Database seed script for SecondCommit.

Creates realistic interconnected demo data for hackathon demonstration.

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

# Ensure the app package is importable
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


def seed():
    engine = create_engine(str(settings.DATABASE_URL))
    
    with Session(engine) as db:
        # ──────────────────────────────────────────
        # 1. Users
        # ──────────────────────────────────────────
        print("Creating users...")

        startup = User(
            name="Alex Startup",
            email="startup@demo.com",
            password_hash=hash_password("password123"),
            role=UserRole.STARTUP,
            github_username=None,
            is_verified=True,
            token_version=0,
            created_at=datetime.now(timezone.utc) - timedelta(days=30),
        )
        freelancer = User(
            name="Jamie Freelancer",
            email="freelancer@demo.com",
            password_hash=hash_password("password123"),
            role=UserRole.FREELANCER,
            github_username="jami3-dev",
            is_verified=True,
            token_version=0,
            created_at=datetime.now(timezone.utc) - timedelta(days=20),
        )
        admin = User(
            name="Admin User",
            email="admin@demo.com",
            password_hash=hash_password("password123"),
            role=UserRole.ADMIN,
            github_username=None,
            is_verified=True,
            token_version=0,
            created_at=datetime.now(timezone.utc) - timedelta(days=60),
        )
        db.add_all([startup, freelancer, admin])
        db.commit()
        db.refresh(startup)
        db.refresh(freelancer)
        db.refresh(admin)

        # ──────────────────────────────────────────
        # 2. Freelancer Profile
        # ──────────────────────────────────────────
        print("Creating freelancer profile...")

        profile = FreelancerProfile(
            user_id=freelancer.id,
            bio="Full-stack developer with 5+ years of experience in React, Python, and cloud infrastructure.",
            experience_level="senior",
            portfolio="https://github.com/jami3-dev",
            linkedin="https://linkedin.com/in/jami3-dev",
            skills=["React", "TypeScript", "Python", "FastAPI", "PostgreSQL", "Docker", "AWS", "GraphQL"],
            tech_stack=["React", "TypeScript", "Python", "FastAPI", "PostgreSQL"],
            priority_score=85,
        )
        db.add(profile)

        # ──────────────────────────────────────────
        # 3. Ideas
        # ──────────────────────────────────────────
        print("Creating ideas...")

        now = datetime.now(timezone.utc)

        idea1 = Idea(
            owner_id=startup.id,
            original_prompt="Build an AI-powered code review assistant that automatically reviews pull requests and suggests improvements based on best practices.",
            voice_transcript="I want to create a tool that uses AI to automatically review code in pull requests and suggest improvements.",
            refined_prompt="An intelligent code review automation platform that integrates with GitHub to analyze pull requests in real-time. The system uses machine learning to detect code quality issues, security vulnerabilities, and deviations from best practices, providing actionable suggestions directly within the PR workflow.",
            status=IdeaStatus.ANALYZED,
            created_at=now - timedelta(days=25),
        )
        idea2 = Idea(
            owner_id=startup.id,
            original_prompt="Create a platform that connects open-source maintainers with contributors who want to revive abandoned but valuable projects.",
            voice_transcript="A platform to match people who want to contribute with open source projects that have been abandoned.",
            refined_prompt="A community-driven marketplace connecting skilled developers with abandoned open-source projects in need of revival. The platform uses skill matching, project health scoring, and automated outreach to facilitate project handoffs and community-driven maintenance.",
            status=IdeaStatus.ANALYZED,
            created_at=now - timedelta(days=18),
        )
        idea3 = Idea(
            owner_id=startup.id,
            original_prompt="Develop a developer productivity dashboard that aggregates metrics from GitHub, Jira, and CI/CD pipelines into a single unified view.",
            voice_transcript=None,
            refined_prompt="A unified developer productivity intelligence platform that aggregates metrics from GitHub, Jira, and CI/CD pipelines. Features include team velocity tracking, bottleneck identification, sprint health scoring, and automated standup report generation.",
            status=IdeaStatus.APPROVED,
            created_at=now - timedelta(days=10),
        )
        idea4 = Idea(
            owner_id=startup.id,
            original_prompt="Build a documentation generator that automatically creates and maintains API documentation from code comments and type definitions.",
            voice_transcript="Auto-generate API docs from code comments.",
            refined_prompt=None,
            status=IdeaStatus.DRAFT,
            created_at=now - timedelta(days=3),
        )
        db.add_all([idea1, idea2, idea3, idea4])
        db.commit()

        # ──────────────────────────────────────────
        # 4. Repositories (from GitHub search)
        # ──────────────────────────────────────────
        print("Creating repositories...")

        repos = [
            Repository(
                idea_id=idea1.id,
                github_repo_id=12345678,
                owner="facebook",
                repo_name="react",
                url="https://github.com/facebook/react",
                description="A declarative, efficient, and flexible JavaScript library for building user interfaces.",
                stars=230000,
                forks=47000,
                language="JavaScript",
                license="MIT",
                last_commit=now - timedelta(hours=2),
                is_selected=True,
                created_at=now - timedelta(days=24),
            ),
            Repository(
                idea_id=idea1.id,
                github_repo_id=23456789,
                owner="vercel",
                repo_name="next.js",
                url="https://github.com/vercel/next.js",
                description="The React framework for production.",
                stars=128000,
                forks=27000,
                language="JavaScript",
                license="MIT",
                last_commit=now - timedelta(hours=5),
                is_selected=False,
                created_at=now - timedelta(days=24),
            ),
            Repository(
                idea_id=idea1.id,
                github_repo_id=34567890,
                owner="palantir",
                repo_name="blueprint",
                url="https://github.com/palantir/blueprint",
                description="A React-based UI toolkit for the web.",
                stars=21000,
                forks=2200,
                language="TypeScript",
                license="Apache-2.0",
                last_commit=now - timedelta(days=3),
                is_selected=False,
                created_at=now - timedelta(days=24),
            ),
            Repository(
                idea_id=idea2.id,
                github_repo_id=45678901,
                owner="sveltejs",
                repo_name="svelte",
                url="https://github.com/sveltejs/svelte",
                description="Cybernetically enhanced web apps.",
                stars=81000,
                forks=4500,
                language="JavaScript",
                license="MIT",
                last_commit=now - timedelta(hours=12),
                is_selected=True,
                created_at=now - timedelta(days=17),
            ),
            Repository(
                idea_id=idea3.id,
                github_repo_id=56789012,
                owner="microsoft",
                repo_name="TypeScript",
                url="https://github.com/microsoft/TypeScript",
                description="TypeScript is a superset of JavaScript that compiles to clean JavaScript output.",
                stars=102000,
                forks=13000,
                language="TypeScript",
                license="Apache-2.0",
                last_commit=now - timedelta(hours=1),
                is_selected=False,
                created_at=now - timedelta(days=9),
            ),
        ]
        db.add_all(repos)
        db.commit()

        # ──────────────────────────────────────────
        # 5. GitHub Snapshots
        # ──────────────────────────────────────────
        print("Creating GitHub snapshots...")

        snapshots = [
            GitHubRepositorySnapshot(
                repository_id=repos[0].id,  # react
                stars=230000,
                forks=47000,
                open_issues=1200,
                commits_count=85000,
                pull_requests_count=45000,
                releases_count=250,
                contributors_count=1800,
                latest_commit_date=now - timedelta(hours=2),
                languages=["JavaScript", "TypeScript", "JSX"],
                topics=["react", "ui", "frontend", "javascript", "declarative"],
                license="MIT",
                readme="React is a JavaScript library for building user interfaces.\n\n## Getting Started\n\nThis is a demo readme for the seed script.",
                raw_snapshot={},
            ),
            GitHubRepositorySnapshot(
                repository_id=repos[3].id,  # svelte
                stars=81000,
                forks=4500,
                open_issues=800,
                commits_count=32000,
                pull_requests_count=18000,
                releases_count=120,
                contributors_count=600,
                latest_commit_date=now - timedelta(hours=6),
                languages=["JavaScript", "TypeScript"],
                topics=["svelte", "framework", "compiler", "frontend"],
                license="MIT",
                readme="Svelte is a radical new approach to building user interfaces.",
                raw_snapshot={},
            ),
        ]
        db.add_all(snapshots)
        db.commit()

        # ──────────────────────────────────────────
        # 6. Repository Analyses
        # ──────────────────────────────────────────
        print("Creating analyses...")

        analysis1 = RepositoryAnalysis(
            repository_id=repos[0].id,  # react
            executive_summary="React is a mature, widely-adopted library with excellent documentation and a strong community. It shows all signs of being a healthy, actively maintained project that is safe to revive for new feature development. The revival score is high due to the massive contributor base and strong ecosystem support.",
            revival_score=85,
            project_health_score=92,
            documentation_score=88,
            technical_debt_score=25,
            trend_score=90,
            safe_to_revive=True,
            ai_effort_percentage=35.0,
            human_effort_percentage=65.0,
            analysis_metadata={"skill_summary": "React, TypeScript, Testing, Performance"},
            created_at=now - timedelta(days=23),
        )
        analysis2 = RepositoryAnalysis(
            repository_id=repos[3].id,  # svelte
            executive_summary="Svelte represents a modern approach to frontend development with growing adoption. While the community is smaller than React's, the project is well-maintained with clear documentation and an active core team. Revival efforts would benefit from the compiler-based architecture that reduces runtime overhead.",
            revival_score=78,
            project_health_score=85,
            documentation_score=80,
            technical_debt_score=30,
            trend_score=82,
            safe_to_revive=True,
            ai_effort_percentage=40.0,
            human_effort_percentage=60.0,
            analysis_metadata={"skill_summary": "Svelte, JavaScript, Compiler Design, Testing"},
            created_at=now - timedelta(days=16),
        )
        db.add_all([analysis1, analysis2])
        db.commit()

        # ──────────────────────────────────────────
        # 7. Analysis Findings
        # ──────────────────────────────────────────
        print("Creating findings...")

        findings = [
            # Analysis 1 findings (React)
            AnalysisFinding(
                analysis_id=analysis1.id,
                type=FindingType.ISSUE.value,
                severity=Severity.HIGH.value,
                title="Large bundle size impact",
                description="The React library bundle size has grown significantly with recent versions, impacting initial load times for end users.",
                recommendation="Implement code splitting and lazy loading patterns. Consider using React.lazy() and Suspense for route-based splitting.",
            ),
            AnalysisFinding(
                analysis_id=analysis1.id,
                type=FindingType.FEATURE.value,
                severity=Severity.MEDIUM.value,
                title="Server component integration needed",
                description="React Server Components are still in experimental phase and not fully integrated with all major frameworks.",
                recommendation="Invest in RSC infrastructure and provide migration guides for existing applications.",
            ),
            AnalysisFinding(
                analysis_id=analysis1.id,
                type=FindingType.RISK.value,
                severity=Severity.CRITICAL.value,
                title="Concurrent mode stability concerns",
                description="Concurrent features may introduce subtle bugs in complex state management scenarios.",
                recommendation="Increase test coverage for concurrent rendering paths and provide better debugging tools.",
            ),
            AnalysisFinding(
                analysis_id=analysis1.id,
                type=FindingType.AI_TASK.value,
                severity=Severity.LOW.value,
                title="Automated test generation",
                description="Many components lack comprehensive unit tests, especially for edge cases.",
                recommendation="Use AI-powered test generation tools to automatically create test suites for existing components.",
            ),
            AnalysisFinding(
                analysis_id=analysis1.id,
                type=FindingType.HUMAN_TASK.value,
                severity=Severity.MEDIUM.value,
                title="Accessibility audit required",
                description="Accessibility compliance needs manual review and remediation.",
                recommendation="Conduct a full WCAG 2.1 AA audit and fix identified issues.",
            ),
            # Analysis 2 findings (Svelte)
            AnalysisFinding(
                analysis_id=analysis2.id,
                type=FindingType.ISSUE.value,
                severity=Severity.MEDIUM.value,
                title="Limited ecosystem maturity",
                description="Svelte's ecosystem is smaller compared to React and Vue, with fewer third-party libraries and tools.",
                recommendation="Focus on building essential ecosystem tools and encouraging community contributions.",
            ),
            AnalysisFinding(
                analysis_id=analysis2.id,
                type=FindingType.FEATURE.value,
                severity=Severity.HIGH.value,
                title="TypeScript support gaps",
                description="Some advanced TypeScript patterns are not fully supported in Svelte components.",
                recommendation="Improve TypeScript integration and provide better type inference for Svelte stores and reactive statements.",
            ),
            AnalysisFinding(
                analysis_id=analysis2.id,
                type=FindingType.RISK.value,
                severity=Severity.LOW.value,
                title="Smaller talent pool",
                description="Finding experienced Svelte developers is harder than for mainstream frameworks.",
                recommendation="Invest in developer education, create learning resources, and build a strong community program.",
            ),
        ]
        db.add_all(findings)
        db.commit()

        # ──────────────────────────────────────────
        # 8. Required Roles
        # ──────────────────────────────────────────
        print("Creating required roles...")

        roles = [
            # Analysis 1 roles
            RequiredRole(analysis_id=analysis1.id, role="Senior React Engineer", priority=1, reason="Core framework expertise needed for component architecture and performance optimization."),
            RequiredRole(analysis_id=analysis1.id, role="TypeScript Developer", priority=2, reason="TypeScript integration and type definition maintenance."),
            RequiredRole(analysis_id=analysis1.id, role="Test Engineer", priority=3, reason="Comprehensive test suite creation and QA automation."),
            RequiredRole(analysis_id=analysis1.id, role="Documentation Writer", priority=4, reason="API documentation and migration guide creation."),
            RequiredRole(analysis_id=analysis1.id, role="Accessibility Specialist", priority=5, reason="WCAG compliance audit and remediation."),
            # Analysis 2 roles
            RequiredRole(analysis_id=analysis2.id, role="Svelte Core Developer", priority=1, reason="Deep framework understanding for compiler and runtime improvements."),
            RequiredRole(analysis_id=analysis2.id, role="TypeScript Compiler Engineer", priority=2, reason="TypeScript integration and type inference system improvements."),
            RequiredRole(analysis_id=analysis2.id, role="DevTools Engineer", priority=3, reason="Developer tooling and debugging experience improvements."),
        ]
        db.add_all(roles)
        db.commit()

        # ──────────────────────────────────────────
        # 9. Contributor Matches
        # ──────────────────────────────────────────
        print("Creating contributor matches...")

        contributors = [
            # Analysis 1 contributors
            ContributorMatch(
                analysis_id=analysis1.id,
                github_username="jami3-dev",
                github_profile="https://github.com/jami3-dev",
                avatar_url="https://avatars.githubusercontent.com/u/123456?v=4",
                match_score=92.5,
                recent_activity_score=88.0,
                matched_skills=["React", "TypeScript", "Testing", "Performance Optimization"],
                recent_repositories=["react-component-library", "typescript-utils", "testing-tools"],
                recommendation_reason="Excellent match with React and TypeScript expertise. Active contributor to similar projects with strong testing background.",
            ),
            ContributorMatch(
                analysis_id=analysis1.id,
                github_username="sarah-codes",
                github_profile="https://github.com/sarah-codes",
                avatar_url=None,
                match_score=85.3,
                recent_activity_score=92.0,
                matched_skills=["React", "GraphQL", "Node.js", "Documentation"],
                recent_repositories=["graphql-api", "react-native-app", "docs-generator"],
                recommendation_reason="Strong frontend expertise with GraphQL integration. Excellent documentation skills for API guides.",
            ),
            ContributorMatch(
                analysis_id=analysis1.id,
                github_username="dev-marcus",
                github_profile="https://github.com/dev-marcus",
                avatar_url=None,
                match_score=78.1,
                recent_activity_score=75.5,
                matched_skills=["JavaScript", "CSS", "Accessibility", "UX Design"],
                recent_repositories=["design-system", "a11y-checker", "css-framework"],
                recommendation_reason="Specialized in accessibility and design systems. Valuable for WCAG compliance work.",
            ),
            # Analysis 2 contributors
            ContributorMatch(
                analysis_id=analysis2.id,
                github_username="jami3-dev",
                github_profile="https://github.com/jami3-dev",
                avatar_url="https://avatars.githubusercontent.com/u/123456?v=4",
                match_score=76.8,
                recent_activity_score=88.0,
                matched_skills=["JavaScript", "Svelte", "TypeScript", "Build Tools"],
                recent_repositories=["svelte-component-lib", "vite-plugin", "build-tools"],
                recommendation_reason="Has Svelte experience and build tool expertise. Good fit for compiler tooling improvements.",
            ),
            ContributorMatch(
                analysis_id=analysis2.id,
                github_username="priya-dev",
                github_profile="https://github.com/priya-dev",
                avatar_url=None,
                match_score=88.2,
                recent_activity_score=95.0,
                matched_skills=["TypeScript", "Compiler Design", "Svelte", "Rust"],
                recent_repositories=["svelte-compiler", "typescript-plugins", "rust-wasm"],
                recommendation_reason="Deep TypeScript and compiler design experience. Ideal for type system improvements in Svelte.",
            ),
        ]
        db.add_all(contributors)
        db.commit()

        # ──────────────────────────────────────────
        # 10. Outreach Messages
        # ──────────────────────────────────────────
        print("Creating outreach messages...")

        messages = [
            OutreachMessage(
                analysis_id=analysis1.id,
                recipient="jami3-dev",
                type=OutreachType.CONTRIBUTOR.value,
                generated_message="Hi Jamie! I came across your excellent work on React component libraries and testing tools. We're working on reviving the React project with a focus on improving bundle size, accessibility, and test coverage — areas where your skills would be incredibly valuable. Your experience with TypeScript and performance optimization aligns perfectly with our needs. Would you be interested in discussing how we might collaborate on this?",
                created_at=now - timedelta(days=20),
            ),
            OutreachMessage(
                analysis_id=analysis1.id,
                recipient="sarah-codes",
                type=OutreachType.CONTRIBUTOR.value,
                generated_message="Hi Sarah! Your combination of React expertise and documentation skills caught my attention. We're looking to improve the developer experience and documentation quality for the React project revival. Your work on docs-generator and GraphQL API shows exactly the kind of clear communication we need. Would love to chat about potential collaboration!",
                created_at=now - timedelta(days=19),
            ),
            OutreachMessage(
                analysis_id=analysis1.id,
                recipient="dev-marcus",
                type=OutreachType.CONTRIBUTOR.value,
                generated_message="Hi Marcus! Your focus on accessibility and design systems is exactly what we need for the React project revival. We're planning a comprehensive WCAG 2.1 AA audit followed by remediation work. Your experience with a11y-checker and design system development makes you an ideal candidate to lead this effort. Interested in joining?",
                created_at=now - timedelta(days=18),
            ),
        ]
        db.add_all(messages)
        db.commit()

        # ──────────────────────────────────────────
        # 11. Response Trackers
        # ──────────────────────────────────────────
        print("Creating response trackers...")

        trackers = [
            ResponseTracker(
                analysis_id=analysis1.id,
                contributor_match_id=contributors[0].id,  # jami3-dev — freelancer
                outreach_message_id=messages[0].id,
                status=ResponseStatus.ACCEPTED,
                responded_at=now - timedelta(days=15),
                notes="Excited to join the project!",
                created_at=now - timedelta(days=20),
                updated_at=now - timedelta(days=15),
            ),
            ResponseTracker(
                analysis_id=analysis1.id,
                contributor_match_id=contributors[1].id,  # sarah-codes
                outreach_message_id=messages[1].id,
                status=ResponseStatus.PENDING,
                responded_at=None,
                notes=None,
                created_at=now - timedelta(days=19),
                updated_at=now - timedelta(days=19),
            ),
            ResponseTracker(
                analysis_id=analysis1.id,
                contributor_match_id=contributors[2].id,  # dev-marcus
                outreach_message_id=messages[2].id,
                status=ResponseStatus.DECLINED,
                responded_at=now - timedelta(days=10),
                notes="Currently occupied with other commitments.",
                created_at=now - timedelta(days=18),
                updated_at=now - timedelta(days=10),
            ),
        ]
        db.add_all(trackers)
        db.commit()

        print("\n" + "=" * 60)
        print("✅ Database seeded successfully!")
        print("=" * 60)
        print("\n📋 Demo Accounts:")
        print("   Startup Owner: startup@demo.com / password123")
        print("   Freelancer:    freelancer@demo.com / password123")
        print("   Admin:         admin@demo.com / password123")
        print("\n📊 Seeded Data:")
        print("   - 3 Users (startup, freelancer, admin)")
        print("   - 4 Ideas (2 analyzed, 1 approved, 1 draft)")
        print(f"   - {len(repos)} Repositories")
        print("   - 2 GitHub Snapshots")
        print("   - 2 Repository Analyses")
        print(f"   - {len(findings)} Analysis Findings")
        print(f"   - {len(roles)} Required Roles")
        print(f"   - {len(contributors)} Contributor Matches")
        print(f"   - {len(messages)} Outreach Messages")
        print(f"   - {len(trackers)} Response Trackers")
        print("   - 1 Freelancer Profile")
        print("\n💡 Complete Demo Flow Available:")
        print("   Startup Owner → Creates Idea → Refines → Approves")
        print("   → Searches Repos → Selects → Runs Analysis")
        print("   → Views Report → Recommends Contributors")
        print("   → Generates Outreach")
        print("=" * 60)


if __name__ == "__main__":
    seed()
