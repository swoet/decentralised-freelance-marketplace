"""Enhanced AI matching API endpoints."""

from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.db import get_db
from app.core.config import settings
from app.core.auth import get_current_user
from app.models.user import User, UserRole
from app.models.skills import SkillVerification, ReputationScore

# Optional AI service import (graceful failure for compatibility)
try:
    from app.services.ai_matching_service import AIMatchingService
    AI_MATCHING_AVAILABLE = True
except ImportError as e:
    print(f"Warning: AI matching service not available: {e}")
    AIMatchingService = None
    AI_MATCHING_AVAILABLE = False

from app.services.skills_verification_service import SkillsVerificationService
from app.services.reputation_service import ReputationService

router = APIRouter()

# Initialize services
ai_matching_service = AIMatchingService() if AI_MATCHING_AVAILABLE else None
skills_service = SkillsVerificationService()
reputation_service = ReputationService()


# Pydantic models for requests/responses
class MatchingResult(BaseModel):
    freelancer_id: str
    similarity_score: float
    compatibility_score: float
    budget_match_score: Optional[float]
    skill_match_score: Optional[float]
    rank_position: int
    match_reasons: List[str] = []
    skill_gaps: List[str] = []


class ProjectMatchingResponse(BaseModel):
    project_id: str
    matches: List[MatchingResult]
    total_matches: int
    algorithm_version: str


class QuizStartRequest(BaseModel):
    skill_id: str
    difficulty_level: str = Field(default="intermediate", pattern="^(beginner|intermediate|advanced)$")


class QuizSubmissionRequest(BaseModel):
    verification_id: str
    answers: List[Dict[str, Any]]


class EvidenceSubmissionRequest(BaseModel):
    skill_id: str
    evidence_url: str
    evidence_type: str = Field(pattern="^(portfolio|certificate|code_sample|diploma)$")
    description: str


class OAuthVerificationRequest(BaseModel):
    skill_id: str
    provider: str = Field(pattern="^(github|linkedin)$")
    oauth_data: Dict[str, Any]


class VerificationReviewRequest(BaseModel):
    approved: bool
    notes: Optional[str] = None
    skill_level: Optional[str] = Field(None, pattern="^(beginner|intermediate|advanced|expert)$")


class ReputationResponse(BaseModel):
    user_id: str
    total_score: float
    quality_score: float
    reliability_score: float
    expertise_score: float
    professionalism_score: float
    growth_score: float
    badges: List[str]
    projects_completed: int
    avg_rating: Optional[float]
    verified_skills_count: int
    last_calculated_at: str


