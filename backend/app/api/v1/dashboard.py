from fastapi import APIRouter, Depends, Response, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

from app.api.deps import get_db, get_current_user_optional
from app.models.user import User
from app.models.project import Project
from app.models.community import CommunityThread, Event
from app.models.integration import Integration

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
