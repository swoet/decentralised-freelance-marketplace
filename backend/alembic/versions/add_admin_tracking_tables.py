"""add_admin_tracking_tables

Revision ID: add_admin_tracking
Revises: 71991348e38b
Create Date: 2025-09-30 16:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_admin_tracking'
down_revision = '71991348e38b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create activity_logs table
    op.create_table('activity_logs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('activity_type', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_activity_logs_user_id'), 'activity_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_activity_logs_timestamp'), 'activity_logs', ['timestamp'], unique=False)
    op.create_index(op.f('ix_activity_logs_activity_type'), 'activity_logs', ['activity_type'], unique=False)

    # Create system_metrics table
    op.create_table('system_metrics',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('metric_name', sa.String(), nullable=False),
        sa.Column('metric_value', sa.Float(), nullable=False),
        sa.Column('recorded_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_metrics_metric_name'), 'system_metrics', ['metric_name'], unique=False)
    op.create_index(op.f('ix_system_metrics_recorded_at'), 'system_metrics', ['recorded_at'], unique=False)

    # Create revenue_records table
    op.create_table('revenue_records',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('project_id', sa.String(), nullable=True),
        sa.Column('client_id', sa.String(), nullable=True),
        sa.Column('freelancer_id', sa.String(), nullable=True),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(), nullable=False, server_default='USD'),
        sa.Column('transaction_type', sa.String(), nullable=False),
        sa.Column('payment_method', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['client_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['freelancer_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_revenue_records_created_at'), 'revenue_records', ['created_at'], unique=False)
    op.create_index(op.f('ix_revenue_records_project_id'), 'revenue_records', ['project_id'], unique=False)
    op.create_index(op.f('ix_revenue_records_transaction_type'), 'revenue_records', ['transaction_type'], unique=False)

    # Create ai_request_logs table
    op.create_table('ai_request_logs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('request_type', sa.String(), nullable=False),
        sa.Column('endpoint', sa.String(), nullable=False),
        sa.Column('tokens_used', sa.Integer(), server_default='0'),
        sa.Column('latency_ms', sa.Integer(), nullable=True),
        sa.Column('success', sa.Boolean(), server_default='true'),
        sa.Column('error_message', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_request_logs_user_id'), 'ai_request_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_ai_request_logs_created_at'), 'ai_request_logs', ['created_at'], unique=False)
    op.create_index(op.f('ix_ai_request_logs_request_type'), 'ai_request_logs', ['request_type'], unique=False)

    # Create dispute_cases table
    op.create_table('dispute_cases',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('project_id', sa.String(), nullable=False),
        sa.Column('raised_by', sa.String(), nullable=False),
        sa.Column('against_user', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('priority', sa.String(), nullable=False, server_default='medium'),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('evidence', sa.JSON(), nullable=True),
        sa.Column('resolution', sa.String(), nullable=True),
        sa.Column('resolved_by', sa.String(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['against_user'], ['users.id'], ),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.ForeignKeyConstraint(['raised_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['resolved_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_dispute_cases_status'), 'dispute_cases', ['status'], unique=False)
    op.create_index(op.f('ix_dispute_cases_priority'), 'dispute_cases', ['priority'], unique=False)
    op.create_index(op.f('ix_dispute_cases_created_at'), 'dispute_cases', ['created_at'], unique=False)


def downgrade() -> None:
    # Drop all tables in reverse order
    op.drop_table('dispute_cases')
    op.drop_table('ai_request_logs')
    op.drop_table('revenue_records')
    op.drop_table('system_metrics')
    op.drop_table('activity_logs')