@router.get("/projects/{project_id}/matches", response_model=ProjectMatchingResponse)
async def get_project_matches(
    project_id: str,
    limit: int = Query(20, ge=1, le=100),
    min_similarity: float = Query(0.3, ge=0.0, le=1.0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI-powered matching results for a project."""
    if not settings.AI_MATCHING_ENABLED or not AI_MATCHING_AVAILABLE or not ai_matching_service:
        raise HTTPException(status_code=501, detail="AI matching is not available")
    
    try:
        matches = ai_matching_service.find_matching_freelancers(
            db, project_id, limit, min_similarity
        )
        
        return ProjectMatchingResponse(
            project_id=project_id,
            matches=[MatchingResult(**match) for match in matches],
            total_matches=len(matches),
            algorithm_version="2.0"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get matches: {str(e)}")


@router.get("/freelancers/{freelancer_id}/project-recommendations")
async def get_freelancer_project_recommendations(
    freelancer_id: str,
    limit: int = Query(20, ge=1, le=100),
    min_similarity: float = Query(0.3, ge=0.0, le=1.0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI-powered project recommendations for a freelancer."""
    if not settings.AI_MATCHING_ENABLED or not AI_MATCHING_AVAILABLE or not ai_matching_service:
        raise HTTPException(status_code=501, detail="AI matching is not available")
    
    # Verify user can access this freelancer's data
    if str(current_user.id) != freelancer_id and str(current_user.role) != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        matches = ai_matching_service.find_matching_projects(
            db, freelancer_id, limit, min_similarity
        )
        
        return {
            "freelancer_id": freelancer_id,
            "recommendations": matches,
            "total_recommendations": len(matches),
            "algorithm_version": "2.0"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")


@router.post("/embeddings/projects/{project_id}/generate")
async def generate_project_embedding(
    project_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate or update embedding for a project."""
    if not settings.AI_MATCHING_ENABLED or not AI_MATCHING_AVAILABLE or not ai_matching_service:
        raise HTTPException(status_code=501, detail="AI matching is not available")
    
    try:
        # Get project and verify access
        from app.models.project import Project
        project = db.query(Project).filter(Project.id == project_id).first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Verify user owns the project or is admin
        if str(project.client_id) != str(current_user.id) and str(current_user.role) != UserRole.ADMIN.value:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Generate embedding
        embedding = ai_matching_service.generate_project_embedding(db, project)
        
        if embedding:
            return {
                "project_id": project_id,
                "embedding_id": str(embedding.id),
                "status": "generated",
                "embedding_version": embedding.embedding_version
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to generate embedding")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")


@router.post("/embeddings/freelancers/{freelancer_id}/generate")
async def generate_freelancer_embedding(
    freelancer_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate or update embedding for a freelancer profile."""
    if not settings.AI_MATCHING_ENABLED or not AI_MATCHING_AVAILABLE or not ai_matching_service:
        raise HTTPException(status_code=501, detail="AI matching is not available")
    
    # Verify user can generate embedding for this freelancer
    if str(current_user.id) != freelancer_id and str(current_user.role) != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        user = db.query(User).filter(User.id == freelancer_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Generate embedding
        profile = ai_matching_service.generate_freelancer_embedding(db, user)
        
        if profile:
            return {
                "freelancer_id": freelancer_id,
                "profile_id": str(profile.id),
                "status": "generated",
                "embedding_version": profile.embedding_version
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to generate profile embedding")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")


# Skills Verification Endpoints

@router.post("/skills/verification/quiz/start")
async def start_skill_quiz(
    request: QuizStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a skill verification quiz."""
    if not settings.SKILLS_VERIFICATION_ENABLED:
        raise HTTPException(status_code=501, detail="Skills verification is not enabled")
    
    try:
        quiz_data = skills_service.start_quiz_verification(
            db, str(current_user.id), request.skill_id, request.difficulty_level
        )
        
        if quiz_data:
            return quiz_data
        else:
            raise HTTPException(status_code=500, detail="Failed to start quiz")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start quiz: {str(e)}")


@router.post("/skills/verification/quiz/submit")
async def submit_quiz_answers(
    request: QuizSubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit quiz answers for verification."""
    if not settings.SKILLS_VERIFICATION_ENABLED:
        raise HTTPException(status_code=501, detail="Skills verification is not enabled")
    
    try:
        result = skills_service.submit_quiz_answers(
            db, request.verification_id, request.answers
        )
        
        if result:
            return result
        else:
            raise HTTPException(status_code=500, detail="Failed to submit quiz")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit quiz: {str(e)}")


@router.post("/skills/verification/evidence")
async def submit_evidence_verification(
    request: EvidenceSubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit evidence-based skill verification."""
    if not settings.SKILLS_VERIFICATION_ENABLED:
        raise HTTPException(status_code=501, detail="Skills verification is not enabled")
    
    try:
        verification = skills_service.submit_evidence_verification(
            db,
            str(current_user.id),
            request.skill_id,
            request.evidence_url,
            request.evidence_type,
            request.description
        )
        
        if verification:
            # Extract method and status values properly
            method_value = verification.method.value if hasattr(verification.method, 'value') else str(verification.method)
            status_value = verification.status.value if hasattr(verification.status, 'value') else str(verification.status)
            
            return {
                "verification_id": str(verification.id),
                "status": status_value,
                "evidence_type": method_value,
                "created_at": verification.created_at.isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to submit evidence")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit evidence: {str(e)}")


@router.post("/skills/verification/oauth")
async def submit_oauth_verification(
    request: OAuthVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit OAuth-based skill verification."""
    if not settings.SKILLS_VERIFICATION_ENABLED:
        raise HTTPException(status_code=501, detail="Skills verification is not enabled")
    
    try:
        verification = skills_service.submit_oauth_verification(
            db,
            str(current_user.id),
            request.skill_id,
            request.provider,
            request.oauth_data
        )
        
        if verification:
            # Extract method and status values properly
            method_value = verification.method.value if hasattr(verification.method, 'value') else str(verification.method)
            status_value = verification.status.value if hasattr(verification.status, 'value') else str(verification.status)
            
            return {
                "verification_id": str(verification.id),
                "status": status_value,
                "provider": method_value,
                "confidence_score": verification.score or 0,
                "created_at": verification.created_at.isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to submit OAuth verification")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit OAuth verification: {str(e)}")


@router.get("/skills/verification/my-verifications")
async def get_my_verifications(
    status: Optional[str] = Query(None, pattern="^(pending|approved|rejected)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's skill verifications."""
    try:
        verifications = skills_service.get_user_verifications(
            db, str(current_user.id), status
        )
        
        return {
            "verifications": [
                {
                    "id": str(v.id),
                    "skill_id": str(v.skill_id),
                    "verification_type": v.method.value if hasattr(v.method, 'value') else str(v.method),
                    "status": v.status.value if hasattr(v.status, 'value') else str(v.status),
                    "confidence_score": v.score or 0,
                    "skill_level": "intermediate",  # Default since not in model
                    "created_at": v.created_at.isoformat(),
                    "verified_at": v.updated_at.isoformat() if v.updated_at is not None else None
                }
                for v in verifications
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get verifications: {str(e)}")


@router.get("/skills/verification/pending")
async def get_pending_verifications(
    verification_type: Optional[str] = Query(None, pattern="^(quiz|evidence|oauth|peer_review)$"),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get pending verifications for admin review."""
    if str(current_user.role) != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        verifications = skills_service.get_pending_verifications(
            db, verification_type, limit
        )
        
        return {
            "pending_verifications": [
                {
                    "id": str(v.id),
                    "user_id": str(v.user_id),
                    "skill_id": str(v.skill_id),
                    "verification_type": v.method.value if hasattr(v.method, 'value') else str(v.method),
                    "evidence_url": None,  # Not in model, stored in metadata
                    "evidence_type": v.method.value if hasattr(v.method, 'value') else str(v.method),
                    "evidence_description": None,  # Not in model, stored in metadata
                    "oauth_provider": v.method.value if hasattr(v.method, 'value') and str(v.method) == 'oauth' else None,
                    "created_at": v.created_at.isoformat()
                }
                for v in verifications
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get pending verifications: {str(e)}")


@router.post("/skills/verification/{verification_id}/review")
async def review_verification(
    verification_id: str,
    request: VerificationReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Review a skill verification (admin only)."""
    if str(current_user.role) != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        verification = skills_service.review_verification(
            db,
            verification_id,
            str(current_user.id),
            request.approved,
            request.notes,
            request.skill_level
        )
        
        if verification:
            status_value = verification.status.value if hasattr(verification.status, 'value') else str(verification.status)
            return {
                "verification_id": str(verification.id),
                "status": status_value,
                "reviewed_by": None,  # Not in current model
                "reviewer_notes": None,  # Not in current model
                "verified_at": verification.updated_at.isoformat() if verification.updated_at is not None else None
            }
        else:
            raise HTTPException(status_code=404, detail="Verification not found")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review verification: {str(e)}")


# Reputation Endpoints

@router.get("/reputation/{user_id}", response_model=ReputationResponse)
async def get_user_reputation(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed reputation score for a user."""
    if not settings.REPUTATION_V2_ENABLED:
        raise HTTPException(status_code=501, detail="Advanced reputation is not enabled")
    
    try:
        reputation = reputation_service.calculate_reputation_score(db, user_id)
        
        if reputation:
            return ReputationResponse(
                user_id=str(reputation.user_id),
                total_score=getattr(reputation, 'total_score', 0.0),
                quality_score=getattr(reputation, 'quality_score', 0.0),
                reliability_score=getattr(reputation, 'reliability_score', 0.0),
                expertise_score=getattr(reputation, 'expertise_score', 0.0),
                professionalism_score=getattr(reputation, 'professionalism_score', 0.0),
                growth_score=getattr(reputation, 'growth_score', 0.0),
                badges=getattr(reputation, 'badges', []) or [],
                projects_completed=getattr(reputation, 'projects_completed', 0),
                avg_rating=getattr(reputation, 'avg_rating', None),
                verified_skills_count=getattr(reputation, 'verified_skills_count', 0),
                last_calculated_at=getattr(reputation, 'last_calculated_at', datetime.utcnow()).isoformat()
            )
        else:
            raise HTTPException(status_code=404, detail="Reputation not found")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get reputation: {str(e)}")


@router.post("/reputation/{user_id}/recalculate")
async def recalculate_reputation(
    user_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Recalculate reputation score for a user."""
    if not settings.REPUTATION_V2_ENABLED:
        raise HTTPException(status_code=501, detail="Advanced reputation is not enabled")
    
    # Verify user can recalculate this reputation
    if str(current_user.id) != user_id and str(current_user.role) != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Add to background tasks for async processing
        background_tasks.add_task(reputation_service.calculate_reputation_score, db, user_id)
        
        return {
            "user_id": user_id,
            "status": "recalculation_queued",
            "message": "Reputation recalculation has been queued"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to queue recalculation: {str(e)}")


@router.get("/reputation/leaderboard")
async def get_reputation_leaderboard(
    category: Optional[str] = Query(None, pattern="^(quality|reliability|expertise|professionalism|growth)$"),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get reputation leaderboard."""
    if not settings.REPUTATION_V2_ENABLED:
        raise HTTPException(status_code=501, detail="Advanced reputation is not enabled")
    
    try:
        leaderboard = reputation_service.get_reputation_leaderboard(db, limit, category)
        
        return {
            "category": category or "overall",
            "leaderboard": leaderboard,
            "total_entries": len(leaderboard)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get leaderboard: {str(e)}")
