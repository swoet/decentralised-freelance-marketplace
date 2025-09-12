from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import secrets
import string

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
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
    ai_requests_today: int
    system_health: str

def check_admin_access(current_user: User):
    """Check if user has admin access"""
    if getattr(current_user, 'role', '') not in ['admin', 'super_admin']:
        raise HTTPException(status_code=403, detail="Admin access required")

def check_super_admin_access(current_user: User):
    """Check if user has super admin access"""
    if getattr(current_user, 'role', '') != 'super_admin':
        raise HTTPException(status_code=403, detail="Super Admin access required")

@router.get("/stats")
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> AdminStatsResponse:
    """Get admin dashboard statistics"""
    check_admin_access(current_user)
    
    from app.models.project import Project
    
    # Count stats
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    total_projects = db.query(Project).count()
    active_projects = db.query(Project).filter(Project.status == "active").count()
    
    # Mock revenue data for now (would come from payment records)
    total_revenue = 50000.0
    monthly_revenue = 8500.0
    
    # Mock AI requests data
    ai_requests_today = 45
    
    # Determine system health
    system_health = "good"
    if total_projects < 5:
        system_health = "warning"
    if total_users < 10:
        system_health = "critical"
    
    return AdminStatsResponse(
        total_users=total_users,
        active_users=active_users,
        total_projects=total_projects,
        active_projects=active_projects,
        total_revenue=total_revenue,
        monthly_revenue=monthly_revenue,
        ai_requests_today=ai_requests_today,
        system_health=system_health
    )

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
