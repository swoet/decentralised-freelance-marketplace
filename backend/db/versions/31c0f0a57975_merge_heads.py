"""merge_heads

Revision ID: 31c0f0a57975
Revises: "('004_add_ai_matching_tables', 'f6a7b8c9d0e1')"
Create Date: 2025-08-26 13:27:39.151920

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '31c0f0a57975'
down_revision = ('004_add_ai_matching_tables', 'f6a7b8c9d0e1')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass 