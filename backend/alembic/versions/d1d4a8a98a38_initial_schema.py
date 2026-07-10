"""initial_schema

Revision ID: d1d4a8a98a38
Revises:

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d1d4a8a98a38"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()

    # ── Safe enum creation: use raw SQL with pg_type check ──
    enum_defs = {
        "userrole": "'STARTUP', 'FREELANCER', 'ADMIN'",
        "ideastatus": "'DRAFT', 'APPROVED', 'COMPLETED'",
        "findingtype": "'ISSUE', 'FEATURE', 'AI_TASK', 'HUMAN_TASK', 'RISK'",
        "severity": "'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'",
        "outreachtype": "'OWNER', 'CONTRIBUTOR'",
    }
    for enum_name, enum_values in enum_defs.items():
        if bind.dialect.name == "postgresql":
            result = bind.execute(
                sa.text("SELECT 1 FROM pg_type WHERE typname = :name"),
                {"name": enum_name},
            ).fetchone()
            if not result:
                op.execute(f"CREATE TYPE {enum_name} AS ENUM ({enum_values})")
        else:
            # Non-PostgreSQL: use SQLAlchemy's create with checkfirst
            values = [v.strip("'") for v in enum_values.split(", ")]
            sa.Enum(*values, name=enum_name).create(bind, checkfirst=True)

    # ── Table creation via raw SQL (avoids SQLAlchemy's _on_table_create bug) ──

    op.execute("""
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(255) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role userrole NOT NULL,
            github_username VARCHAR(100),
            is_verified BOOLEAN NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL
        )
    """)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.execute("""
        CREATE TABLE freelancer_profiles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            bio VARCHAR(600),
            experience_level VARCHAR(60),
            portfolio VARCHAR(255),
            linkedin VARCHAR(255),
            resume VARCHAR(255),
            priority_score FLOAT NOT NULL DEFAULT 0,
            skills JSON NOT NULL DEFAULT '[]',
            tech_stack JSON NOT NULL DEFAULT '[]',
            UNIQUE(user_id)
        )
    """)

    op.execute("""
        CREATE TABLE ideas (
            id SERIAL PRIMARY KEY,
            owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            original_prompt TEXT NOT NULL,
            refined_prompt TEXT,
            status ideastatus NOT NULL DEFAULT 'DRAFT',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL
        )
    """)

    op.execute("""
        CREATE TABLE repositories (
            id SERIAL PRIMARY KEY,
            idea_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
            github_repo_id INTEGER NOT NULL,
            owner VARCHAR(100) NOT NULL,
            repo_name VARCHAR(150) NOT NULL,
            url VARCHAR(300) NOT NULL,
            description TEXT,
            stars INTEGER NOT NULL DEFAULT 0,
            forks INTEGER NOT NULL DEFAULT 0,
            language VARCHAR(50),
            license VARCHAR(80),
            last_commit TIMESTAMP WITH TIME ZONE,
            is_selected BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL
        )
    """)
    op.create_index("ix_repositories_github_repo_id", "repositories", ["github_repo_id"])

    op.execute("""
        CREATE TABLE github_repository_snapshots (
            id SERIAL PRIMARY KEY,
            repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
            default_branch VARCHAR(100) NOT NULL,
            latest_commit_sha VARCHAR(64) NOT NULL,
            latest_commit_date TIMESTAMP WITH TIME ZONE NOT NULL,
            stars INTEGER NOT NULL DEFAULT 0,
            forks INTEGER NOT NULL DEFAULT 0,
            open_issues INTEGER NOT NULL DEFAULT 0,
            watchers INTEGER NOT NULL DEFAULT 0,
            contributors_count INTEGER NOT NULL DEFAULT 0,
            commits_count INTEGER NOT NULL DEFAULT 0,
            pull_requests_count INTEGER NOT NULL DEFAULT 0,
            releases_count INTEGER NOT NULL DEFAULT 0,
            languages JSON NOT NULL DEFAULT '[]',
            topics JSON NOT NULL DEFAULT '[]',
            raw_snapshot JSON NOT NULL DEFAULT '{}',
            snapshot_version VARCHAR(64) NOT NULL,
            etag VARCHAR(255),
            fetched_at TIMESTAMP WITH TIME ZONE NOT NULL,
            UNIQUE(repository_id)
        )
    """)

    op.execute("""
        CREATE TABLE repository_analysis (
            id SERIAL PRIMARY KEY,
            repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
            executive_summary TEXT NOT NULL,
            revival_score INTEGER NOT NULL DEFAULT 0,
            project_health_score INTEGER NOT NULL DEFAULT 0,
            documentation_score INTEGER NOT NULL DEFAULT 0,
            technical_debt_score INTEGER NOT NULL DEFAULT 0,
            trend_score INTEGER NOT NULL DEFAULT 0,
            safe_to_revive BOOLEAN NOT NULL DEFAULT FALSE,
            ai_effort_percentage FLOAT NOT NULL DEFAULT 0,
            human_effort_percentage FLOAT NOT NULL DEFAULT 0,
            analysis_metadata JSON NOT NULL DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            UNIQUE(repository_id)
        )
    """)

    op.execute("""
        CREATE TABLE analysis_findings (
            id SERIAL PRIMARY KEY,
            analysis_id INTEGER NOT NULL REFERENCES repository_analysis(id) ON DELETE CASCADE,
            type findingtype NOT NULL,
            severity severity NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            recommendation TEXT NOT NULL
        )
    """)
    op.create_index(
        "ix_analysis_findings_analysis_id", "analysis_findings", ["analysis_id"]
    )

    op.execute("""
        CREATE TABLE contributor_matches (
            id SERIAL PRIMARY KEY,
            analysis_id INTEGER NOT NULL REFERENCES repository_analysis(id) ON DELETE CASCADE,
            github_username VARCHAR(100) NOT NULL,
            github_profile VARCHAR(255) NOT NULL,
            avatar_url VARCHAR(500),
            match_score FLOAT NOT NULL DEFAULT 0,
            recent_activity_score FLOAT NOT NULL DEFAULT 0,
            matched_skills JSON NOT NULL DEFAULT '[]',
            recent_repositories JSON NOT NULL DEFAULT '[]',
            recommendation_reason VARCHAR(500) NOT NULL
        )
    """)

    op.execute("""
        CREATE TABLE outreach_messages (
            id SERIAL PRIMARY KEY,
            analysis_id INTEGER NOT NULL REFERENCES repository_analysis(id) ON DELETE CASCADE,
            recipient VARCHAR NOT NULL,
            type outreachtype NOT NULL,
            generated_message TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL
        )
    """)

    op.execute("""
        CREATE TABLE required_roles (
            id SERIAL PRIMARY KEY,
            analysis_id INTEGER NOT NULL REFERENCES repository_analysis(id) ON DELETE CASCADE,
            role VARCHAR(100) NOT NULL,
            priority INTEGER NOT NULL DEFAULT 0,
            reason VARCHAR(500) NOT NULL
        )
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("required_roles")
    op.drop_table("outreach_messages")
    op.drop_table("contributor_matches")
    op.drop_index(
        op.f("ix_analysis_findings_analysis_id"), table_name="analysis_findings"
    )
    op.drop_table("analysis_findings")
    op.drop_table("repository_analysis")
    op.drop_table("github_repository_snapshots")
    op.drop_index(
        op.f("ix_repositories_github_repo_id"), table_name="repositories"
    )
    op.drop_table("repositories")
    op.drop_table("ideas")
    op.drop_table("freelancer_profiles")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    # ── Drop enum types ──
    sa.Enum(name="userrole").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="ideastatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="findingtype").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="severity").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="outreachtype").drop(op.get_bind(), checkfirst=True)
