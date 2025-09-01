from __future__ import annotations
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime, timezone

from .base import Base


class CommunityThread(Base):
    __tablename__ = "community_threads"

    title = Column(String, nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    tags = Column(JSONB, nullable=True)  # list of strings

    author = relationship("User")
    posts = relationship("CommunityPost", back_populates="thread", cascade="all, delete-orphan")


class CommunityPost(Base):
    __tablename__ = "community_posts"

    thread_id = Column(UUID(as_uuid=True), ForeignKey("community_threads.id"), nullable=False, index=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    body = Column(Text, nullable=False)

    thread = relationship("CommunityThread", back_populates="posts")
    author = relationship("User")


class Event(Base):
    __tablename__ = "events"

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    starts_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    ends_at = Column(DateTime(timezone=True), nullable=True)
    link = Column(String, nullable=True)
    
    # Location fields
    location_name = Column(String, nullable=True)
    location_address = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Event metadata
    external_id = Column(String, nullable=True, unique=True)  # ID from external source
    external_url = Column(String, nullable=True)
    source = Column(String, nullable=True)  # eventbrite, meetup, etc.
    category = Column(String, nullable=True)  # tech, business, conference, etc.
    is_online = Column(Boolean, default=False)
    is_free = Column(Boolean, default=True)
    
    # User interaction
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    author = relationship("User")
