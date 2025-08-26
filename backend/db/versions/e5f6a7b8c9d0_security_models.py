"""
add security models for sessions, backup codes, consent logs

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2025-08-26
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None

SCHEMA = 'marketplace'

def upgrade() -> None:
    op.create_table(
        'sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.users.id'), nullable=False),
        sa.Column('device', sa.String(), nullable=True),
        sa.Column('ip', sa.String(), nullable=True),
        sa.Column('ua', sa.String(), nullable=True),
        sa.Column('last_seen_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('revoked', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        schema=SCHEMA,
    )
    op.create_index('ix_sessions_user_id', 'sessions', ['user_id'], schema=SCHEMA)

    op.create_table(
        'backup_codes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.users.id'), nullable=False),
        sa.Column('code_hash', sa.String(), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        schema=SCHEMA,
    )
    op.create_index('ix_backup_codes_user_id', 'backup_codes', ['user_id'], schema=SCHEMA)
    op.create_index('ix_backup_codes_code_hash', 'backup_codes', ['code_hash'], schema=SCHEMA)

    op.create_table(
        'consent_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.users.id'), nullable=False),
        sa.Column('doc', sa.String(), nullable=False),
        sa.Column('version', sa.String(), nullable=False),
        sa.Column('consented_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('ip', sa.String(), nullable=True),
        sa.Column('ua', sa.String(), nullable=True),
        schema=SCHEMA,
    )
    op.create_index('ix_consent_logs_user_id', 'consent_logs', ['user_id'], schema=SCHEMA)


def downgrade() -> None:
    op.drop_index('ix_consent_logs_user_id', table_name='consent_logs', schema=SCHEMA)
    op.drop_table('consent_logs', schema=SCHEMA)
    op.drop_index('ix_backup_codes_code_hash', table_name='backup_codes', schema=SCHEMA)
    op.drop_index('ix_backup_codes_user_id', table_name='backup_codes', schema=SCHEMA)
    op.drop_table('backup_codes', schema=SCHEMA)
    op.drop_index('ix_sessions_user_id', table_name='sessions', schema=SCHEMA)
    op.drop_table('sessions', schema=SCHEMA)
