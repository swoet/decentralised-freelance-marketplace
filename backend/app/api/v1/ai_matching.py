"""
AI-Powered Matching API Endpoints
Provides intelligent freelancer-project matching using ML models
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import logging

from ...core.db import get_db
from ...models.user import User
from ...models.project import Project
from ...services.ai_matching_service_v2 import ai_matching_service
from ...core.auth import get_current_user
from ...schemas.ai_matching import (
    FreelancerMatchResponse, 
    ProjectMatchResponse, 
    MatchingStatsResponse,
    EmbeddingGenerationRequest
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/projects/{project_id}/freelancers", response_model=List[FreelancerMatchResponse])
async def get_project_freelancer_matches(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=50),
    min_similarity: float = Query(0.3, ge=0.0, le=1.0)
):
    """
    Get AI-powered freelancer matches for a project.
    Only project owners or admins can access this endpoint.
    """
    
    # Get project and verify ownership
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if user has permission to view matches
    if project.client_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized to view matches for this project")
    
    try:
        # Get AI-powered matches
        matches = ai_matching_service.find_matching_freelancers(
            db=db,
            project_id=project_id,
            limit=limit,
            min_similarity=min_similarity
        )
        
        # Transform to response format
        response_matches = []
        for match in matches:
            freelancer = match.get('freelancer')
            if freelancer:
                response_matches.append(FreelancerMatchResponse(
                    freelancer_id=match['freelancer_id'],
                    freelancer_name=freelancer.full_name,
                    freelancer_email=freelancer.email,
                    freelancer_bio=freelancer.bio,
                    freelancer_skills=freelancer.skills or [],
                    similarity_score=match['similarity_score'],
                    compatibility_score=match['compatibility_score'],
                    skill_match_score=match['skill_match_score'],
                    budget_match_score=match['budget_match_score'],
                    matching_skills=match.get('matching_skills', []),
                    cached=match.get('cached', False),
                    rank_position=match.get('rank_position', 0)
                ))
        
        logger.info(f"Returned {len(response_matches)} AI matches for project {project_id}")
        return response_matches
        
    except Exception as e:
        logger.error(f"Error getting matches for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving matches")


@router.get("/freelancers/{freelancer_id}/projects", response_model=List[ProjectMatchResponse])
async def get_freelancer_project_matches(
    freelancer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=50),
    min_similarity: float = Query(0.3, ge=0.0, le=1.0)
):
    """
    Get AI-powered project matches for a freelancer.
    Only the freelancer themselves or admins can access this endpoint.
    """
    
    # Check if user has permission
    if freelancer_id != str(current_user.id) and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized to view matches for this freelancer")
    
    # Verify freelancer exists and is a freelancer
    freelancer = db.query(User).filter(User.id == freelancer_id).first()
    if not freelancer:
        raise HTTPException(status_code=404, detail="Freelancer not found")
    
    if freelancer.role != 'freelancer':
        raise HTTPException(status_code=400, detail="User is not a freelancer")
    
    try:
        # Get AI-powered project recommendations
        matches = ai_matching_service.find_matching_projects(
            db=db,
            freelancer_id=freelancer_id,
            limit=limit,
            min_similarity=min_similarity
        )
        
        # Transform to response format
        response_matches = []
        for match in matches:
            project_embedding = match.get('project_embedding')
            if project_embedding and project_embedding.project:
                project = project_embedding.project
                response_matches.append(ProjectMatchResponse(
                    project_id=match['project_id'],
                    project_title=project.title,
                    project_description=project.description,
                    client_name=project.client.full_name if project.client else "Unknown",
                    budget_min=project.budget_min,
                    budget_max=project.budget_max,
                    required_skills=project_embedding.skills_required or [],
                    similarity_score=match['similarity_score'],
                    compatibility_score=match['compatibility_score'],
                    skill_match_score=match['skill_match_score'],
                    budget_match_score=match['budget_match_score'],
                    matching_skills=[],  # Can be enhanced later
                    complexity_score=project_embedding.complexity_score or 0.0
                ))
        
        logger.info(f"Returned {len(response_matches)} project recommendations for freelancer {freelancer_id}")
        return response_matches
        
    except Exception as e:
        logger.error(f"Error getting project recommendations for freelancer {freelancer_id}: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving project recommendations")


@router.post("/projects/{project_id}/generate-embedding")
async def generate_project_embedding(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate AI embedding for a project.
    Only project owners or admins can trigger this.
    """
    
    # Get project and verify ownership
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.client_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized to generate embedding for this project")
    
    try:
        # Generate embedding
        embedding = ai_matching_service.generate_project_embedding(db, project)
        
        if embedding:
            return {
                "message": "Project embedding generated successfully",
                "embedding_id": str(embedding.id),
                "model": embedding.embedding_model,
                "version": embedding.embedding_version
            }
        else:
            return {
                "message": "Embedding generation skipped (model not available or error occurred)",
                "embedding_id": None
            }
            
    except Exception as e:
        logger.error(f"Error generating embedding for project {project_id}: {e}")
        raise HTTPException(status_code=500, detail="Error generating project embedding")


