from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime
from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.ai_matching import PersonalityProfile, SkillDemandPrediction
from app.models.project import Project
from app.services.ai_matching_service import AIMatchingService

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/personality/analyze/{user_id}")
async def analyze_personality(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)) -> Dict[str, Any]:
    # Allow analyzing own profile or admin (simplified: role check omitted if not in schema)
    if str(current_user.id) != str(user_id) and (getattr(current_user, 'role', '') != 'admin'):
        raise HTTPException(status_code=403, detail="Not authorized to analyze this user")

    service = AIMatchingService()
    profile: PersonalityProfile = await service.analyze_user_personality(user_id, db)
    return {
        "user_id": str(user_id),
        "openness": profile.openness,
        "conscientiousness": profile.conscientiousness,
        "extraversion": profile.extraversion,
        "agreeableness": profile.agreeableness,
        "neuroticism": profile.neuroticism,
        "analysis_confidence": profile.analysis_confidence,
        "last_analysis": profile.last_analysis,
    }


@router.get("/matching/project/{project_id}")
async def get_smart_matches(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)) -> Dict[str, Any]:
    # Ensure project belongs to current user if they are a client (basic guard)
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if getattr(current_user, 'role', '') != 'admin' and str(project.client_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to view matches for this project")

    try:
        service = AIMatchingService()
        matches = await service.get_revolutionary_matches(project_id, db, limit=10)
        
        if not matches:
            return {
                "project_id": project_id,
                "matches": [],
                "total_matches": 0,
                "message": "No matching freelancers found. This could be due to lack of freelancer profiles or compatibility data.",
                "status": "no_matches",
                "suggestions": [
                    "Encourage freelancers to complete their profiles",
                    "Run personality analysis on more users",
                    "Check if required skills are properly set"
                ]
            }
        
        return {
            "project_id": project_id,
            "matches": matches,
            "total_matches": len(matches),
            "status": "success",
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "project_id": project_id,
            "matches": [],
            "total_matches": 0,
            "message": f"Error generating matches: {str(e)}",
            "status": "error"
        }


@router.get("/skill-demand")
async def get_skill_demand(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)) -> Dict[str, Any]:
    # Return latest predictions with real-time data
    rows = db.query(SkillDemandPrediction).order_by(SkillDemandPrediction.current_demand_score.desc()).limit(50).all()
    
    # If no predictions exist, return empty state with proper message
    if not rows:
        return {
            "predictions": [],
            "total_count": 0,
            "message": "No skill demand data available yet. Run skill demand refresh to generate predictions.",
            "status": "no_data"
        }
    
    data = [
        {
            "skill_name": r.skill_name,
            "skill_category": r.skill_category,
            "current_demand_score": r.current_demand_score or 0.0,
            "predicted_demand_1m": r.predicted_demand_1m or 0.0,
            "predicted_demand_3m": r.predicted_demand_3m or 0.0,
            "predicted_demand_6m": r.predicted_demand_6m or 0.0,
            "predicted_demand_1y": r.predicted_demand_1y or 0.0,
            "competition_level": r.competition_level or "unknown",
            "learning_difficulty": r.learning_difficulty or 0.0,
            "prediction_confidence": r.prediction_confidence or 0.0,
            "data_points_analyzed": r.data_points_analyzed or 0,
            "model_version": r.model_version or "1.0",
            "last_updated": r.last_updated,
        }
        for r in rows
    ]
    return {
        "predictions": data,
        "total_count": len(data),
        "status": "success"
    }


@router.post("/skill-demand/refresh")
async def refresh_skill_demand(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)) -> Dict[str, Any]:
    # Admin-only refresh for now
    if getattr(current_user, 'role', '') != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        service = AIMatchingService()
        updated = await service.update_skill_demand_predictions(db)
        return {
            "success": True,
            "updated_count": len(updated),
            "message": f"Successfully updated {len(updated)} skill demand predictions",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh skill demand: {str(e)}")


@router.get("/stats/overview")
async def get_ai_stats_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)) -> Dict[str, Any]:
    """Get real-time AI matching system statistics overview"""
    from app.models.ai_matching import PersonalityProfile, CompatibilityScore, WorkPattern
    from sqlalchemy import func
    
    # Count personality profiles analyzed
    profiles_count = db.query(func.count(PersonalityProfile.id)).scalar() or 0
    
    # Count compatibility scores calculated
    compatibility_scores_count = db.query(func.count(CompatibilityScore.id)).scalar() or 0
    
    # Count work patterns analyzed
    work_patterns_count = db.query(func.count(WorkPattern.id)).scalar() or 0
    
    # Count skill demand predictions
    skill_predictions_count = db.query(func.count(SkillDemandPrediction.id)).scalar() or 0
    
    # Get recent activity
    from datetime import datetime, timedelta
    recent_cutoff = datetime.utcnow() - timedelta(days=7)
    
    recent_profiles = db.query(func.count(PersonalityProfile.id)).filter(
        PersonalityProfile.last_analysis >= recent_cutoff
    ).scalar() or 0
    
    recent_compatibility = db.query(func.count(CompatibilityScore.id)).filter(
        CompatibilityScore.calculation_timestamp >= recent_cutoff
    ).scalar() or 0
    
    return {
        "personality_profiles_analyzed": profiles_count,
        "compatibility_scores_calculated": compatibility_scores_count,
        "work_patterns_tracked": work_patterns_count,
        "skill_predictions_active": skill_predictions_count,
        "recent_activity": {
            "profiles_analyzed_last_7_days": recent_profiles,
            "compatibility_calculated_last_7_days": recent_compatibility
        },
        "system_status": "active" if profiles_count > 0 else "no_data",
        "last_updated": datetime.utcnow().isoformat()
    }


