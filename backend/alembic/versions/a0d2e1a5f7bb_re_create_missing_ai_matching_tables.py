"""Re-create missing AI matching tables

Revision ID: a0d2e1a5f7bb
Revises: 3ae98a7fcfcc
Create Date: 2025-09-11 18:10:43.564919

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a0d2e1a5f7bb'
down_revision: Union[str, Sequence[str], None] = '3ae98a7fcfcc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Re-create missing AI matching tables
    op.create_table('skill_demand_predictions',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('skill_name', sa.String(), nullable=False),
    sa.Column('skill_category', sa.String(), nullable=True),
    sa.Column('current_demand_score', sa.Float(), nullable=False),
    sa.Column('predicted_demand_1m', sa.Float(), nullable=False),
    sa.Column('predicted_demand_3m', sa.Float(), nullable=False),
    sa.Column('predicted_demand_6m', sa.Float(), nullable=False),
    sa.Column('predicted_demand_1y', sa.Float(), nullable=False),
    sa.Column('average_hourly_rate', sa.Float(), nullable=True),
    sa.Column('rate_trend', sa.String(), nullable=True),
    sa.Column('competition_level', sa.String(), nullable=True),
    sa.Column('market_saturation', sa.Float(), nullable=True),
    sa.Column('supply_demand_ratio', sa.Float(), nullable=True),
    sa.Column('talent_gap_score', sa.Float(), nullable=True),
    sa.Column('learning_difficulty', sa.Float(), nullable=True),
    sa.Column('growth_velocity', sa.Float(), nullable=True),
    sa.Column('seasonality_pattern', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('related_skills', postgresql.ARRAY(sa.String()), nullable=True),
    sa.Column('emerging_combinations', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('top_demand_regions', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('remote_work_suitability', sa.Float(), nullable=True),
    sa.Column('prediction_confidence', sa.Float(), nullable=False),
    sa.Column('data_points_analyzed', sa.Integer(), nullable=False),
    sa.Column('model_version', sa.String(), nullable=False),
    sa.Column('last_updated', sa.DateTime(timezone=True), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    schema='marketplace'
    )
    op.create_index(op.f('ix_marketplace_skill_demand_predictions_skill_name'), 'skill_demand_predictions', ['skill_name'], unique=False, schema='marketplace')
    
    op.create_table('compatibility_scores',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('freelancer_id', sa.UUID(), nullable=False),
    sa.Column('client_id', sa.UUID(), nullable=True),
    sa.Column('project_id', sa.UUID(), nullable=True),
    sa.Column('overall_compatibility', sa.Float(), nullable=False),
    sa.Column('personality_match', sa.Float(), nullable=False),
    sa.Column('work_style_match', sa.Float(), nullable=False),
    sa.Column('skill_technical_match', sa.Float(), nullable=False),
    sa.Column('communication_match', sa.Float(), nullable=False),
    sa.Column('schedule_compatibility', sa.Float(), nullable=False),
    sa.Column('predicted_success_rate', sa.Float(), nullable=False),
    sa.Column('predicted_completion_time', sa.Float(), nullable=True),
    sa.Column('predicted_satisfaction_score', sa.Float(), nullable=True),
    sa.Column('risk_assessment_score', sa.Float(), nullable=False),
    sa.Column('compatibility_factors', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('improvement_suggestions', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('model_version', sa.String(), nullable=False),
    sa.Column('confidence_score', sa.Float(), nullable=False),
    sa.Column('calculation_timestamp', sa.DateTime(timezone=True), nullable=False),
    sa.Column('actual_outcome_recorded', sa.Boolean(), nullable=False),
    sa.Column('actual_success_rate', sa.Float(), nullable=True),
    sa.Column('prediction_accuracy', sa.Float(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['client_id'], ['marketplace.users.id'], ),
    sa.ForeignKeyConstraint(['freelancer_id'], ['marketplace.users.id'], ),
    sa.ForeignKeyConstraint(['project_id'], ['marketplace.projects.id'], ),
    sa.PrimaryKeyConstraint('id'),
    schema='marketplace'
    )
    op.create_index(op.f('ix_marketplace_compatibility_scores_client_id'), 'compatibility_scores', ['client_id'], unique=False, schema='marketplace')
    op.create_index(op.f('ix_marketplace_compatibility_scores_freelancer_id'), 'compatibility_scores', ['freelancer_id'], unique=False, schema='marketplace')
    op.create_index(op.f('ix_marketplace_compatibility_scores_project_id'), 'compatibility_scores', ['project_id'], unique=False, schema='marketplace')
    
    op.create_table('matching_queue',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('queue_type', sa.String(), nullable=False),
    sa.Column('priority', sa.Integer(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=True),
    sa.Column('project_id', sa.UUID(), nullable=True),
    sa.Column('input_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('processing_result', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('error_message', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('processing_duration_ms', sa.Integer(), nullable=True),
    sa.Column('worker_id', sa.String(), nullable=True),
    sa.Column('retry_count', sa.Integer(), nullable=False),
    sa.Column('max_retries', sa.Integer(), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['project_id'], ['marketplace.projects.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['marketplace.users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    schema='marketplace'
    )
    op.create_index(op.f('ix_marketplace_matching_queue_project_id'), 'matching_queue', ['project_id'], unique=False, schema='marketplace')
    op.create_index(op.f('ix_marketplace_matching_queue_queue_type'), 'matching_queue', ['queue_type'], unique=False, schema='marketplace')
    op.create_index(op.f('ix_marketplace_matching_queue_status'), 'matching_queue', ['status'], unique=False, schema='marketplace')
    op.create_index(op.f('ix_marketplace_matching_queue_user_id'), 'matching_queue', ['user_id'], unique=False, schema='marketplace')


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_marketplace_matching_queue_user_id'), table_name='matching_queue', schema='marketplace')
    op.drop_index(op.f('ix_marketplace_matching_queue_status'), table_name='matching_queue', schema='marketplace')
    op.drop_index(op.f('ix_marketplace_matching_queue_queue_type'), table_name='matching_queue', schema='marketplace')
    op.drop_index(op.f('ix_marketplace_matching_queue_project_id'), table_name='matching_queue', schema='marketplace')
    op.drop_table('matching_queue', schema='marketplace')
    op.drop_index(op.f('ix_marketplace_compatibility_scores_project_id'), table_name='compatibility_scores', schema='marketplace')
    op.drop_index(op.f('ix_marketplace_compatibility_scores_freelancer_id'), table_name='compatibility_scores', schema='marketplace')
    op.drop_index(op.f('ix_marketplace_compatibility_scores_client_id'), table_name='compatibility_scores', schema='marketplace')
    op.drop_table('compatibility_scores', schema='marketplace')
    op.drop_index(op.f('ix_marketplace_skill_demand_predictions_skill_name'), table_name='skill_demand_predictions', schema='marketplace')
    op.drop_table('skill_demand_predictions', schema='marketplace')
