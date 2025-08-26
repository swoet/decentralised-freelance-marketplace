"""Add session, device, and refresh token tables

Revision ID: 003_add_session_device_tables
Revises: 002_add_job_queue_tables
Create Date: 2024-08-26 12:28:44.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_add_session_device_tables'
down_revision = '002_add_job_queue_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add enhanced session management tables."""
    
    # Create devices table
    op.create_table('devices',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('device_id', sa.String(), nullable=False),
        sa.Column('device_name', sa.String(), nullable=True),
        sa.Column('device_type', sa.String(), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('browser_name', sa.String(), nullable=True),
        sa.Column('browser_version', sa.String(), nullable=True),
        sa.Column('os_name', sa.String(), nullable=True),
        sa.Column('os_version', sa.String(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('country', sa.String(), nullable=True),
        sa.Column('city', sa.String(), nullable=True),
        sa.Column('screen_resolution', sa.String(), nullable=True),
        sa.Column('timezone', sa.String(), nullable=True),
        sa.Column('language', sa.String(), nullable=True),
        sa.Column('is_trusted', sa.Boolean(), nullable=False),
        sa.Column('is_blocked', sa.Boolean(), nullable=False),
        sa.Column('first_seen_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_seen_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for devices
    op.create_index('ix_devices_user_id', 'devices', ['user_id'])
    op.create_index('ix_devices_device_id', 'devices', ['device_id'], unique=True)
    
    # Add new columns to sessions table
    op.add_column('sessions', sa.Column('id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('sessions', sa.Column('device_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('sessions', sa.Column('session_token', sa.String(), nullable=True))
    op.add_column('sessions', sa.Column('ip_address', sa.String(), nullable=True))
    op.add_column('sessions', sa.Column('user_agent', sa.Text(), nullable=True))
    op.add_column('sessions', sa.Column('login_method', sa.String(), nullable=True))
    op.add_column('sessions', sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('sessions', sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('sessions', sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('sessions', sa.Column('revoked_reason', sa.String(), nullable=True))
    op.add_column('sessions', sa.Column('created_at', sa.DateTime(timezone=True), nullable=True))
    
    # Create foreign key for device_id
    op.create_foreign_key('fk_sessions_device_id', 'sessions', 'devices', ['device_id'], ['id'])
    
    # Create indexes for enhanced sessions
    op.create_index('ix_sessions_session_token', 'sessions', ['session_token'], unique=True)
    op.create_index('ix_sessions_device_id', 'sessions', ['device_id'])
    op.create_index('ix_sessions_expires_at', 'sessions', ['expires_at'])
    op.create_index('ix_sessions_ip_address', 'sessions', ['ip_address'])
    
    # Create refresh_tokens table
    op.create_table('refresh_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('device_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('token_hash', sa.String(), nullable=False),
        sa.Column('token_family', sa.String(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_revoked', sa.Boolean(), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('revoked_reason', sa.String(), nullable=True),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('replaced_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['device_id'], ['devices.id'], ),
        sa.ForeignKeyConstraint(['replaced_by'], ['refresh_tokens.id'], ),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for refresh_tokens
    op.create_index('ix_refresh_tokens_user_id', 'refresh_tokens', ['user_id'])
    op.create_index('ix_refresh_tokens_session_id', 'refresh_tokens', ['session_id'])
    op.create_index('ix_refresh_tokens_device_id', 'refresh_tokens', ['device_id'])
    op.create_index('ix_refresh_tokens_token_hash', 'refresh_tokens', ['token_hash'], unique=True)
    op.create_index('ix_refresh_tokens_token_family', 'refresh_tokens', ['token_family'])
    op.create_index('ix_refresh_tokens_expires_at', 'refresh_tokens', ['expires_at'])
    
    # Create session_activities table
    op.create_table('session_activities',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('activity_type', sa.String(), nullable=False),
        sa.Column('endpoint', sa.String(), nullable=True),
        sa.Column('method', sa.String(), nullable=True),
        sa.Column('status_code', sa.Integer(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('is_suspicious', sa.Boolean(), nullable=False),
        sa.Column('risk_score', sa.Integer(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for session_activities
    op.create_index('ix_session_activities_session_id', 'session_activities', ['session_id'])
    op.create_index('ix_session_activities_user_id', 'session_activities', ['user_id'])
    op.create_index('ix_session_activities_activity_type', 'session_activities', ['activity_type'])
    op.create_index('ix_session_activities_ip_address', 'session_activities', ['ip_address'])
    op.create_index('ix_session_activities_created_at', 'session_activities', ['created_at'])


def downgrade() -> None:
    """Remove enhanced session management tables."""
    
    # Drop indexes first
    op.drop_index('ix_session_activities_created_at', table_name='session_activities')
    op.drop_index('ix_session_activities_ip_address', table_name='session_activities')
    op.drop_index('ix_session_activities_activity_type', table_name='session_activities')
    op.drop_index('ix_session_activities_user_id', table_name='session_activities')
    op.drop_index('ix_session_activities_session_id', table_name='session_activities')
    
    op.drop_index('ix_refresh_tokens_expires_at', table_name='refresh_tokens')
    op.drop_index('ix_refresh_tokens_token_family', table_name='refresh_tokens')
    op.drop_index('ix_refresh_tokens_token_hash', table_name='refresh_tokens')
    op.drop_index('ix_refresh_tokens_device_id', table_name='refresh_tokens')
    op.drop_index('ix_refresh_tokens_session_id', table_name='refresh_tokens')
    op.drop_index('ix_refresh_tokens_user_id', table_name='refresh_tokens')
    
    op.drop_index('ix_sessions_ip_address', table_name='sessions')
    op.drop_index('ix_sessions_expires_at', table_name='sessions')
    op.drop_index('ix_sessions_device_id', table_name='sessions')
    op.drop_index('ix_sessions_session_token', table_name='sessions')
    
    op.drop_index('ix_devices_device_id', table_name='devices')
    op.drop_index('ix_devices_user_id', table_name='devices')
    
    # Drop tables
    op.drop_table('session_activities')
    op.drop_table('refresh_tokens')
    op.drop_table('devices')
    
    # Drop foreign key and new columns from sessions
    op.drop_constraint('fk_sessions_device_id', 'sessions', type_='foreignkey')
    op.drop_column('sessions', 'created_at')
    op.drop_column('sessions', 'revoked_reason')
    op.drop_column('sessions', 'revoked_at')
    op.drop_column('sessions', 'expires_at')
    op.drop_column('sessions', 'metadata')
    op.drop_column('sessions', 'login_method')
    op.drop_column('sessions', 'user_agent')
    op.drop_column('sessions', 'ip_address')
    op.drop_column('sessions', 'session_token')
    op.drop_column('sessions', 'device_id')
    op.drop_column('sessions', 'id')
