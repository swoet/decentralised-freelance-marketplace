from fastapi import APIRouter, Depends, Response, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

from app.api.deps import get_db, get_current_user_optional, get_current_active_user
from app.models.user import User
from app.models.project import Project
from app.models.community import CommunityThread, Event
from app.models.integration import Integration
from app.services.ai_matching_service import AIMatchingService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/")
async def get_dashboard_data(
    response: Response,
    preview: bool = Query(False, description="Preview mode for anonymous users"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    """
    Get dashboard data for both authenticated and anonymous users.
    Anonymous users see public preview data, authenticated users see personalized data.
    """
    
    # Add caching headers
    cache_time = 300 if current_user is None else 60  # 5 min for anonymous, 1 min for authenticated
    response.headers["Cache-Control"] = f"public, max-age={cache_time}, stale-while-revalidate=30"
    response.headers["Vary"] = "Authorization"
    
    # Base dashboard data
    dashboard_data: Dict[str, Any] = {
        "user": {
            "authenticated": current_user is not None,
            "preview_mode": preview
        },
        "projects": {},
        "community": {},
        "integrations": {},
        "stats": {}
    }
    
    # Get recent projects
    projects_query = db.query(Project).filter(
        Project.created_at >= datetime.utcnow() - timedelta(days=30)
    ).order_by(Project.created_at.desc())
    
    if current_user and not preview:
        # For authenticated users, show their projects and recommended ones
        user_projects = projects_query.filter(Project.client_id == current_user.id).limit(5).all()
        other_projects = projects_query.filter(Project.client_id != current_user.id).limit(3).all()
        
        dashboard_data["projects"] = {
            "user_projects": [
                {
                    "id": str(p.id),
                    "title": p.title,
                    "description": p.description[:100] + "..." if len(p.description) > 100 else p.description,
                    "budget_range": f"${p.budget_min:,.0f} - ${p.budget_max:,.0f}",
                    "status": p.status,
                    "created_at": p.created_at.isoformat() if p.created_at else None
                } for p in user_projects
            ],
            "recommended_projects": [
                {
                    "id": str(p.id),
                    "title": p.title,
                    "description": p.description[:100] + "..." if len(p.description) > 100 else p.description,
                    "budget_range": f"${p.budget_min:,.0f} - ${p.budget_max:,.0f}",
                    "created_at": p.created_at.isoformat() if p.created_at else None
                } for p in other_projects
            ]
        }
    else:
        # For anonymous users, show featured/sample projects
        sample_projects = projects_query.limit(6).all()
        dashboard_data["projects"] = {
            "featured_projects": [
                {
                    "id": str(p.id),
                    "title": p.title,
                    "description": p.description[:100] + "..." if len(p.description) > 100 else p.description,
                    "budget_range": f"${p.budget_min:,.0f} - ${p.budget_max:,.0f}",
                    "created_at": p.created_at.isoformat() if p.created_at else None
                } for p in sample_projects
            ]
        }
    
    # Get community activity
    recent_threads = db.query(CommunityThread).order_by(
        CommunityThread.created_at.desc()
    ).limit(5).all()
    
    dashboard_data["community"] = {
        "recent_threads": [
            {
                "id": str(t.id),
                "title": t.title,
                "tags": t.tags or [],
                "created_at": t.created_at.isoformat() if t.created_at else None
            } for t in recent_threads
        ]
    }
    
    # Get upcoming events
    upcoming_events = db.query(Event).filter(
        Event.starts_at >= datetime.utcnow()
    ).order_by(Event.starts_at).limit(4).all()
    
    dashboard_data["community"]["upcoming_events"] = [
        {
            "id": str(e.id),
            "title": e.title,
            "starts_at": e.starts_at.isoformat() if e.starts_at else None,
            "is_online": e.is_online,
            "is_free": e.is_free,
            "category": e.category
        } for e in upcoming_events
    ]
    
    # Get integration stats
    if current_user and not preview:
        user_integrations = db.query(Integration).filter(
            Integration.owner_id == current_user.id
        ).count()
        dashboard_data["integrations"] = {
            "connected_count": user_integrations,
            "available_providers": ["slack", "github", "jira", "discord"]
        }
    else:
        dashboard_data["integrations"] = {
            "available_providers": [
                {"name": "slack", "description": "Team communication", "category": "communication"},
                {"name": "github", "description": "Code repositories", "category": "development"},
                {"name": "jira", "description": "Project management", "category": "project-management"},
                {"name": "discord", "description": "Community chat", "category": "communication"}
            ]
        }
    
    # Get platform stats
    total_projects = db.query(Project).count()
    total_threads = db.query(CommunityThread).count()
    active_events = db.query(Event).filter(Event.starts_at >= datetime.utcnow()).count()
    
    dashboard_data["stats"] = {
        "total_projects": total_projects,
        "active_threads": total_threads,
        "upcoming_events": active_events,
        "platform_activity": "high" if total_projects > 10 else "moderate"
    }
    
    return dashboard_data

@router.get("/stats")
async def get_dashboard_stats(
    response: Response,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    """Get platform statistics for the dashboard"""
    
    # Add caching headers - stats change less frequently
    response.headers["Cache-Control"] = "public, max-age=600, stale-while-revalidate=300"  # 10 min cache
    
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    # Platform-wide stats
    stats = {
        "projects": {
            "total": db.query(Project).count(),
            "this_week": db.query(Project).filter(Project.created_at >= week_ago).count(),
            "this_month": db.query(Project).filter(Project.created_at >= month_ago).count()
        },
        "community": {
            "total_threads": db.query(CommunityThread).count(),
            "active_events": db.query(Event).filter(Event.starts_at >= now).count(),
            "recent_activity": db.query(CommunityThread).filter(
                CommunityThread.created_at >= week_ago
            ).count()
        }
    }
    
    # Add user-specific stats if authenticated
    if current_user:
        stats["user"] = {
            "projects_created": db.query(Project).filter(Project.client_id == current_user.id).count(),
            "threads_created": db.query(CommunityThread).filter(
                CommunityThread.author_id == current_user.id
            ).count(),
            "integrations_connected": db.query(Integration).filter(
                Integration.owner_id == current_user.id
            ).count()
        }
    
    return stats


@router.get("/admin/ai-status")
async def get_admin_ai_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Get AI system status for admin dashboard"""
    # Check if user is admin
    if getattr(current_user, 'role', '') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from app.models.ai_matching import PersonalityProfile, CompatibilityScore, WorkPattern, SkillDemandPrediction
    from sqlalchemy import func
    
    # Get comprehensive AI system status
    personality_profiles = db.query(func.count(PersonalityProfile.id)).scalar() or 0
    compatibility_scores = db.query(func.count(CompatibilityScore.id)).scalar() or 0
    work_patterns = db.query(func.count(WorkPattern.id)).scalar() or 0
    skill_predictions = db.query(func.count(SkillDemandPrediction.id)).scalar() or 0
    
    # Get recent activity (last 24 hours)
    from datetime import datetime, timedelta
    recent_cutoff = datetime.utcnow() - timedelta(hours=24)
    
    recent_profiles = db.query(func.count(PersonalityProfile.id)).filter(
        PersonalityProfile.last_analysis >= recent_cutoff
    ).scalar() or 0
    
    recent_predictions_updated = db.query(func.count(SkillDemandPrediction.id)).filter(
        SkillDemandPrediction.last_updated >= recent_cutoff
    ).scalar() or 0
    
    # System health indicators
    system_health = {
        "personality_analysis": "active" if personality_profiles > 0 else "inactive",
        "matching_engine": "active" if compatibility_scores > 0 else "inactive",
        "skill_predictions": "active" if skill_predictions > 0 else "inactive",
        "overall_status": "healthy" if all([personality_profiles, compatibility_scores, skill_predictions]) else "needs_attention"
    }
    
    return {
        "system_status": system_health,
        "statistics": {
            "personality_profiles_analyzed": personality_profiles,
            "compatibility_scores_calculated": compatibility_scores,
            "work_patterns_tracked": work_patterns,
            "skill_predictions_active": skill_predictions
        },
        "recent_activity": {
            "profiles_analyzed_24h": recent_profiles,
            "predictions_updated_24h": recent_predictions_updated
        },
        "last_updated": datetime.utcnow().isoformat(),
        "recommendations": _generate_admin_recommendations(personality_profiles, compatibility_scores, skill_predictions)
    }


@router.post("/admin/ai/refresh-all")
async def refresh_all_ai_systems(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Trigger refresh of all AI systems (admin only)"""
    # Check if user is admin
    if getattr(current_user, 'role', '') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        service = AIMatchingService()
        
        # Refresh skill demand predictions
        updated_predictions = await service.update_skill_demand_predictions(db)
        
        # Get all users and refresh their personality profiles
        users = db.query(User).all()
        updated_profiles = []
        
        for user in users:
            try:
                profile = await service.analyze_user_personality(user.id, db)
                updated_profiles.append(profile)
            except Exception as e:
                print(f"Failed to analyze user {user.id}: {e}")
                continue
        
        return {
            "success": True,
            "updated_skill_predictions": len(updated_predictions),
            "updated_personality_profiles": len(updated_profiles),
            "total_operations": len(updated_predictions) + len(updated_profiles),
            "timestamp": datetime.utcnow().isoformat(),
            "message": "All AI systems refreshed successfully"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to refresh AI systems",
            "timestamp": datetime.utcnow().isoformat()
        }


@router.post("/admin/ai/analyze-user/{user_id}")
async def admin_analyze_user_personality(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Manually trigger personality analysis for a specific user (admin only)"""
    # Check if user is admin
    if getattr(current_user, 'role', '') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if target user exists
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        service = AIMatchingService()
        profile = await service.analyze_user_personality(user_id, db)
        
        return {
            "success": True,
            "user_id": user_id,
            "user_email": target_user.email,
            "personality_profile": {
                "openness": profile.openness,
                "conscientiousness": profile.conscientiousness,
                "extraversion": profile.extraversion,
                "agreeableness": profile.agreeableness,
                "neuroticism": profile.neuroticism,
                "analysis_confidence": profile.analysis_confidence,
                "data_points_analyzed": profile.data_points_analyzed,
                "last_analysis": profile.last_analysis.isoformat() if profile.last_analysis else None
            },
            "message": "Personality analysis completed successfully"
        }
        
    except Exception as e:
        return {
            "success": False,
            "user_id": user_id,
            "error": str(e),
            "message": "Failed to analyze user personality"
        }


@router.get("/admin/ai/logs")
async def get_ai_system_logs(
    hours: int = Query(24, description="Hours of logs to retrieve"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Get AI system operation logs (admin only)"""
    # Check if user is admin
    if getattr(current_user, 'role', '') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from datetime import datetime, timedelta
    from app.models.ai_matching import PersonalityProfile, CompatibilityScore, SkillDemandPrediction
    
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    
    # Get recent personality analyses
    recent_profiles = db.query(PersonalityProfile).filter(
        PersonalityProfile.last_analysis >= cutoff
    ).order_by(PersonalityProfile.last_analysis.desc()).limit(50).all()
    
    # Get recent compatibility calculations
    recent_matches = db.query(CompatibilityScore).filter(
        CompatibilityScore.calculation_timestamp >= cutoff
    ).order_by(CompatibilityScore.calculation_timestamp.desc()).limit(50).all()
    
    # Get recent skill prediction updates
    recent_predictions = db.query(SkillDemandPrediction).filter(
        SkillDemandPrediction.last_updated >= cutoff
    ).order_by(SkillDemandPrediction.last_updated.desc()).limit(50).all()
    
    return {
        "time_range_hours": hours,
        "activity_logs": {
            "personality_analyses": [
                {
                    "user_id": str(p.user_id),
                    "confidence": p.analysis_confidence,
                    "data_points": p.data_points_analyzed,
                    "timestamp": p.last_analysis.isoformat() if p.last_analysis else None
                } for p in recent_profiles
            ],
            "compatibility_calculations": [
                {
                    "freelancer_id": str(c.freelancer_id),
                    "project_id": str(c.project_id),
                    "compatibility_score": c.overall_compatibility,
                    "timestamp": c.calculation_timestamp.isoformat() if c.calculation_timestamp else None
                } for c in recent_matches
            ],
            "skill_prediction_updates": [
                {
                    "skill_name": s.skill_name,
                    "demand_score": s.current_demand_score,
                    "confidence": s.prediction_confidence,
                    "timestamp": s.last_updated.isoformat() if s.last_updated else None
                } for s in recent_predictions
            ]
        },
        "summary": {
            "total_personality_analyses": len(recent_profiles),
            "total_compatibility_calculations": len(recent_matches),
            "total_skill_updates": len(recent_predictions),
            "total_operations": len(recent_profiles) + len(recent_matches) + len(recent_predictions)
        },
        "generated_at": datetime.utcnow().isoformat()
    }


def _generate_admin_recommendations(profiles: int, scores: int, predictions: int) -> list:
    """Generate recommendations for admin based on system status"""
    recommendations = []
    
    if profiles == 0:
        recommendations.append({
            "type": "warning",
            "message": "No personality profiles analyzed yet. Consider running bulk analysis.",
            "action": "refresh-all"
        })
    
    if scores == 0:
        recommendations.append({
            "type": "warning",
            "message": "No compatibility scores calculated. This may indicate lack of projects or profiles.",
            "action": "analyze-projects"
        })
    
    if predictions == 0:
        recommendations.append({
            "type": "warning",
            "message": "No skill demand predictions available. Run skill analysis refresh.",
            "action": "refresh-skills"
        })
    
    if profiles > 0 and scores > 0 and predictions > 0:
        recommendations.append({
            "type": "success",
            "message": "AI systems are operational and processing data.",
            "action": "monitor"
        })
    
    return recommendations
