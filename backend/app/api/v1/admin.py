from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import secrets
import string

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.project import Project
from app.models.activity import ActivityLog, SystemMetrics, RevenueRecord, AIRequestLog, DisputeCase
from app.schemas.user import UserCreate
from app.services.user import user
from app.core.auth import get_password_hash

router = APIRouter(prefix="/admin", tags=["admin"])

class AdminUserResponse(BaseModel):
    id: str
    email: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]
    profile: Optional[Dict[str, Any]]

class CreateAdminRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str = "admin"

class UpdateAdminStatusRequest(BaseModel):
    is_active: bool

class ChangeRoleRequest(BaseModel):
    role: str

class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_projects: int
    active_projects: int
    total_revenue: float
    monthly_revenue: float
    pending_disputes: int
    ai_requests_today: int
    blockchain_transactions: int
    system_health: str

class ActivityResponse(BaseModel):
    id: str
    type: str
    description: str
    timestamp: datetime
    user: Optional[str] = None

class DashboardActivityResponse(BaseModel):
    activities: List[ActivityResponse]

def check_admin_access(current_user: User):
    """Check if user has admin access"""
    if getattr(current_user, 'role', '') not in ['admin', 'super_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")

def check_super_admin_access(current_user: User):
    """Check if user has super admin access"""
    if getattr(current_user, 'role', '') != 'super_admin':
        raise HTTPException(status_code=403, detail="Super Admin access required")

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> AdminStatsResponse:
    """Get admin dashboard statistics"""
    check_admin_access(current_user)
    
    # Count users
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Count projects
    total_projects = db.query(Project).count()
    active_projects = db.query(Project).filter(Project.status == "active").count()
    
    # Calculate revenue
    total_revenue_result = db.query(func.sum(RevenueRecord.amount)).scalar()
    total_revenue = float(total_revenue_result) if total_revenue_result else 0.0
    
    # Monthly revenue (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    monthly_revenue_result = db.query(func.sum(RevenueRecord.amount)).filter(
        RevenueRecord.created_at >= thirty_days_ago
    ).scalar()
    monthly_revenue = float(monthly_revenue_result) if monthly_revenue_result else 0.0
    
    # Count disputes
    pending_disputes = db.query(DisputeCase).filter(
        DisputeCase.status.in_(["pending", "investigating"])
    ).count()
    
    # AI requests today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    ai_requests_today = db.query(AIRequestLog).filter(
        AIRequestLog.created_at >= today_start
    ).count()
    
    # Blockchain transactions from system metrics
    blockchain_metric = db.query(SystemMetrics).filter(
        SystemMetrics.metric_name == "blockchain_transactions"
    ).order_by(SystemMetrics.recorded_at.desc()).first()
    blockchain_transactions = int(blockchain_metric.metric_value) if blockchain_metric else 0
    
    # Determine system health
    system_health = "good"
    if pending_disputes > 5 or active_users < total_users * 0.3:
        system_health = "warning"
    if pending_disputes > 20 or active_users < 10:
        system_health = "critical"
    
    return AdminStatsResponse(
        total_users=total_users,
        active_users=active_users,
        total_projects=total_projects,
        active_projects=active_projects,
        total_revenue=total_revenue,
        monthly_revenue=monthly_revenue,
        pending_disputes=pending_disputes,
        ai_requests_today=ai_requests_today,
        blockchain_transactions=blockchain_transactions,
        system_health=system_health
    )

@router.get("/dashboard/activity")
async def get_dashboard_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> DashboardActivityResponse:
    """Get recent platform activity for admin dashboard"""
    check_admin_access(current_user)
    
    # Get recent activities (last 50)
    activities = db.query(ActivityLog).order_by(
        ActivityLog.timestamp.desc()
    ).limit(50).all()
    
    activity_list = []
    for activity in activities:
        user_email = None
        if activity.user_id:
            user_obj = db.query(User).filter(User.id == activity.user_id).first()
            if user_obj:
                user_email = user_obj.email
        
        activity_list.append(ActivityResponse(
            id=activity.id,
            type=activity.activity_type,
            description=activity.description,
            timestamp=activity.timestamp,
            user=user_email
        ))
    
    return DashboardActivityResponse(activities=activity_list)

