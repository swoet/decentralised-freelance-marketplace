from sqlalchemy import Column, String, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from .base import Base
import enum

class ProjectStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELED = "canceled"

class Project(Base):
    __tablename__ = "projects"
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    budget_min = Column(Integer)
    budget_max = Column(Integer)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.OPEN)
    project_metadata = Column(JSONB)

    # Relationships
    client = relationship("User", back_populates="projects")
    organization = relationship("Organization", back_populates="projects")
    bids = relationship("Bid", back_populates="project")
    milestones = relationship("Milestone", back_populates="project")
    escrow_contract = relationship("EscrowContract", back_populates="project", uselist=False)
    smart_escrow = relationship("SmartEscrow", back_populates="project", uselist=False)
    smart_milestones = relationship("SmartMilestone", back_populates="project")
    reviews = relationship("Review", back_populates="project")
    embedding = relationship("ProjectEmbedding", back_populates="project", uselist=False)
