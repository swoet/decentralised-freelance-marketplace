"""
add skills and reputation tables

Revision ID: a1b2c3d4e5f6
Revises: 9e608b90bfd2
Create Date: 2025-08-26
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '9e608b90bfd2'
branch_labels = None
depends_on = None

SCHEMA = None  # Use default schema to avoid permission issues


def upgrade() -> None:
    # skills
    op.create_table(
        'skills',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('name', sa.String(), nullable=False, unique=True),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
    )

    # user_skills
    op.create_table(
        'user_skills',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('skill_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('skills.id'), nullable=False),
        sa.Column('level', sa.Integer(), nullable=True),
        sa.Column('years', sa.Float(), nullable=True),
        sa.Column('verified_status', sa.String(), nullable=False, server_default='UNVERIFIED'),
        sa.Column('evidence_url', sa.String(), nullable=True),
        sa.UniqueConstraint('user_id', 'skill_id', name='uq_user_skill_unique'),
    )
    op.create_index('ix_user_skills_user_id', 'user_skills', ['user_id'])
    op.create_index('ix_user_skills_skill_id', 'user_skills', ['skill_id'])

    # skill_verifications
    op.create_table(
        'skill_verifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('skill_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('skills.id'), nullable=False),
        sa.Column('method', sa.String(), nullable=False, server_default='evidence'),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('verification_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.create_index('ix_skill_verifications_user_id', 'skill_verifications', ['user_id'])
    op.create_index('ix_skill_verifications_skill_id', 'skill_verifications', ['skill_id'])

    # reputation_scores
    op.create_table(
        'reputation_scores',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, unique=True),
        sa.Column('score', sa.Float(), nullable=False, server_default=sa.text('0')),
        sa.Column('breakdown_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.create_index('ix_reputation_scores_user_id', 'reputation_scores', ['user_id'])

    # reputation_events
    op.create_table(
        'reputation_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('weight', sa.Float(), nullable=False, server_default=sa.text('0')),
        sa.Column('payload_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.create_index('ix_reputation_events_user_id', 'reputation_events', ['user_id'])


def downgrade() -> None:
    # drop in reverse order
    op.drop_index('ix_reputation_events_user_id', table_name='reputation_events')
    op.drop_table('reputation_events')

    op.drop_index('ix_reputation_scores_user_id', table_name='reputation_scores')
    op.drop_table('reputation_scores')

    op.drop_index('ix_skill_verifications_user_id', table_name='skill_verifications')
    op.drop_index('ix_skill_verifications_skill_id', table_name='skill_verifications')
    op.drop_table('skill_verifications')

    op.drop_index('ix_user_skills_user_id', table_name='user_skills')
    op.drop_index('ix_user_skills_skill_id', table_name='user_skills')
    op.drop_table('user_skills')

    op.drop_table('skills')