@router.post("/freelancers/{freelancer_id}/generate-embedding")
async def generate_freelancer_embedding(
    freelancer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate AI embedding for a freelancer profile.
    Only the freelancer themselves or admins can trigger this.
    """
    
    # Check permissions
    if freelancer_id != str(current_user.id) and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized to generate embedding for this freelancer")
    
    # Get freelancer
    freelancer = db.query(User).filter(User.id == freelancer_id).first()
    if not freelancer:
        raise HTTPException(status_code=404, detail="Freelancer not found")
    
    if freelancer.role != 'freelancer':
        raise HTTPException(status_code=400, detail="User is not a freelancer")
    
    try:
        # Generate embedding
        embedding = ai_matching_service.generate_freelancer_embedding(db, freelancer)
        
        if embedding:
            return {
                "message": "Freelancer embedding generated successfully",
                "embedding_id": str(embedding.id),
                "model": embedding.embedding_model,
                "version": embedding.embedding_version
            }
        else:
            return {
                "message": "Embedding generation skipped (model not available or error occurred)",
                "embedding_id": None
            }
            
    except Exception as e:
        logger.error(f"Error generating embedding for freelancer {freelancer_id}: {e}")
        raise HTTPException(status_code=500, detail="Error generating freelancer embedding")


@router.get("/stats", response_model=MatchingStatsResponse)
async def get_matching_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get AI matching system statistics.
    Available to all authenticated users.
    """
    
    try:
        # Get basic stats from the matching service
        from ...models.matching import ProjectEmbedding, FreelancerProfile, MatchingResult
        
        total_project_embeddings = db.query(ProjectEmbedding).count()
        total_freelancer_profiles = db.query(FreelancerProfile).count()
        total_cached_results = db.query(MatchingResult).count()
        
        # Check if AI matching is available
        ai_available = ai_matching_service.is_initialized
        
        stats = MatchingStatsResponse(
            ai_matching_enabled=ai_available,
            total_project_embeddings=total_project_embeddings,
            total_freelancer_profiles=total_freelancer_profiles,
            total_cached_matches=total_cached_results,
            embedding_model=ai_matching_service.embedding_model.__class__.__name__ if ai_matching_service.embedding_model else None,
            system_status="operational" if ai_available else "fallback_mode"
        )
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting matching stats: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving matching statistics")


@router.delete("/cache")
async def clear_matching_cache(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Clear the matching cache.
    Only admins can clear the cache.
    """
    
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        from ...models.matching import MatchingResult
        
        # Delete all cached results
        deleted_count = db.query(MatchingResult).delete()
        db.commit()
        
        logger.info(f"Admin {current_user.id} cleared matching cache ({deleted_count} entries)")
        
        return {
            "message": f"Matching cache cleared successfully",
            "deleted_entries": deleted_count
        }
        
    except Exception as e:
        logger.error(f"Error clearing matching cache: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error clearing cache")
