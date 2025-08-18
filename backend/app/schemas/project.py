from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class ProjectBase(BaseModel):
    client_id: UUID
    org_id: Optional[UUID] = None
    title: str
    description: str
    budget_min: float
    budget_max: float
    status: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    status: Optional[str] = None

class Project(ProjectBase):
    id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProjectResponse(Project):
    pass 