@router.get("/stats/matching-performance")
async def get_matching_performance_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)) -> Dict[str, Any]:
    """Get real-time matching performance statistics"""
    from app.models.ai_matching import CompatibilityScore
    from sqlalchemy import func, and_
    
    # Calculate average compatibility scores
    avg_compatibility = db.query(func.avg(CompatibilityScore.overall_compatibility)).scalar() or 0.0
    avg_success_rate = db.query(func.avg(CompatibilityScore.predicted_success_rate)).scalar() or 0.0
    avg_satisfaction = db.query(func.avg(CompatibilityScore.predicted_satisfaction_score)).scalar() or 0.0
    avg_risk = db.query(func.avg(CompatibilityScore.risk_assessment_score)).scalar() or 0.0
    
    # Count high-quality matches (compatibility > 80%)
    high_quality_matches = db.query(func.count(CompatibilityScore.id)).filter(
        CompatibilityScore.overall_compatibility > 80.0
    ).scalar() or 0
    
    total_matches = db.query(func.count(CompatibilityScore.id)).scalar() or 0
    
    return {
        "average_compatibility_score": round(avg_compatibility, 2),
        "average_predicted_success_rate": round(avg_success_rate, 2),
        "average_predicted_satisfaction": round(avg_satisfaction, 2),
        "average_risk_score": round(avg_risk, 2),
        "high_quality_matches": high_quality_matches,
        "total_matches_calculated": total_matches,
        "high_quality_match_ratio": round((high_quality_matches / total_matches * 100) if total_matches > 0 else 0.0, 2),
        "status": "active" if total_matches > 0 else "no_data",
        "last_updated": datetime.utcnow().isoformat()
    }


@router.get("/personality/stats")
async def get_personality_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)) -> Dict[str, Any]:
    """Get real-time personality analysis statistics"""
    from app.models.ai_matching import PersonalityProfile
    from sqlalchemy import func
    
    profiles = db.query(PersonalityProfile).all()
    
    if not profiles:
        return {
            "total_profiles": 0,
            "average_traits": {
                "openness": 0.0,
                "conscientiousness": 0.0,
                "extraversion": 0.0,
                "agreeableness": 0.0,
                "neuroticism": 0.0
            },
            "confidence_distribution": {},
            "status": "no_data",
            "message": "No personality profiles analyzed yet"
        }
    
    # Calculate averages
    avg_openness = sum(p.openness for p in profiles) / len(profiles)
    avg_conscientiousness = sum(p.conscientiousness for p in profiles) / len(profiles)
    avg_extraversion = sum(p.extraversion for p in profiles) / len(profiles)
    avg_agreeableness = sum(p.agreeableness for p in profiles) / len(profiles)
    avg_neuroticism = sum(p.neuroticism for p in profiles) / len(profiles)
    
    # Calculate confidence distribution
    confidence_ranges = {
        "high (>80%)": len([p for p in profiles if p.analysis_confidence > 0.8]),
        "medium (50-80%)": len([p for p in profiles if 0.5 <= p.analysis_confidence <= 0.8]),
        "low (<50%)": len([p for p in profiles if p.analysis_confidence < 0.5])
    }
    
    return {
        "total_profiles": len(profiles),
        "average_traits": {
            "openness": round(avg_openness, 2),
            "conscientiousness": round(avg_conscientiousness, 2),
            "extraversion": round(avg_extraversion, 2),
            "agreeableness": round(avg_agreeableness, 2),
            "neuroticism": round(avg_neuroticism, 2)
        },
        "confidence_distribution": confidence_ranges,
        "status": "active",
        "last_updated": datetime.utcnow().isoformat()
    }

