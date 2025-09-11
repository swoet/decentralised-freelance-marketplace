"""Add missing bio and skills columns to users table

Revision ID: 3ae98a7fcfcc
Revises: 51344a6beff6
Create Date: 2025-09-11 16:53:44.751847

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3ae98a7fcfcc'
down_revision: Union[str, Sequence[str], None] = '9b332e79d6ec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add missing columns to users table
    with op.batch_alter_table('users', schema='marketplace') as batch_op:
        batch_op.add_column(sa.Column('bio', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('skills', sa.JSON(), nullable=True))
    
    # Create rate_limit_rules table
    op.create_table('rate_limit_rules',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('rule_name', sa.String(100), nullable=False),
        sa.Column('endpoint_pattern', sa.String(200), nullable=False),
        sa.Column('method', sa.String(10), nullable=True),
        sa.Column('limit_per_minute', sa.Integer(), nullable=True),
        sa.Column('limit_per_hour', sa.Integer(), nullable=True),
        sa.Column('limit_per_day', sa.Integer(), nullable=True),
        sa.Column('burst_limit', sa.Integer(), nullable=True),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('applies_to_authenticated', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('applies_to_anonymous', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('whitelist_ips', sa.ARRAY(sa.String()), nullable=True),
        sa.Column('blacklist_ips', sa.ARRAY(sa.String()), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        schema='marketplace'
    )
    
    # Create indexes for rate_limit_rules
    op.create_index('idx_rate_limit_enabled', 'rate_limit_rules', ['is_enabled'], unique=False, schema='marketplace')
    op.create_index('idx_rate_limit_pattern', 'rate_limit_rules', ['endpoint_pattern'], unique=False, schema='marketplace')
    
    # Create rate_limit_violations table
    op.create_table('rate_limit_violations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('rule_id', sa.UUID(), sa.ForeignKey('marketplace.rate_limit_rules.id', ondelete='CASCADE'), nullable=False),
        sa.Column('ip_address', sa.String(45), nullable=False),
        sa.Column('user_id', sa.UUID(), sa.ForeignKey('marketplace.users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('endpoint', sa.String(200), nullable=False),
        sa.Column('method', sa.String(10), nullable=False),
        sa.Column('violation_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('window_start', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('expires_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        schema='marketplace'
    )
    
    # Create indexes for rate_limit_violations
    op.create_index('idx_rate_violations_created', 'rate_limit_violations', ['created_at'], unique=False, schema='marketplace')
    op.create_index('idx_rate_violations_expires', 'rate_limit_violations', ['expires_at'], unique=False, schema='marketplace')
    op.create_index(op.f('ix_marketplace_rate_limit_violations_ip_address'), 'rate_limit_violations', ['ip_address'], unique=False, schema='marketplace')
    op.create_index(op.f('ix_marketplace_rate_limit_violations_rule_id'), 'rate_limit_violations', ['rule_id'], unique=False, schema='marketplace')
    op.create_index(op.f('ix_marketplace_rate_limit_violations_user_id'), 'rate_limit_violations', ['user_id'], unique=False, schema='marketplace')


def downgrade() -> None:
    """Downgrade schema."""
    # Drop rate_limit tables
    op.drop_table('rate_limit_violations', schema='marketplace')
    op.drop_table('rate_limit_rules', schema='marketplace')
    
    # Remove columns from users table
    with op.batch_alter_table('users', schema='marketplace') as batch_op:
        batch_op.drop_column('skills')
        batch_op.drop_column('bio')
