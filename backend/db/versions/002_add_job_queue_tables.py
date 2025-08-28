"""Add job queue and webhook event tables

Revision ID: 002_add_job_queue_tables
Revises: f6a7b8c9d0e1
Create Date: 2024-08-26 11:48:51.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_add_job_queue_tables'
down_revision = 'f6a7b8c9d0e1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create job queue, dead letter queue, and webhook event tables."""
    
    # Create job_queue table
    op.create_table('job_queue',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('job_id', sa.String(), nullable=False),
        sa.Column('job_type', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('priority', sa.Integer(), nullable=False),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('result', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=False),
        sa.Column('max_retries', sa.Integer(), nullable=False),
        sa.Column('next_retry_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for job_queue
    op.create_index('ix_job_queue_job_id', 'job_queue', ['job_id'], unique=True)
    op.create_index('ix_job_queue_job_type', 'job_queue', ['job_type'])
    op.create_index('ix_job_queue_status', 'job_queue', ['status'])
    op.create_index('ix_job_queue_priority', 'job_queue', ['priority'])
    
    # Create dead_letter_queue table
    op.create_table('dead_letter_queue',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('original_job_id', sa.String(), nullable=False),
        sa.Column('job_type', sa.String(), nullable=False),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('final_error', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=False),
        sa.Column('failed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('original_created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reviewed', sa.Boolean(), nullable=False),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reviewed_by', sa.String(), nullable=True),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for dead_letter_queue
    op.create_index('ix_dead_letter_queue_original_job_id', 'dead_letter_queue', ['original_job_id'])
    op.create_index('ix_dead_letter_queue_job_type', 'dead_letter_queue', ['job_type'])
    
    # Create webhook_events table
    op.create_table('webhook_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('event_id', sa.String(), nullable=False),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('headers', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('signature', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=False),
        sa.Column('max_retries', sa.Integer(), nullable=False),
        sa.Column('received_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for webhook_events
    op.create_index('ix_webhook_events_event_id', 'webhook_events', ['event_id'], unique=True)
    op.create_index('ix_webhook_events_provider', 'webhook_events', ['provider'])
    op.create_index('ix_webhook_events_event_type', 'webhook_events', ['event_type'])
    op.create_index('ix_webhook_events_status', 'webhook_events', ['status'])


def downgrade() -> None:
    """Drop job queue, dead letter queue, and webhook event tables."""
    
    # Drop indexes first
    op.drop_index('ix_webhook_events_status', table_name='webhook_events')
    op.drop_index('ix_webhook_events_event_type', table_name='webhook_events')
    op.drop_index('ix_webhook_events_provider', table_name='webhook_events')
    op.drop_index('ix_webhook_events_event_id', table_name='webhook_events')
    
    op.drop_index('ix_dead_letter_queue_job_type', table_name='dead_letter_queue')
    op.drop_index('ix_dead_letter_queue_original_job_id', table_name='dead_letter_queue')
    
    op.drop_index('ix_job_queue_priority', table_name='job_queue')
    op.drop_index('ix_job_queue_status', table_name='job_queue')
    op.drop_index('ix_job_queue_job_type', table_name='job_queue')
    op.drop_index('ix_job_queue_job_id', table_name='job_queue')
    
    # Drop tables
    op.drop_table('webhook_events')
    op.drop_table('dead_letter_queue')
    op.drop_table('job_queue')
