"""merge heads

Revision ID: ea93858290d3
Revises: "('a1b2c3d4e5f8', 'b2791f1d7872')"
Create Date: 2025-09-01 18:24:32.828331

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ea93858290d3'
down_revision = ('a1b2c3d4e5f8', 'b2791f1d7872')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass 