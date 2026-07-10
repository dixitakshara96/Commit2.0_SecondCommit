"""merge conflicting heads

Revision ID: 509904b8f9d9
Revises: ac2299d89a9b, d9e8c7b6a543

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '509904b8f9d9'
down_revision: Union[str, Sequence[str], None] = ('ac2299d89a9b', 'd9e8c7b6a543')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
