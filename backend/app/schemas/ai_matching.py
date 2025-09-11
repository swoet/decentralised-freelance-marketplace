"""
Pydantic schemas for AI matching API
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class FreelancerMatchResponse(BaseModel):
    """Response schema for freelancer matches"""
    freelancer_id: str
    freelancer_name: Optional[str] = None
    freelancer_email: str
    freelancer_bio: Optional[str] = None
    freelancer_skills: List[str] = []
    
    # Matching scores (0.0 to 1.0)
    similarity_score: float = Field(ge=0.0, le=1.0)
    compatibility_score: float = Field(ge=0.0, le=1.0)
    skill_match_score: float = Field(ge=0.0, le=1.0)
    budget_match_score: float = Field(ge=0.0, le=1.0)
    
    # Additional match info
    matching_skills: List[str] = []
    rank_position: int = Field(ge=1)
    cached: bool = False
    
    class Config:
        from_attributes = True


class ProjectMatchResponse(BaseModel):
    """Response schema for project matches"""
    project_id: str
    project_title: str
    project_description: str
    client_name: str
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    required_skills: List[str] = []
    
    # Matching scores (0.0 to 1.0)
    similarity_score: float = Field(ge=0.0, le=1.0)
    compatibility_score: float = Field(ge=0.0, le=1.0)
    skill_match_score: float = Field(ge=0.0, le=1.0)
    budget_match_score: float = Field(ge=0.0, le=1.0)
    
    # Additional match info
    matching_skills: List[str] = []
    complexity_score: float = Field(ge=0.0, le=1.0)
    
    class Config:
        from_attributes = True


class MatchingStatsResponse(BaseModel):
    """Response schema for AI matching system statistics"""
    ai_matching_enabled: bool
    total_project_embeddings: int
    total_freelancer_profiles: int
    total_cached_matches: int
    embedding_model: Optional[str] = None
    system_status: str  # "operational", "fallback_mode", "maintenance"
    
    class Config:
        from_attributes = True


class EmbeddingGenerationRequest(BaseModel):
    """Request schema for manual embedding generation"""
    force_regenerate: bool = False
    
    class Config:
        from_attributes = True


class EmbeddingGenerationResponse(BaseModel):
    """Response schema for embedding generation"""
    message: str
    embedding_id: Optional[str] = None
    model: Optional[str] = None
    version: Optional[str] = None
    
    class Config:
        from_attributes = True


class MatchExplanation(BaseModel):
    """Detailed explanation for why a match was recommended"""
    overall_score: float = Field(ge=0.0, le=1.0)
    skill_alignment: List[str] = []
    budget_compatibility: str
    experience_level_match: str
    availability_match: str
    communication_style_fit: str
    success_probability: float = Field(ge=0.0, le=1.0)
    risk_assessment: str
    improvement_suggestions: List[str] = []
    
    class Config:
        from_attributes = True


class DetailedFreelancerMatch(FreelancerMatchResponse):
    """Extended freelancer match with detailed explanations"""
    explanation: MatchExplanation
    estimated_completion_time: Optional[int] = None  # days
    predicted_satisfaction_score: Optional[float] = Field(None, ge=1.0, le=5.0)
    
    class Config:
        from_attributes = True


class DetailedProjectMatch(ProjectMatchResponse):
    """Extended project match with detailed explanations"""
    explanation: MatchExplanation
    estimated_earnings: Optional[float] = None
    project_urgency: Optional[str] = None  # "low", "medium", "high"
    
    class Config:
        from_attributes = True


class SkillDemandPrediction(BaseModel):
    """Skill demand prediction data"""
    skill_name: str
    skill_category: str
    current_demand_score: float = Field(ge=0.0, le=100.0)
    predicted_demand_1m: float = Field(ge=0.0, le=100.0)
    predicted_demand_3m: float = Field(ge=0.0, le=100.0)
    predicted_demand_6m: float = Field(ge=0.0, le=100.0)
    predicted_demand_1y: float = Field(ge=0.0, le=100.0)
    competition_level: str  # "low", "medium", "high"
    learning_difficulty: float = Field(ge=0.0, le=100.0)
    
    class Config:
        from_attributes = True


class MarketInsightsResponse(BaseModel):
    """Market insights and trends"""
    trending_skills: List[SkillDemandPrediction] = []
    market_gaps: List[str] = []
    average_rates_by_skill: dict = {}
    demand_forecast: dict = {}
    
    class Config:
        from_attributes = True
