"""
add integrations and api keys

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2025-08-26
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None

SCHEMA = 'marketplace'

def upgrade() -> None:
    op.create_table(
        'integrations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.users.id'), nullable=True),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.organizations.id'), nullable=True),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='connected'),
        sa.Column('config_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        schema=SCHEMA,
    )
    op.create_index('ix_integrations_owner_id', 'integrations', ['owner_id'], schema=SCHEMA)
    op.create_index('ix_integrations_org_id', 'integrations', ['org_id'], schema=SCHEMA)
    op.create_index('ix_integrations_provider', 'integrations', ['provider'], schema=SCHEMA)

    op.create_table(
        'webhooks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('integration_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.integrations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('url', sa.String(), nullable=False),
        sa.Column('secret', sa.String(), nullable=True),
        sa.Column('events', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        schema=SCHEMA,
    )
    op.create_index('ix_webhooks_integration_id', 'webhooks', ['integration_id'], schema=SCHEMA)

    op.create_table(
        'api_keys',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.users.id'), nullable=False),
        sa.Column('prefix', sa.String(), nullable=False),
        sa.Column('hash', sa.String(), nullable=False),
        sa.Column('scopes', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('revoked', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at_ts', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint('prefix', name='uq_api_keys_prefix'),
        schema=SCHEMA,
    )
    op.create_index('ix_api_keys_owner_id', 'api_keys', ['owner_id'], schema=SCHEMA)
    op.create_index('ix_api_keys_prefix', 'api_keys', ['prefix'], schema=SCHEMA)

    op.create_table(
        'api_key_usages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('key_id', postgresql.UUID(as_uuid=True), sa.ForeignKey(f'{SCHEMA}.api_keys.id', ondelete='CASCADE'), nullable=False),
        sa.Column('route', sa.String(), nullable=False),
        sa.Column('status_code', sa.Integer(), nullable=False),
        sa.Column('latency_ms', sa.Integer(), nullable=True),
        schema=SCHEMA,
    )
    op.create_index('ix_api_key_usages_key_id', 'api_key_usages', ['key_id'], schema=SCHEMA)


def downgrade() -> None:
    op.drop_index('ix_api_key_usages_key_id', table_name='api_key_usages', schema=SCHEMA)
    op.drop_table('api_key_usages', schema=SCHEMA)

    op.drop_index('ix_api_keys_prefix', table_name='api_keys', schema=SCHEMA)
    op.drop_index('ix_api_keys_owner_id', table_name='api_keys', schema=SCHEMA)
    op.drop_table('api_keys', schema=SCHEMA)

    op.drop_index('ix_webhooks_integration_id', table_name='webhooks', schema=SCHEMA)
    op.drop_table('webhooks', schema=SCHEMA)

    op.drop_index('ix_integrations_provider', table_name='integrations', schema=SCHEMA)
    op.drop_index('ix_integrations_org_id', table_name='integrations', schema=SCHEMA)
    op.drop_index('ix_integrations_owner_id', table_name='integrations', schema=SCHEMA)
    op.drop_table('integrations', schema=SCHEMA)
