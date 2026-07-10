"""add_voice_transcript_to_ideas

Revision ID: 6161cb5b1269
Revises: d1d4a8a98a38

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6161cb5b1269'
down_revision: Union[str, Sequence[str], None] = 'd1d4a8a98a38'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'ideas',
        sa.Column('voice_transcript', sa.Text(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('ideas', 'voice_transcript')
