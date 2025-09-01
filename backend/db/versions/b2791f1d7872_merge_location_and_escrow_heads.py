"""merge location and escrow heads

Revision ID: b2791f1d7872
Revises: "('a1b2c3d4e5f7', 'f6697ed1d4b7')"
Create Date: 2025-09-01 18:14:23.195350

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b2791f1d7872'
down_revision = ('a1b2c3d4e5f7', 'f6697ed1d4b7')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass 