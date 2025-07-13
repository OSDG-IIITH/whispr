"""Remove avatar_url column from users table

Revision ID: remove_avatar_url
Revises: [replace_with_latest_revision]
Create Date: 2025-01-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'remove_avatar_url'
down_revision = None  # This should be set to the latest revision
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Remove avatar_url column from users table."""
    # Remove the avatar_url column
    op.drop_column('users', 'avatar_url')


def downgrade() -> None:
    """Add back avatar_url column to users table."""
    # Add back the avatar_url column
    op.add_column('users', sa.Column('avatar_url', sa.Text(), nullable=True))