"""AI-Powered Smart Matching System Models"""

from __future__ import annotations
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from typing import Dict, List, Optional
import uuid

from .base import Base


class PersonalityProfile(Base):
    """Stores AI-analyzed personality traits for users"""
    __tablename__ = "personality_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    
    # Big Five Personality Traits (0-100 scale)
    openness = Column(Float, nullable=False, default=50.0)
    conscientiousness = Column(Float, nullable=False, default=50.0)
    extraversion = Column(Float, nullable=False, default=50.0)
    agreeableness = Column(Float, nullable=False, default=50.0)
    neuroticism = Column(Float, nullable=False, default=50.0)
    
    # Communication Style Analysis
    communication_style = Column(String, nullable=True)  # direct, diplomatic, casual, formal
    response_speed = Column(String, nullable=True)  # fast, moderate, slow
    detail_orientation = Column(String, nullable=True)  # high, medium, low
    
    # Work Preferences
    preferred_work_hours = Column(ARRAY(Integer), nullable=True)  # Hours of day (0-23)
    timezone_preference = Column(String, nullable=True)
    collaboration_style = Column(String, nullable=True)  # independent, collaborative, hybrid
    feedback_style = Column(String, nullable=True)  # frequent, milestone, final
    
    # AI Analysis Metadata
    analysis_confidence = Column(Float, nullable=False, default=0.0)  # 0-1 confidence score
    data_points_analyzed = Column(Integer, nullable=False, default=0)
    last_analysis = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    # Analysis Sources
    text_analysis_count = Column(Integer, nullable=False, default=0)
    project_behavior_count = Column(Integer, nullable=False, default=0)
    communication_samples = Column(Integer, nullable=False, default=0)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="personality_profile")


class WorkPattern(Base):
    """Tracks and analyzes work patterns for intelligent matching"""
    __tablename__ = "work_patterns"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Performance Metrics
    avg_completion_time_ratio = Column(Float, nullable=True)  # actual/estimated time
    quality_consistency_score = Column(Float, nullable=True)  # 0-100
    deadline_adherence_rate = Column(Float, nullable=True)  # 0-100 percentage
    revision_request_ratio = Column(Float, nullable=True)  # revisions per project
    
    # Communication Patterns
    avg_response_time_hours = Column(Float, nullable=True)
    proactive_communication_score = Column(Float, nullable=True)  # 0-100
    issue_escalation_pattern = Column(String, nullable=True)  # early, timely, late
    
    # Work Style Analytics
    preferred_project_size = Column(String, nullable=True)  # small, medium, large, enterprise
    optimal_project_duration = Column(String, nullable=True)  # sprint, short, medium, long
    complexity_comfort_level = Column(Float, nullable=True)  # 0-100
    innovation_vs_execution = Column(Float, nullable=True)  # 0=execution, 100=innovation
    
    # Collaboration Effectiveness
    team_leadership_score = Column(Float, nullable=True)  # 0-100
    mentoring_capability = Column(Float, nullable=True)  # 0-100
    cross_functional_adaptability = Column(Float, nullable=True)  # 0-100
    
    # Industry/Domain Expertise
    domain_expertise = Column(JSONB, nullable=True)  # {"web_dev": 85, "ai_ml": 60}
    learning_velocity = Column(Float, nullable=True)  # how quickly they adapt to new tech
    technology_adoption_speed = Column(String, nullable=True)  # early, mainstream, conservative
    
    # Success Prediction Factors
    project_success_rate = Column(Float, nullable=True)  # 0-100
    client_satisfaction_avg = Column(Float, nullable=True)  # 0-5 stars
    repeat_client_rate = Column(Float, nullable=True)  # 0-100 percentage
    referral_generation_rate = Column(Float, nullable=True)  # 0-100
    
    # Analysis Metadata
    projects_analyzed = Column(Integer, nullable=False, default=0)
    data_freshness_score = Column(Float, nullable=False, default=100.0)  # decreases over time
    confidence_level = Column(Float, nullable=False, default=0.0)  # 0-1
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User")


