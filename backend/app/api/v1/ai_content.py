"""
AI Content Generation API Endpoints
Provides AI-powered content assistance for proposals, descriptions, and contracts
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging

from ...core.db import get_db
from ...models.user import User
from ...models.project import Project
from ...services.ai_content_generation import ai_content_generator
from ...core.auth import get_current_user
from ...schemas.ai_content import (
    ProposalGenerationRequest,
    ProposalGenerationResponse,
    ProjectDescriptionEnhanceRequest,
    ProjectDescriptionEnhanceResponse,
    ContractClausesGenerationRequest,
    ContractClausesGenerationResponse,
    TitleSuggestionsRequest,
    TitleSuggestionsResponse,
    BidImprovementRequest,
    BidImprovementResponse,
    AIContentStatsResponse
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/proposals/generate", response_model=ProposalGenerationResponse)
async def generate_proposal(
    request: ProposalGenerationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate an AI-powered proposal draft for a freelancer.
    Only freelancers can generate proposals.
    """
    
    if current_user.role != 'freelancer':
        raise HTTPException(status_code=403, detail="Only freelancers can generate proposals")
    
    # Get the project
    project = db.query(Project).filter(Project.id == request.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if project is still open for bids
    if project.status != 'open':
        raise HTTPException(status_code=400, detail="Project is not accepting new proposals")
    
    try:
        # Generate proposal using AI service
        result = await ai_content_generator.generate_proposal_draft(
            project=project,
            freelancer=current_user,
            additional_context=request.additional_context
        )
        
        logger.info(f"Generated proposal for freelancer {current_user.id} and project {request.project_id}")
        
        return ProposalGenerationResponse(**result)
        
    except Exception as e:
        logger.error(f"Error generating proposal: {e}")
        raise HTTPException(status_code=500, detail="Error generating proposal")


@router.post("/projects/enhance-description", response_model=ProjectDescriptionEnhanceResponse)
async def enhance_project_description(
    request: ProjectDescriptionEnhanceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Enhance a project description using AI.
    Only project owners or admins can enhance descriptions.
    """
    
    # If project_id is provided, check ownership
    if request.project_id:
        project = db.query(Project).filter(Project.id == request.project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.client_id != current_user.id and current_user.role != 'admin':
            raise HTTPException(status_code=403, detail="Not authorized to enhance this project description")
    
    try:
        # Use project data if available, otherwise use provided data
        if request.project_id and project:
            title = project.title
            description = project.description
            skills = project.project_metadata.get('required_skills', []) if project.project_metadata else []
            budget_range = f"${project.budget_min} - ${project.budget_max}" if project.budget_min and project.budget_max else None
        else:
            title = request.project_title
            description = request.original_description
            skills = request.required_skills or []
            budget_range = request.budget_range
        
        # Enhance description using AI service
        result = await ai_content_generator.enhance_project_description(
            original_description=description,
            project_title=title,
            required_skills=skills,
            budget_range=budget_range
        )
        
        logger.info(f"Enhanced project description for user {current_user.id}")
        
        return ProjectDescriptionEnhanceResponse(**result)
        
    except Exception as e:
        logger.error(f"Error enhancing project description: {e}")
        raise HTTPException(status_code=500, detail="Error enhancing project description")


@router.post("/contracts/generate-clauses", response_model=ContractClausesGenerationResponse)
async def generate_contract_clauses(
    request: ContractClausesGenerationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate standard contract clauses for a project.
    Available to all authenticated users.
    """
    
    try:
        # Generate contract clauses using AI service
        result = await ai_content_generator.generate_contract_clauses(
            project_type=request.project_type,
            project_value=request.project_value,
            timeline_days=request.timeline_days,
            special_requirements=request.special_requirements
        )
        
        logger.info(f"Generated contract clauses for user {current_user.id}")
        
        return ContractClausesGenerationResponse(**result)
        
    except Exception as e:
        logger.error(f"Error generating contract clauses: {e}")
        raise HTTPException(status_code=500, detail="Error generating contract clauses")


@router.post("/projects/title-suggestions", response_model=TitleSuggestionsResponse)
async def generate_title_suggestions(
    request: TitleSuggestionsRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate project title suggestions.
    Available to all authenticated users.
    """
    
    try:
        # Generate title suggestions using AI service
        result = await ai_content_generator.generate_project_title_suggestions(
            description=request.description,
            skills=request.skills,
            count=request.count
        )
        
        logger.info(f"Generated title suggestions for user {current_user.id}")
        
        return TitleSuggestionsResponse(**result)
        
    except Exception as e:
        logger.error(f"Error generating title suggestions: {e}")
        raise HTTPException(status_code=500, detail="Error generating title suggestions")


@router.post("/bids/improve", response_model=BidImprovementResponse)
async def improve_bid_response(
    request: BidImprovementRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Improve a bid response using AI.
    Only freelancers can improve bid responses.
    """
    
    if current_user.role != 'freelancer':
        raise HTTPException(status_code=403, detail="Only freelancers can improve bid responses")
    
    try:
        # Get project context if project_id is provided
        project_context = ""
        if request.project_id:
            project = db.query(Project).filter(Project.id == request.project_id).first()
            if project:
                project_context = f"{project.title}: {project.description}"
        
        # Use provided context if no project found
        if not project_context:
            project_context = request.project_context or "General freelance project"
        
        # Improve bid using AI service
        result = await ai_content_generator.improve_bid_response(
            original_bid=request.original_bid,
            project_context=project_context,
            freelancer_skills=current_user.skills or []
        )
        
        logger.info(f"Improved bid response for freelancer {current_user.id}")
        
        return BidImprovementResponse(**result)
        
    except Exception as e:
        logger.error(f"Error improving bid response: {e}")
        raise HTTPException(status_code=500, detail="Error improving bid response")


@router.get("/stats", response_model=AIContentStatsResponse)
async def get_ai_content_stats(
    current_user: User = Depends(get_current_user)
):
    """
    Get AI content generation system statistics.
    Available to all authenticated users.
    """
    
    try:
        stats = AIContentStatsResponse(
            ai_content_enabled=ai_content_generator.is_initialized,
            model_name=ai_content_generator.model_name if ai_content_generator.is_initialized else None,
            system_status="operational" if ai_content_generator.is_initialized else "fallback_mode",
            features_available=[
                "Proposal Generation",
                "Project Description Enhancement", 
                "Contract Clause Generation",
                "Title Suggestions",
                "Bid Improvement"
            ],
            fallback_mode_active=not ai_content_generator.is_initialized
        )
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting AI content stats: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving system statistics")


@router.post("/test-connection")
async def test_ai_connection(
    current_user: User = Depends(get_current_user)
):
    """
    Test AI service connection (admin only).
    """
    
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        if not ai_content_generator.is_initialized:
            return {
                "status": "disconnected",
                "message": "AI content generation is running in fallback mode",
                "has_openai": ai_content_generator.is_initialized
            }
        
        # Test with a simple request
        test_result = await ai_content_generator._call_openai(
            system_message="You are a helpful assistant.",
            user_message="Say 'Hello, AI content generation is working!'",
            max_tokens=50,
            temperature=0.5
        )
        
        return {
            "status": "connected",
            "message": "AI content generation is working properly",
            "test_response": test_result.strip(),
            "model": ai_content_generator.model_name
        }
        
    except Exception as e:
        logger.error(f"AI connection test failed: {e}")
        return {
            "status": "error",
            "message": f"AI connection test failed: {str(e)}",
            "has_openai": ai_content_generator.is_initialized
        }
