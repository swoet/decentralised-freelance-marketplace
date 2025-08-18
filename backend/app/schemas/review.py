from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class ReviewBase(BaseModel):
    project_id: UUID
    reviewer_id: UUID
    rating: int
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    pass

class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    comment: Optional[str] = None

class Review(ReviewBase):
    id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ReviewResponse(Review):
    pass 