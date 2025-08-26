"""AI matching and recommendation models."""

from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, Integer, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from app.models.base import Base
from datetime import datetime
import uuid


class ProjectEmbedding(Base):
    """Model for storing project embeddings for AI matching."""
    __tablename__ = "project_embeddings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, unique=True, index=True)
    
    # Embedding data
    embedding_vector = Column(ARRAY(Float), nullable=False)  # Dense vector representation
    embedding_model = Column(String, nullable=False)  # Model used to generate embedding
    embedding_version = Column(String, nullable=False)  # Version for cache invalidation
    
    # Text features used for embedding
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    skills_required = Column(ARRAY(String), nullable=True)
    industry_tags = Column(ARRAY(String), nullable=True)
    
    # Metadata for matching
    budget_min = Column(Float, nullable=True)
    budget_max = Column(Float, nullable=True)
    duration_days = Column(Integer, nullable=True)
    complexity_score = Column(Float, nullable=True)  # 0-1 complexity rating
    
    # Cache control
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="embedding")


class FreelancerProfile(Base):
    """Model for storing freelancer profile embeddings and matching data."""
    __tablename__ = "freelancer_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    
    # Profile embedding
    embedding_vector = Column(ARRAY(Float), nullable=False)
    embedding_model = Column(String, nullable=False)
    embedding_version = Column(String, nullable=False)
    
    # Profile features
    bio = Column(Text, nullable=True)
    skills = Column(ARRAY(String), nullable=True)
    specializations = Column(ARRAY(String), nullable=True)
    industries = Column(ARRAY(String), nullable=True)
    
    # Matching preferences
    preferred_budget_min = Column(Float, nullable=True)
    preferred_budget_max = Column(Float, nullable=True)
    preferred_duration_min = Column(Integer, nullable=True)  # days
    preferred_duration_max = Column(Integer, nullable=True)  # days
    timezone = Column(String, nullable=True)
    availability_hours = Column(Integer, nullable=True)  # hours per week
    
    # Performance metrics
    avg_rating = Column(Float, nullable=True)
    completion_rate = Column(Float, nullable=True)
    response_time_hours = Column(Float, nullable=True)
    
    # Cache control
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="freelancer_profile")


class MatchingResult(Base):
    """Model for caching matching results."""
    __tablename__ = "matching_results"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    freelancer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Matching scores
    similarity_score = Column(Float, nullable=False, index=True)  # 0-1 cosine similarity
    compatibility_score = Column(Float, nullable=False)  # 0-1 overall compatibility
    budget_match_score = Column(Float, nullable=True)  # 0-1 budget alignment
    skill_match_score = Column(Float, nullable=True)  # 0-1 skills alignment
    availability_score = Column(Float, nullable=True)  # 0-1 availability match
    
    # Ranking and filtering
    rank_position = Column(Integer, nullable=True, index=True)
    is_recommended = Column(Boolean, nullable=False, default=True)
    
    # Explanation data
    match_reasons = Column(ARRAY(String), nullable=True)  # Why this is a good match
    skill_gaps = Column(ARRAY(String), nullable=True)  # Missing skills
    
    # Cache metadata
    algorithm_version = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # Relationships
    project = relationship("Project")
    freelancer = relationship("User")


# Note: SkillVerification is already defined in skills.py
# We'll extend the existing model instead of creating a duplicate


class ReputationScoreV2(Base):
    """Model for detailed reputation scoring components."""
    __tablename__ = "reputation_scores_v2"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    
    # Overall score
    total_score = Column(Float, nullable=False, default=0.0, index=True)  # 0-1000 scale
    
    # Component scores (0-100 each)
    quality_score = Column(Float, nullable=False, default=0.0)  # Based on reviews/ratings
    reliability_score = Column(Float, nullable=False, default=0.0)  # On-time delivery, communication
    expertise_score = Column(Float, nullable=False, default=0.0)  # Verified skills, complexity of projects
    professionalism_score = Column(Float, nullable=False, default=0.0)  # Client feedback, dispute resolution
    growth_score = Column(Float, nullable=False, default=0.0)  # Learning new skills, improving ratings
    
    # Supporting metrics
    projects_completed = Column(Integer, nullable=False, default=0)
    avg_rating = Column(Float, nullable=True)
    on_time_delivery_rate = Column(Float, nullable=True)  # 0-1
    response_time_hours = Column(Float, nullable=True)
    repeat_client_rate = Column(Float, nullable=True)  # 0-1
    dispute_rate = Column(Float, nullable=True)  # 0-1
    
    # Verification status
    verified_skills_count = Column(Integer, nullable=False, default=0)
    portfolio_items_count = Column(Integer, nullable=False, default=0)
    
    # Badges and achievements
    badges = Column(ARRAY(String), nullable=True)  # List of earned badges
    achievements = Column(JSONB, nullable=True)  # Achievement details
    
    # Calculation metadata
    last_calculated_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    calculation_version = Column(String, nullable=False, default="1.0")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="reputation_score")
