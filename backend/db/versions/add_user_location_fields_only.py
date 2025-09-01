"""Add location fields to users table only

Revision ID: a1b2c3d4e5f8
Revises: b2c3d4e5f6a7
Create Date: 2025-09-01 18:17:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f8'
down_revision = 'b2c3d4e5f6a7'
depends_on = None


def upgrade() -> None:
    # Add location fields to users table only
    op.add_column('users', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('longitude', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('city', sa.String(), nullable=True))
    op.add_column('users', sa.Column('country', sa.String(), nullable=True))
    op.add_column('users', sa.Column('timezone_name', sa.String(), nullable=True))
    
    # Create index for location-based queries
    op.create_index('ix_users_location', 'users', ['latitude', 'longitude'])


def downgrade() -> None:
    # Drop index
    op.drop_index('ix_users_location', table_name='users')
    
    # Remove columns from users table
    op.drop_column('users', 'timezone_name')
    op.drop_column('users', 'country')
    op.drop_column('users', 'city')
    op.drop_column('users', 'longitude')
    op.drop_column('users', 'latitude')
