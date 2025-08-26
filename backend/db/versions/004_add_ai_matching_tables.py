"""Add AI matching, skills verification, and reputation tables

Revision ID: 004_add_ai_matching_tables
Revises: 003_add_session_device_tables
Create Date: 2024-08-26 12:45:12.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004_add_ai_matching_tables'
down_revision = '003_add_session_device_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add AI matching, skills verification, and reputation tables."""
    
    # Create project_embeddings table
    op.create_table('project_embeddings',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('embedding_vector', postgresql.ARRAY(sa.Float()), nullable=False),
        sa.Column('embedding_model', sa.String(), nullable=False),
        sa.Column('embedding_version', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('skills_required', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('industry_tags', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('budget_min', sa.Float(), nullable=True),
        sa.Column('budget_max', sa.Float(), nullable=True),
        sa.Column('duration_days', sa.Integer(), nullable=True),
        sa.Column('complexity_score', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for project_embeddings
    op.create_index('ix_project_embeddings_project_id', 'project_embeddings', ['project_id'], unique=True)
    op.create_index('ix_project_embeddings_embedding_model', 'project_embeddings', ['embedding_model'])
    op.create_index('ix_project_embeddings_complexity_score', 'project_embeddings', ['complexity_score'])
    
    # Create freelancer_profiles table
    op.create_table('freelancer_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('embedding_vector', postgresql.ARRAY(sa.Float()), nullable=False),
        sa.Column('embedding_model', sa.String(), nullable=False),
        sa.Column('embedding_version', sa.String(), nullable=False),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('skills', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('specializations', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('industries', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('preferred_budget_min', sa.Float(), nullable=True),
        sa.Column('preferred_budget_max', sa.Float(), nullable=True),
        sa.Column('preferred_duration_min', sa.Integer(), nullable=True),
        sa.Column('preferred_duration_max', sa.Integer(), nullable=True),
        sa.Column('timezone', sa.String(), nullable=True),
        sa.Column('availability_hours', sa.Integer(), nullable=True),
        sa.Column('avg_rating', sa.Float(), nullable=True),
        sa.Column('completion_rate', sa.Float(), nullable=True),
        sa.Column('response_time_hours', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for freelancer_profiles
    op.create_index('ix_freelancer_profiles_user_id', 'freelancer_profiles', ['user_id'], unique=True)
    op.create_index('ix_freelancer_profiles_embedding_model', 'freelancer_profiles', ['embedding_model'])
    op.create_index('ix_freelancer_profiles_avg_rating', 'freelancer_profiles', ['avg_rating'])
    
    # Create matching_results table
    op.create_table('matching_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('freelancer_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('similarity_score', sa.Float(), nullable=False),
        sa.Column('compatibility_score', sa.Float(), nullable=False),
        sa.Column('budget_match_score', sa.Float(), nullable=True),
        sa.Column('skill_match_score', sa.Float(), nullable=True),
        sa.Column('availability_score', sa.Float(), nullable=True),
        sa.Column('rank_position', sa.Integer(), nullable=True),
        sa.Column('is_recommended', sa.Boolean(), nullable=False),
        sa.Column('match_reasons', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('skill_gaps', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('algorithm_version', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['freelancer_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for matching_results
    op.create_index('ix_matching_results_project_id', 'matching_results', ['project_id'])
    op.create_index('ix_matching_results_freelancer_id', 'matching_results', ['freelancer_id'])
    op.create_index('ix_matching_results_similarity_score', 'matching_results', ['similarity_score'])
    op.create_index('ix_matching_results_rank_position', 'matching_results', ['rank_position'])
    op.create_index('ix_matching_results_created_at', 'matching_results', ['created_at'])
    op.create_index('ix_matching_results_expires_at', 'matching_results', ['expires_at'])
    
    # Note: skill_verifications table already exists in skills.py migration
    # We'll add additional columns to the existing table instead
    
    # Add new columns to existing skill_verifications table
    op.add_column('skill_verifications', sa.Column('verification_type', sa.String(), nullable=True))
    op.add_column('skill_verifications', sa.Column('quiz_score', sa.Float(), nullable=True))
    op.add_column('skill_verifications', sa.Column('quiz_questions_count', sa.Integer(), nullable=True))
    op.add_column('skill_verifications', sa.Column('quiz_correct_answers', sa.Integer(), nullable=True))
    op.add_column('skill_verifications', sa.Column('evidence_url', sa.String(), nullable=True))
    op.add_column('skill_verifications', sa.Column('evidence_type', sa.String(), nullable=True))
    op.add_column('skill_verifications', sa.Column('evidence_description', sa.Text(), nullable=True))
    op.add_column('skill_verifications', sa.Column('oauth_provider', sa.String(), nullable=True))
    op.add_column('skill_verifications', sa.Column('oauth_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('skill_verifications', sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('skill_verifications', sa.Column('verified_by', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('skill_verifications', sa.Column('confidence_score', sa.Float(), nullable=True))
    op.add_column('skill_verifications', sa.Column('skill_level', sa.String(), nullable=True))
    op.add_column('skill_verifications', sa.Column('reviewer_notes', sa.Text(), nullable=True))
    op.add_column('skill_verifications', sa.Column('rejection_reason', sa.String(), nullable=True))
    
    # Add foreign key constraint for verified_by
    op.create_foreign_key('fk_skill_verifications_verified_by', 'skill_verifications', 'users', ['verified_by'], ['id'])
    
    
    # Create indexes for new skill_verifications columns
    op.create_index('ix_skill_verifications_verification_type', 'skill_verifications', ['verification_type'])
    op.create_index('ix_skill_verifications_verified_by', 'skill_verifications', ['verified_by'])
    
    # Create reputation_scores_v2 table
    op.create_table('reputation_scores_v2',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('total_score', sa.Float(), nullable=False),
        sa.Column('quality_score', sa.Float(), nullable=False),
        sa.Column('reliability_score', sa.Float(), nullable=False),
        sa.Column('expertise_score', sa.Float(), nullable=False),
        sa.Column('professionalism_score', sa.Float(), nullable=False),
        sa.Column('growth_score', sa.Float(), nullable=False),
        sa.Column('projects_completed', sa.Integer(), nullable=False),
        sa.Column('avg_rating', sa.Float(), nullable=True),
        sa.Column('on_time_delivery_rate', sa.Float(), nullable=True),
        sa.Column('response_time_hours', sa.Float(), nullable=True),
        sa.Column('repeat_client_rate', sa.Float(), nullable=True),
        sa.Column('dispute_rate', sa.Float(), nullable=True),
        sa.Column('verified_skills_count', sa.Integer(), nullable=False),
        sa.Column('portfolio_items_count', sa.Integer(), nullable=False),
        sa.Column('badges', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('achievements', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('last_calculated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('calculation_version', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for reputation_scores_v2
    op.create_index('ix_reputation_scores_v2_user_id', 'reputation_scores_v2', ['user_id'], unique=True)
    op.create_index('ix_reputation_scores_v2_total_score', 'reputation_scores_v2', ['total_score'])
    op.create_index('ix_reputation_scores_v2_quality_score', 'reputation_scores_v2', ['quality_score'])
    op.create_index('ix_reputation_scores_v2_reliability_score', 'reputation_scores_v2', ['reliability_score'])
    op.create_index('ix_reputation_scores_v2_expertise_score', 'reputation_scores_v2', ['expertise_score'])


def downgrade() -> None:
    """Remove AI matching, skills verification, and reputation tables."""
    
    # Drop indexes first
    op.drop_index('ix_reputation_scores_v2_expertise_score', table_name='reputation_scores_v2')
    op.drop_index('ix_reputation_scores_v2_reliability_score', table_name='reputation_scores_v2')
    op.drop_index('ix_reputation_scores_v2_quality_score', table_name='reputation_scores_v2')
    op.drop_index('ix_reputation_scores_v2_total_score', table_name='reputation_scores_v2')
    op.drop_index('ix_reputation_scores_v2_user_id', table_name='reputation_scores_v2')
    
    # Drop new skill_verifications indexes and columns
    op.drop_index('ix_skill_verifications_verified_by', table_name='skill_verifications')
    op.drop_index('ix_skill_verifications_verification_type', table_name='skill_verifications')
    
    # Drop foreign key constraint
    op.drop_constraint('fk_skill_verifications_verified_by', 'skill_verifications', type_='foreignkey')
    
    # Drop added columns from skill_verifications
    op.drop_column('skill_verifications', 'rejection_reason')
    op.drop_column('skill_verifications', 'reviewer_notes')
    op.drop_column('skill_verifications', 'skill_level')
    op.drop_column('skill_verifications', 'confidence_score')
    op.drop_column('skill_verifications', 'verified_by')
    op.drop_column('skill_verifications', 'verified_at')
    op.drop_column('skill_verifications', 'oauth_data')
    op.drop_column('skill_verifications', 'oauth_provider')
    op.drop_column('skill_verifications', 'evidence_description')
    op.drop_column('skill_verifications', 'evidence_type')
    op.drop_column('skill_verifications', 'evidence_url')
    op.drop_column('skill_verifications', 'quiz_correct_answers')
    op.drop_column('skill_verifications', 'quiz_questions_count')
    op.drop_column('skill_verifications', 'quiz_score')
    op.drop_column('skill_verifications', 'verification_type')
    
    op.drop_index('ix_matching_results_expires_at', table_name='matching_results')
    op.drop_index('ix_matching_results_created_at', table_name='matching_results')
    op.drop_index('ix_matching_results_rank_position', table_name='matching_results')
    op.drop_index('ix_matching_results_similarity_score', table_name='matching_results')
    op.drop_index('ix_matching_results_freelancer_id', table_name='matching_results')
    op.drop_index('ix_matching_results_project_id', table_name='matching_results')
    
    op.drop_index('ix_freelancer_profiles_avg_rating', table_name='freelancer_profiles')
    op.drop_index('ix_freelancer_profiles_embedding_model', table_name='freelancer_profiles')
    op.drop_index('ix_freelancer_profiles_user_id', table_name='freelancer_profiles')
    
    op.drop_index('ix_project_embeddings_complexity_score', table_name='project_embeddings')
    op.drop_index('ix_project_embeddings_embedding_model', table_name='project_embeddings')
    op.drop_index('ix_project_embeddings_project_id', table_name='project_embeddings')
    
    # Drop tables
    op.drop_table('reputation_scores_v2')
    op.drop_table('matching_results')
    op.drop_table('freelancer_profiles')
    op.drop_table('project_embeddings')
