"""
Pydantic schemas for AI Content Generation API
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# Proposal Generation Schemas
class ProposalGenerationRequest(BaseModel):
    """Request schema for proposal generation"""
    project_id: str
    additional_context: Optional[str] = None
    
    class Config:
        from_attributes = True


class ProposalContent(BaseModel):
    """Schema for structured proposal content"""
    introduction: str
    approach: str
    experience: str
    timeline: str
    closing: str
    
    class Config:
        from_attributes = True


class ProposalGenerationResponse(BaseModel):
    """Response schema for proposal generation"""
    success: bool
    content: Dict[str, str]  # Using Dict instead of ProposalContent for flexibility
    ai_generated: bool
    model: str
    suggestions: List[str]
    
    class Config:
        from_attributes = True


# Project Description Enhancement Schemas
class ProjectDescriptionEnhanceRequest(BaseModel):
    """Request schema for project description enhancement"""
    project_id: Optional[str] = None  # If provided, will use project data
    project_title: Optional[str] = None  # Required if project_id not provided
    original_description: Optional[str] = None  # Required if project_id not provided
    required_skills: Optional[List[str]] = None
    budget_range: Optional[str] = None
    
    class Config:
        from_attributes = True


class ProjectDescriptionEnhanceResponse(BaseModel):
    """Response schema for project description enhancement"""
    success: bool
    enhanced_description: str
    original_description: str
    ai_generated: bool
    model: str
    improvements: List[str]
    
    class Config:
        from_attributes = True


# Contract Clauses Generation Schemas
class ContractClausesGenerationRequest(BaseModel):
    """Request schema for contract clauses generation"""
    project_type: str
    project_value: float = Field(gt=0)
    timeline_days: int = Field(gt=0)
    special_requirements: Optional[List[str]] = None
    
    class Config:
        from_attributes = True


class ContractClause(BaseModel):
    """Schema for individual contract clause"""
    title: str
    content: str
    
    class Config:
        from_attributes = True


class ContractClausesGenerationResponse(BaseModel):
    """Response schema for contract clauses generation"""
    success: bool
    clauses: List[Dict[str, str]]  # Using Dict for flexibility
    raw_content: str
    ai_generated: bool
    model: str
    disclaimer: str
    
    class Config:
        from_attributes = True


# Title Suggestions Schemas
class TitleSuggestionsRequest(BaseModel):
    """Request schema for project title suggestions"""
    description: str = Field(min_length=10)
    skills: List[str] = []
    count: int = Field(default=5, ge=1, le=10)
    
    class Config:
        from_attributes = True


class TitleSuggestionsResponse(BaseModel):
    """Response schema for project title suggestions"""
    success: bool
    titles: List[str]
    ai_generated: bool
    model: str
    
    class Config:
        from_attributes = True


# Bid Improvement Schemas
class BidImprovementRequest(BaseModel):
    """Request schema for bid improvement"""
    original_bid: str = Field(min_length=10)
    project_id: Optional[str] = None
    project_context: Optional[str] = None
    
    class Config:
        from_attributes = True


class BidImprovementResponse(BaseModel):
    """Response schema for bid improvement"""
    success: bool
    improved_bid: str
    original_bid: str
    ai_generated: bool
    model: str
    improvements: List[str]
    
    class Config:
        from_attributes = True


# System Statistics Schema
class AIContentStatsResponse(BaseModel):
    """Response schema for AI content generation system stats"""
    ai_content_enabled: bool
    model_name: Optional[str] = None
    system_status: str  # "operational", "fallback_mode", "maintenance"
    features_available: List[str]
    fallback_mode_active: bool
    
    class Config:
        from_attributes = True


# Advanced Schemas for Future Features
class ContentOptimizationRequest(BaseModel):
    """Request schema for content optimization"""
    content: str
    content_type: str  # "proposal", "description", "bid", "message"
    target_audience: str  # "client", "freelancer", "general"
    optimization_goals: List[str]  # ["clarity", "persuasiveness", "professionalism"]
    
    class Config:
        from_attributes = True


class ContentOptimizationResponse(BaseModel):
    """Response schema for content optimization"""
    success: bool
    optimized_content: str
    original_content: str
    optimizations_applied: List[str]
    readability_score: Optional[float] = None
    engagement_score: Optional[float] = None
    ai_generated: bool
    model: str
    
    class Config:
        from_attributes = True


class WritingAssistanceRequest(BaseModel):
    """Request schema for writing assistance"""
    partial_content: str
    writing_goal: str  # "complete", "improve", "expand", "summarize"
    tone: Optional[str] = "professional"  # "professional", "casual", "formal"
    length_target: Optional[str] = "medium"  # "short", "medium", "long"
    
    class Config:
        from_attributes = True


class WritingAssistanceResponse(BaseModel):
    """Response schema for writing assistance"""
    success: bool
    suggested_content: str
    writing_tips: List[str]
    tone_analysis: Dict[str, Any]
    ai_generated: bool
    model: str
    
    class Config:
        from_attributes = True


class TemplateGenerationRequest(BaseModel):
    """Request schema for template generation"""
    template_type: str  # "proposal", "contract", "project_brief", "communication"
    industry: Optional[str] = None
    project_size: Optional[str] = "medium"  # "small", "medium", "large"
    formality_level: Optional[str] = "professional"  # "casual", "professional", "formal"
    custom_fields: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


class TemplateGenerationResponse(BaseModel):
    """Response schema for template generation"""
    success: bool
    template_content: str
    template_sections: Dict[str, str]
    customization_instructions: List[str]
    placeholders: List[str]
    ai_generated: bool
    model: str
    
    class Config:
        from_attributes = True