@router.get("/users/admins")
async def get_admin_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, List[AdminUserResponse]]:
    """Get list of admin users"""
    check_super_admin_access(current_user)
    
    admin_users = db.query(User).filter(
        User.role.in_(["admin", "super_admin"])
    ).all()
    
    admin_list = []
    for admin_user in admin_users:
        admin_list.append(AdminUserResponse(
            id=str(admin_user.id),
            email=admin_user.email or "",
            role=admin_user.role or "admin",
            is_active=admin_user.is_active,
            is_verified=admin_user.is_verified,
            created_at=admin_user.created_at,
            last_login=getattr(admin_user, 'last_login', None),
            profile={
                "first_name": getattr(admin_user, 'full_name', '').split(' ')[0] if getattr(admin_user, 'full_name', '') else "",
                "last_name": ' '.join(getattr(admin_user, 'full_name', '').split(' ')[1:]) if getattr(admin_user, 'full_name', '') and len(getattr(admin_user, 'full_name', '').split(' ')) > 1 else ""
            }
        ))
    
    return {"admins": admin_list}

@router.post("/users/create-admin")
async def create_admin_user(
    admin_data: CreateAdminRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new admin user"""
    check_super_admin_access(current_user)
    
    # Check if user already exists
    existing_user = user.get_by_email(db, email=admin_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user data
    full_name = f"{admin_data.first_name} {admin_data.last_name}"
    user_create = UserCreate(
        email=admin_data.email,
        password=admin_data.password,
        full_name=full_name,
        role=admin_data.role,
        wallet_address=None  # Admin users don't need wallet addresses
    )
    
    # Create the user
    new_admin = user.create(db, obj_in=user_create)
    
    return {"message": "Admin user created successfully", "admin_id": str(new_admin.id)}

@router.put("/users/{admin_id}/toggle-status")
async def toggle_admin_status(
    admin_id: str,
    status_data: UpdateAdminStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Toggle admin user active status"""
    check_super_admin_access(current_user)
    
    admin_user = db.query(User).filter(User.id == admin_id).first()
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    admin_user.is_active = status_data.is_active
    db.commit()
    
    return {"message": f"Admin user {'activated' if status_data.is_active else 'deactivated'} successfully"}

@router.put("/users/{admin_id}/change-role")
async def change_admin_role(
    admin_id: str,
    role_data: ChangeRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Change admin user role"""
    check_super_admin_access(current_user)
    
    if role_data.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    admin_user = db.query(User).filter(User.id == admin_id).first()
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    admin_user.role = role_data.role
    db.commit()
    
    return {"message": f"Admin role changed to {role_data.role} successfully"}

@router.delete("/users/{admin_id}")
async def delete_admin_user(
    admin_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete admin user"""
    check_super_admin_access(current_user)
    
    # Prevent self-deletion
    if str(current_user.id) == admin_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    
    admin_user = db.query(User).filter(User.id == admin_id).first()
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    db.delete(admin_user)
    db.commit()
    
    return {"message": "Admin user deleted successfully"}

@router.post("/users/{admin_id}/reset-password")
async def reset_admin_password(
    admin_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Reset admin user password"""
    check_super_admin_access(current_user)
    
    admin_user = db.query(User).filter(User.id == admin_id).first()
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    # Generate a new random password
    new_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
    admin_user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    return {"message": "Password reset successfully", "new_password": new_password}

# ========== User Management Endpoints ==========

class UserListResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    project_count: int
    total_spent: float

class UserDetailResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    is_verified: bool
    wallet_address: Optional[str]
    bio: Optional[str]
    skills: Optional[List[str]]
    created_at: datetime
    last_login: Optional[datetime]
    total_projects: int
    active_projects: int
    completed_projects: int
    total_spent: float
    total_earned: float

@router.get("/users")
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all platform users with filters"""
    check_admin_access(current_user)
    
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        query = query.filter(
            or_(
                User.email.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%")
            )
        )
    
    total = query.count()
    users = query.offset(skip).limit(limit).all()
    
    user_list = []
    for u in users:
        # Count projects
        project_count = db.query(Project).filter(Project.client_id == u.id).count()
        
        # Calculate spending (mock for now)
        total_spent = 0.0
        revenue_records = db.query(RevenueRecord).filter(RevenueRecord.client_id == u.id).all()
        for record in revenue_records:
            total_spent += record.amount
        
        user_list.append(UserListResponse(
            id=str(u.id),
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            is_verified=u.is_verified,
            created_at=u.created_at,
            project_count=project_count,
            total_spent=total_spent
        ))
    
    return {
        "users": user_list,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> UserDetailResponse:
    """Get detailed user information"""
    check_admin_access(current_user)
    
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Project statistics
    total_projects = db.query(Project).filter(Project.client_id == user_id).count()
    active_projects = db.query(Project).filter(
        and_(Project.client_id == user_id, Project.status == "active")
    ).count()
    completed_projects = db.query(Project).filter(
        and_(Project.client_id == user_id, Project.status == "completed")
    ).count()
    
    # Financial statistics
    spent_result = db.query(func.sum(RevenueRecord.amount)).filter(
        RevenueRecord.client_id == user_id
    ).scalar()
    total_spent = float(spent_result) if spent_result else 0.0
    
    earned_result = db.query(func.sum(RevenueRecord.amount)).filter(
        RevenueRecord.freelancer_id == user_id
    ).scalar()
    total_earned = float(earned_result) if earned_result else 0.0
    
    return UserDetailResponse(
        id=str(u.id),
        email=u.email,
        full_name=u.full_name,
        role=u.role,
        is_active=u.is_active,
        is_verified=u.is_verified,
        wallet_address=u.wallet_address,
        bio=u.bio,
        skills=u.skills if u.skills else [],
        created_at=u.created_at,
        last_login=None,  # Add last_login tracking to User model
        total_projects=total_projects,
        active_projects=active_projects,
        completed_projects=completed_projects,
        total_spent=total_spent,
        total_earned=total_earned
    )

@router.put("/users/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Suspend a user account"""
    check_admin_access(current_user)
    
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent suspending admin users
    if u.role in ['admin', 'super_admin']:
        raise HTTPException(status_code=403, detail="Cannot suspend admin users")
    
    u.is_active = False
    db.commit()
    
    # Log activity
    activity = ActivityLog(
        user_id=user_id,
        activity_type="user_suspended",
        description=f"User {u.email} was suspended by admin {current_user.email}",
        extra_data={"admin_id": str(current_user.id)}
    )
    db.add(activity)
    db.commit()
    
    return {"message": "User suspended successfully"}

@router.put("/users/{user_id}/activate")
async def activate_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Activate a suspended user account"""
    check_admin_access(current_user)
    
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    
    u.is_active = True
    db.commit()
    
    # Log activity
    activity = ActivityLog(
        user_id=user_id,
        activity_type="user_activated",
        description=f"User {u.email} was activated by admin {current_user.email}",
        extra_data={"admin_id": str(current_user.id)}
    )
    db.add(activity)
    db.commit()
    
    return {"message": "User activated successfully"}

# ========== Dispute Management Endpoints ==========

class DisputeResponse(BaseModel):
    id: str
    project_id: str
    plaintiff_email: str
    defendant_email: str
    status: str
    priority: str
    category: str
    title: str
    description: str
    created_at: datetime
    resolved_at: Optional[datetime]

class CreateDisputeRequest(BaseModel):
    project_id: str
    raised_by: str
    against_user: str
    category: str
    title: str
    description: str
    priority: str = "medium"

class ResolveDisputeRequest(BaseModel):
    resolution: str
    
@router.get("/disputes")
async def get_disputes(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all disputes with filters"""
    check_admin_access(current_user)
    
    query = db.query(DisputeCase)
    
    if status:
        query = query.filter(DisputeCase.status == status)
    if priority:
        query = query.filter(DisputeCase.priority == priority)
    
    total = query.count()
    disputes = query.order_by(DisputeCase.created_at.desc()).offset(skip).limit(limit).all()
    
    dispute_list = []
    for d in disputes:
        plaintiff = db.query(User).filter(User.id == d.raised_by).first()
        defendant = db.query(User).filter(User.id == d.against_user).first()
        
        dispute_list.append(DisputeResponse(
            id=d.id,
            project_id=d.project_id,
            plaintiff_email=plaintiff.email if plaintiff else "Unknown",
            defendant_email=defendant.email if defendant else "Unknown",
            status=d.status,
            priority=d.priority,
            category=d.category,
            title=d.title,
            description=d.description,
            created_at=d.created_at,
            resolved_at=d.resolved_at
        ))
    
    return {
        "disputes": dispute_list,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/disputes/{dispute_id}")
async def get_dispute_detail(
    dispute_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get detailed dispute information"""
    check_admin_access(current_user)
    
    d = db.query(DisputeCase).filter(DisputeCase.id == dispute_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dispute not found")
    
    plaintiff = db.query(User).filter(User.id == d.raised_by).first()
    defendant = db.query(User).filter(User.id == d.against_user).first()
    project = db.query(Project).filter(Project.id == d.project_id).first()
    
    return {
        "id": d.id,
        "project": {
            "id": project.id if project else None,
            "title": project.title if project else "Unknown",
            "budget": project.budget if project else 0
        },
        "plaintiff": {
            "id": plaintiff.id if plaintiff else None,
            "email": plaintiff.email if plaintiff else "Unknown",
            "full_name": plaintiff.full_name if plaintiff else "Unknown"
        },
        "defendant": {
            "id": defendant.id if defendant else None,
            "email": defendant.email if defendant else "Unknown",
            "full_name": defendant.full_name if defendant else "Unknown"
        },
        "status": d.status,
        "priority": d.priority,
        "category": d.category,
        "title": d.title,
        "description": d.description,
        "evidence": d.evidence,
        "resolution": d.resolution,
        "created_at": d.created_at,
        "updated_at": d.updated_at,
        "resolved_at": d.resolved_at
    }

@router.put("/disputes/{dispute_id}/resolve")
async def resolve_dispute(
    dispute_id: str,
    resolve_data: ResolveDisputeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Resolve a dispute"""
    check_admin_access(current_user)
    
    d = db.query(DisputeCase).filter(DisputeCase.id == dispute_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dispute not found")
    
    d.status = "resolved"
    d.resolution = resolve_data.resolution
    d.resolved_by = str(current_user.id)
    d.resolved_at = datetime.utcnow()
    db.commit()
    
    # Log activity
    activity = ActivityLog(
        user_id=d.raised_by,
        activity_type="dispute_resolved",
        description=f"Dispute '{d.title}' resolved by admin {current_user.email}",
        extra_data={
            "dispute_id": dispute_id,
            "admin_id": str(current_user.id),
            "resolution": resolve_data.resolution
        }
    )
    db.add(activity)
    db.commit()
    
    return {"message": "Dispute resolved successfully"}

# ========== Analytics Endpoints ==========

@router.get("/analytics/revenue")
async def get_revenue_analytics(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get revenue analytics"""
    check_admin_access(current_user)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Daily revenue breakdown
    revenue_records = db.query(RevenueRecord).filter(
        RevenueRecord.created_at >= start_date
    ).all()
    
    daily_revenue = {}
    by_type = {}
    
    for record in revenue_records:
        day = record.created_at.strftime("%Y-%m-%d")
        if day not in daily_revenue:
            daily_revenue[day] = 0.0
        daily_revenue[day] += record.amount
        
        if record.transaction_type not in by_type:
            by_type[record.transaction_type] = 0.0
        by_type[record.transaction_type] += record.amount
    
    total = sum(daily_revenue.values())
    
    return {
        "total_revenue": total,
        "daily_breakdown": daily_revenue,
        "by_transaction_type": by_type,
        "period_days": days
    }

@router.get("/analytics/users")
async def get_user_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user growth analytics"""
    check_admin_access(current_user)
    
    # User counts by role
    role_counts = {}
    for role in ['client', 'freelancer', 'admin', 'super_admin']:
        count = db.query(User).filter(User.role == role).count()
        role_counts[role] = count
    
    # New users last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_users_30d = db.query(User).filter(User.created_at >= thirty_days_ago).count()
    
    # Active vs inactive
    active_count = db.query(User).filter(User.is_active == True).count()
    inactive_count = db.query(User).filter(User.is_active == False).count()
    
    return {
        "total_users": sum(role_counts.values()),
        "by_role": role_counts,
        "new_users_30d": new_users_30d,
        "active_users": active_count,
        "inactive_users": inactive_count
    }

@router.get("/analytics/projects")
async def get_project_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get project analytics"""
    check_admin_access(current_user)
    
    # Project counts by status
    status_counts = {}
    for status in ['active', 'completed', 'cancelled', 'pending']:
        count = db.query(Project).filter(Project.status == status).count()
        status_counts[status] = count
    
    # New projects last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_projects_30d = db.query(Project).filter(Project.created_at >= thirty_days_ago).count()
    
    # Average budget
    avg_budget = db.query(func.avg(Project.budget)).scalar()
    
    return {
        "total_projects": sum(status_counts.values()),
        "by_status": status_counts,
        "new_projects_30d": new_projects_30d,
        "average_budget": float(avg_budget) if avg_budget else 0.0
    }
