"""
add chain_id and payment_mode to escrow_contracts

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2025-08-26
"""
from alembic import op
import sqlalchemy as sa

revision = 'f6a7b8c9d0e1'
down_revision = 'e5f6a7b8c9d0'
branch_labels = None
depends_on = None

SCHEMA = 'marketplace'

def upgrade() -> None:
    op.add_column('escrow_contracts', sa.Column('payment_mode', sa.String(), nullable=True), schema=SCHEMA)
    op.add_column('escrow_contracts', sa.Column('chain_id', sa.Integer(), nullable=True), schema=SCHEMA)
    op.add_column('escrow_contracts', sa.Column('token_address', sa.String(), nullable=True), schema=SCHEMA)


def downgrade() -> None:
    op.drop_column('escrow_contracts', 'token_address', schema=SCHEMA)
    op.drop_column('escrow_contracts', 'chain_id', schema=SCHEMA)
    op.drop_column('escrow_contracts', 'payment_mode', schema=SCHEMA)
