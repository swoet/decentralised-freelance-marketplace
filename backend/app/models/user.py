from sqlalchemy import Column, String, Boolean, DateTime, Float, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from .base import Base
import enum
from datetime import datetime, timezone

class UserRole(str, enum.Enum):
    CLIENT = "client"
    FREELANCER = "freelancer"
    ADMIN = "admin"

class User(Base):
    email = Column(String, nullable=False, unique=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    two_fa_enabled = Column(Boolean, nullable=False, default=False)
    two_fa_secret = Column(String, nullable=True)
    wallet_address = Column(String, nullable=True)
    bio = Column(Text, nullable=True)  # User bio/description
    skills = Column(ARRAY(String), nullable=True)  # User skills list
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Location fields for event recommendations
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)
    timezone_name = Column(String, nullable=True)
    
    # Relationships
    organization = relationship("Organization", back_populates="owner", uselist=False)
    projects = relationship("Project", back_populates="client")
    bids = relationship("Bid", back_populates="freelancer")
    reviews_given = relationship("Review", back_populates="reviewer")
    portfolio = relationship("Portfolio", back_populates="user")
    sessions = relationship("Session", back_populates="user")
    freelancer_profile = relationship("FreelancerProfile", back_populates="user", uselist=False)
    reputation_score = relationship("ReputationScoreV2", back_populates="user", uselist=False)
    devices = relationship("Device", back_populates="user")
    oauth_tokens = relationship("OAuthToken", back_populates="user")
    
    # AI Matching relationships
    personality_profile = relationship("PersonalityProfile", back_populates="user", uselist=False)
    work_pattern = relationship("WorkPattern", back_populates="user", uselist=False)
    
    # Blockchain reputation relationships
    blockchain_reputation = relationship("BlockchainReputation", back_populates="user", uselist=False)
