"""
add token transaction model

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2025-08-26
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'd4e5f6a7b8c9'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None

SCHEMA = 'marketplace'

def upgrade() -> None:
    op.create_table(
        'token_transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('chain_id', sa.Integer(), nullable=False),
        sa.Column('tx_hash', sa.String(), nullable=False),
        sa.Column('tx_type', sa.String(), nullable=False),
        sa.Column('amount', sa.Numeric(), nullable=True),
        sa.Column('token_address', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.UniqueConstraint('tx_hash', name='uq_token_tx_hash'),
        schema=SCHEMA,
    )
    op.create_index('ix_token_transactions_user_id', 'token_transactions', ['user_id'], schema=SCHEMA)
    op.create_index('ix_token_transactions_chain_id', 'token_transactions', ['chain_id'], schema=SCHEMA)
    op.create_index('ix_token_transactions_tx_hash', 'token_transactions', ['tx_hash'], schema=SCHEMA)


def downgrade() -> None:
    op.drop_index('ix_token_transactions_tx_hash', table_name='token_transactions', schema=SCHEMA)
    op.drop_index('ix_token_transactions_chain_id', table_name='token_transactions', schema=SCHEMA)
    op.drop_index('ix_token_transactions_user_id', table_name='token_transactions', schema=SCHEMA)
    op.drop_table('token_transactions', schema=SCHEMA)
