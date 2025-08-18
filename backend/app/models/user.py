from sqlalchemy import Column, String, Enum, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base
import enum
from datetime import datetime

class UserRole(str, enum.Enum):
    CLIENT = "client"
    FREELANCER = "freelancer"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True)
    email = Column(String, nullable=False, unique=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    two_fa_enabled = Column(Boolean, nullable=False, default=False)
    two_fa_secret = Column(String, nullable=True)
    wallet_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    organization = relationship("Organization", back_populates="owner", uselist=False)
    projects = relationship("Project", back_populates="client")
    bids = relationship("Bid", back_populates="freelancer")
    reviews_given = relationship("Review", back_populates="reviewer")
    portfolio = relationship("Portfolio", back_populates="user") 