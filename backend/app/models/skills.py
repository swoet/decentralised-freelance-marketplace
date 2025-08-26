from __future__ import annotations
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, Enum, Float, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from .base import Base


class VerificationMethod(str, enum.Enum):
    EVIDENCE = "evidence"
    QUIZ = "quiz"
    OAUTH = "oauth"


class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    VERIFIED = "verified"
    REJECTED = "rejected"


class UserSkillStatus(str, enum.Enum):
    UNVERIFIED = "unverified"
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class Skill(Base):
    __tablename__ = "skills"

    name = Column(String, nullable=False, unique=True)
    category = Column(String, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    user_skills = relationship("UserSkill", back_populates="skill")
    verifications = relationship("SkillVerification", back_populates="skill")


class UserSkill(Base):
    __tablename__ = "user_skills"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.id"), nullable=False, index=True)
    level = Column(Integer, nullable=True)  # 1-5
    years = Column(Float, nullable=True)
    verified_status = Column(Enum(UserSkillStatus), nullable=False, default=UserSkillStatus.UNVERIFIED)
    evidence_url = Column(String, nullable=True)

    user = relationship("User")
    skill = relationship("Skill", back_populates="user_skills")

    __table_args__ = (
        Index("uq_user_skill_unique", "user_id", "skill_id", unique=True),
    )


class SkillVerification(Base):
    __tablename__ = "skill_verifications"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.id"), nullable=False, index=True)
    method = Column(Enum(VerificationMethod), nullable=False, default=VerificationMethod.EVIDENCE)
    status = Column(Enum(VerificationStatus), nullable=False, default=VerificationStatus.PENDING)
    score = Column(Integer, nullable=True)
    verification_metadata = Column(JSONB, nullable=True)

    user = relationship("User")
    skill = relationship("Skill", back_populates="verifications")


class ReputationScore(Base):
    __tablename__ = "reputation_scores"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    score = Column(Float, nullable=False, default=0.0)
    breakdown_json = Column(JSONB, nullable=True)

    user = relationship("User")


class ReputationEvent(Base):
    __tablename__ = "reputation_events"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String, nullable=False)
    weight = Column(Float, nullable=False, default=0.0)
    payload_json = Column(JSONB, nullable=True)

    user = relationship("User")
