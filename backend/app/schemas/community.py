from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from uuid import UUID

class ThreadCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    tags: Optional[List[str]] = None

class ThreadResponse(BaseModel):
    id: UUID
    title: str
    tags: Optional[List[str]] = None
    created_at: datetime
    author_id: UUID

    class Config:
        from_attributes = True

class PostCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=5000)

class PostResponse(BaseModel):
    id: UUID
    body: str
    created_at: datetime
    author_id: UUID
    thread_id: UUID

    class Config:
        from_attributes = True

class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    starts_at: datetime
    ends_at: Optional[datetime] = None
    link: Optional[str] = None
    location_name: Optional[str] = None
    location_address: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    is_online: bool = False
    is_free: bool = True
    category: Optional[str] = None

class EventResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    starts_at: datetime
    ends_at: Optional[datetime] = None
    link: Optional[str] = None
    location_name: Optional[str] = None
    location_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_online: bool
    is_free: bool
    category: Optional[str] = None
    source: Optional[str] = None
    external_url: Optional[str] = None
    created_at: datetime
    author_id: Optional[UUID] = None

    class Config:
        from_attributes = True

class LocationUpdate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    city: Optional[str] = None
    country: Optional[str] = None
    timezone_name: Optional[str] = None
