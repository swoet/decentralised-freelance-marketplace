"""Add location fields to users and events tables

Revision ID: a1b2c3d4e5f7
Revises: f6a7b8c9d0e1
Create Date: 2025-01-09 16:58:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f7'
down_revision = 'f6a7b8c9d0e1'
depends_on = None


def upgrade() -> None:
    # Add location fields to users table
    op.add_column('users', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('longitude', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('city', sa.String(), nullable=True))
    op.add_column('users', sa.Column('country', sa.String(), nullable=True))
    op.add_column('users', sa.Column('timezone_name', sa.String(), nullable=True))
    
    # Add location and metadata fields to events table
    op.add_column('events', sa.Column('location_name', sa.String(), nullable=True))
    op.add_column('events', sa.Column('location_address', sa.String(), nullable=True))
    op.add_column('events', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('events', sa.Column('longitude', sa.Float(), nullable=True))
    op.add_column('events', sa.Column('external_id', sa.String(), nullable=True))
    op.add_column('events', sa.Column('external_url', sa.String(), nullable=True))
    op.add_column('events', sa.Column('source', sa.String(), nullable=True))
    op.add_column('events', sa.Column('category', sa.String(), nullable=True))
    op.add_column('events', sa.Column('is_online', sa.Boolean(), nullable=True, default=False))
    op.add_column('events', sa.Column('is_free', sa.Boolean(), nullable=True, default=True))
    op.add_column('events', sa.Column('author_id', sa.String(), nullable=True))
    
    # Create unique constraint on external_id
    op.create_unique_constraint('uq_events_external_id', 'events', ['external_id'])
    
    # Create foreign key constraint for author_id
    op.create_foreign_key('fk_events_author_id', 'events', 'users', ['author_id'], ['id'])
    
    # Create indexes for location-based queries
    op.create_index('ix_events_location', 'events', ['latitude', 'longitude'])
    op.create_index('ix_users_location', 'users', ['latitude', 'longitude'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_users_location', table_name='users')
    op.drop_index('ix_events_location', table_name='events')
    
    # Drop foreign key constraint
    op.drop_constraint('fk_events_author_id', 'events', type_='foreignkey')
    
    # Drop unique constraint
    op.drop_constraint('uq_events_external_id', 'events', type_='unique')
    
    # Remove columns from events table
    op.drop_column('events', 'author_id')
    op.drop_column('events', 'is_free')
    op.drop_column('events', 'is_online')
    op.drop_column('events', 'category')
    op.drop_column('events', 'source')
    op.drop_column('events', 'external_url')
    op.drop_column('events', 'external_id')
    op.drop_column('events', 'longitude')
    op.drop_column('events', 'latitude')
    op.drop_column('events', 'location_address')
    op.drop_column('events', 'location_name')
    
    # Remove columns from users table
    op.drop_column('users', 'timezone_name')
    op.drop_column('users', 'country')
    op.drop_column('users', 'city')
    op.drop_column('users', 'longitude')
    op.drop_column('users', 'latitude')
