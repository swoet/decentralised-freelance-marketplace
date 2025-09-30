from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class IntegrationRequestCreate(BaseModel):
    integration_name: str = Field(..., min_length=2, max_length=100, description="Name of the integration")
    description: Optional[str] = Field(None, max_length=500, description="Brief description of the integration")
    use_case: Optional[str] = Field(None, max_length=500, description="How you plan to use this integration")
    priority: str = Field(default="medium", pattern="^(low|medium|high)$")


class IntegrationRequestUpdate(BaseModel):
    description: Optional[str] = None
    use_case: Optional[str] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")


class IntegrationRequestResponse(BaseModel):
    id: UUID
    user_id: UUID
    integration_name: str
    description: Optional[str] = None
    use_case: Optional[str] = None
    priority: str
    status: str
    upvotes: int
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class IntegrationRequestUpvote(BaseModel):
    request_id: UUID
