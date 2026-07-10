"""add response_tracker table

Revision ID: 2a1b3c4d5e6f
Revises: 7237149c5f05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2a1b3c4d5e6f"
down_revision: Union[str, Sequence[str], None] = "7237149c5f05"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the response_tracker table using raw SQL."""
    # Create the enum type idempotently (PL/pgSQL DO block is the only way pre-PG14)
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'responsestatus') THEN
                CREATE TYPE responsestatus AS ENUM ('pending', 'accepted', 'declined');
            END IF;
        END
        $$;
        """
    )

    # Create the table with raw SQL so Alembic doesn't try to manage the enum type
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS response_tracker (
            id SERIAL PRIMARY KEY,
            analysis_id INTEGER NOT NULL REFERENCES repository_analysis(id) ON DELETE CASCADE,
            contributor_match_id INTEGER REFERENCES contributor_matches(id) ON DELETE SET NULL,
            outreach_message_id INTEGER REFERENCES outreach_messages(id) ON DELETE SET NULL,
            status responsestatus NOT NULL DEFAULT 'pending',
            responded_at TIMESTAMP WITHOUT TIME ZONE,
            notes TEXT,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
        );
        """
    )

    # Create indexes
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_response_tracker_analysis_id "
        "ON response_tracker(analysis_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_response_tracker_status "
        "ON response_tracker(status)"
    )


def downgrade() -> None:
    """Drop the response_tracker table and clean up the enum type."""
    op.execute("DROP TABLE IF EXISTS response_tracker CASCADE")
    op.execute("DROP TYPE IF EXISTS responsestatus")
