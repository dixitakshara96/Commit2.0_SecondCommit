"""add_idea_status_values_and_repo_status

Revision ID: d9e8c7b6a543
Revises: 6161cb5b1269

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd9e8c7b6a543'
down_revision: Union[str, Sequence[str], None] = '6161cb5b1269'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


old_idea_statuses = ('DRAFT', 'APPROVED', 'COMPLETED')
new_idea_statuses = ('DRAFT', 'REFINED', 'APPROVED', 'ANALYZED', 'COMPLETED')

old_idea_type = sa.Enum(*old_idea_statuses, name='ideastatus')
new_idea_type = sa.Enum(*new_idea_statuses, name='ideastatus')


def upgrade() -> None:
    """Upgrade schema."""
    # Add REFINED and ANALYZED to ideastatus enum
    op.execute("ALTER TYPE ideastatus ADD VALUE 'REFINED'")
    op.execute("ALTER TYPE ideastatus ADD VALUE 'ANALYZED'")


def downgrade() -> None:
    """Downgrade schema."""
    # PostgreSQL doesn't support removing enum values directly.
    # We need to create a new type, convert, and drop the old one.
    op.execute("ALTER TYPE ideastatus RENAME TO ideastatus_old")
    op.execute(f"CREATE TYPE ideastatus AS ENUM({','.join(repr(s) for s in old_idea_statuses)})")
    op.execute(
        "ALTER TABLE ideas ALTER COLUMN status TYPE ideastatus USING "
        "status::text::ideastatus"
    )
    op.execute("DROP TYPE ideastatus_old")
