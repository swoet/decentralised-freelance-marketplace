from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr

# This assumes your UserRole enum is in app.models.user
from app.models.user import UserRole


# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    is_active: bool = True
    is_verified: bool = False
    two_fa_enabled: bool = False
    wallet_address: Optional[str] = None


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str


# Properties to receive via API on update
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    two_fa_enabled: Optional[bool] = None
    wallet_address: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# Additional properties stored in DB
class UserInDB(UserResponse):
    hashed_password: str 