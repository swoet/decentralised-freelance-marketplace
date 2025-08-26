"""
add community models

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2025-08-26
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None

SCHEMA = 'marketplace'

def upgrade() -> None:
    # community_threads
    op.create_table(
        'community_threads',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('author_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.users.id'), nullable=False),
        sa.Column('tags', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        schema=SCHEMA,
    )
    op.create_index('ix_community_threads_author_id', 'community_threads', ['author_id'], schema=SCHEMA)

    # community_posts
    op.create_table(
        'community_posts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('thread_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.community_threads.id', ondelete='CASCADE'), nullable=False),
        sa.Column('author_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.users.id'), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        schema=SCHEMA,
    )
    op.create_index('ix_community_posts_thread_id', 'community_posts', ['thread_id'], schema=SCHEMA)
    op.create_index('ix_community_posts_author_id', 'community_posts', ['author_id'], schema=SCHEMA)

    # events
    op.create_table(
        'events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('ends_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('link', sa.String(), nullable=True),
        schema=SCHEMA,
    )


def downgrade() -> None:
    op.drop_table('events', schema=SCHEMA)
    op.drop_index('ix_community_posts_author_id', table_name='community_posts', schema=SCHEMA)
    op.drop_index('ix_community_posts_thread_id', table_name='community_posts', schema=SCHEMA)
    op.drop_table('community_posts', schema=SCHEMA)
    op.drop_index('ix_community_threads_author_id', table_name='community_threads', schema=SCHEMA)
    op.drop_table('community_threads', schema=SCHEMA)