class CompatibilityScore(Base):
    """Stores compatibility scores between freelancers and clients/projects"""
    __tablename__ = "compatibility_scores"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    freelancer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True, index=True)
    
    # Compatibility Dimensions
    overall_compatibility = Column(Float, nullable=False, default=0.0)  # 0-100
    personality_match = Column(Float, nullable=False, default=0.0)  # 0-100
    work_style_match = Column(Float, nullable=False, default=0.0)  # 0-100
    skill_technical_match = Column(Float, nullable=False, default=0.0)  # 0-100
    communication_match = Column(Float, nullable=False, default=0.0)  # 0-100
    schedule_compatibility = Column(Float, nullable=False, default=0.0)  # 0-100
    
    # Success Prediction
    predicted_success_rate = Column(Float, nullable=False, default=0.0)  # 0-100
    predicted_completion_time = Column(Float, nullable=True)  # in hours
    predicted_satisfaction_score = Column(Float, nullable=True)  # 0-5
    risk_assessment_score = Column(Float, nullable=False, default=50.0)  # 0=low risk, 100=high risk
    
    # Detailed Analysis
    compatibility_factors = Column(JSONB, nullable=True)  # detailed breakdown
    improvement_suggestions = Column(JSONB, nullable=True)  # how to improve compatibility
    
    # ML Model Metadata
    model_version = Column(String, nullable=False, default="1.0")
    confidence_score = Column(Float, nullable=False, default=0.0)  # 0-1
    calculation_timestamp = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    # Performance Tracking
    actual_outcome_recorded = Column(Boolean, nullable=False, default=False)
    actual_success_rate = Column(Float, nullable=True)  # for model improvement
    prediction_accuracy = Column(Float, nullable=True)  # how accurate was the prediction
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    freelancer = relationship("User", foreign_keys=[freelancer_id])
    client = relationship("User", foreign_keys=[client_id])
    project = relationship("Project")


class SkillDemandPrediction(Base):
    """AI predictions for skill demand and market trends"""
    __tablename__ = "skill_demand_predictions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Skill Information
    skill_name = Column(String, nullable=False, index=True)
    skill_category = Column(String, nullable=True)
    
    # Demand Metrics
    current_demand_score = Column(Float, nullable=False, default=0.0)  # 0-100
    predicted_demand_1m = Column(Float, nullable=False, default=0.0)  # 1 month prediction
    predicted_demand_3m = Column(Float, nullable=False, default=0.0)  # 3 months
    predicted_demand_6m = Column(Float, nullable=False, default=0.0)  # 6 months
    predicted_demand_1y = Column(Float, nullable=False, default=0.0)  # 1 year
    
    # Market Intelligence
    average_hourly_rate = Column(Float, nullable=True)
    rate_trend = Column(String, nullable=True)  # increasing, stable, decreasing
    competition_level = Column(String, nullable=True)  # low, medium, high
    market_saturation = Column(Float, nullable=True)  # 0-100
    
    # Supply vs Demand
    supply_demand_ratio = Column(Float, nullable=True)
    talent_gap_score = Column(Float, nullable=True)  # how hard to find good talent
    learning_difficulty = Column(Float, nullable=True)  # 0-100, how hard to learn
    
    # Trend Analysis
    growth_velocity = Column(Float, nullable=True)  # rate of demand change
    seasonality_pattern = Column(JSONB, nullable=True)  # monthly demand patterns
    related_skills = Column(ARRAY(String), nullable=True)
    emerging_combinations = Column(JSONB, nullable=True)  # skill combinations in demand
    
    # Geographic Analysis
    top_demand_regions = Column(JSONB, nullable=True)
    remote_work_suitability = Column(Float, nullable=True)  # 0-100
    
    # Model Metadata
    prediction_confidence = Column(Float, nullable=False, default=0.0)  # 0-1
    data_points_analyzed = Column(Integer, nullable=False, default=0)
    model_version = Column(String, nullable=False, default="1.0")
    last_updated = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class MatchingQueueItem(Base):
    """Queue system for processing AI matching calculations"""
    __tablename__ = "matching_queue"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Queue Item Details
    queue_type = Column(String, nullable=False, index=True)  # personality_analysis, compatibility_calc, etc.
    priority = Column(Integer, nullable=False, default=5)  # 1=highest, 10=lowest
    status = Column(String, nullable=False, default="pending", index=True)  # pending, processing, completed, failed
    
    # Target Information
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True, index=True)
    
    # Processing Data
    input_data = Column(JSONB, nullable=True)
    processing_result = Column(JSONB, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Timing
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    processing_duration_ms = Column(Integer, nullable=True)
    
    # Processing Metadata
    worker_id = Column(String, nullable=True)
    retry_count = Column(Integer, nullable=False, default=0)
    max_retries = Column(Integer, nullable=False, default=3)
    
    # Relationships
    user = relationship("User")
    project = relationship("Project")
