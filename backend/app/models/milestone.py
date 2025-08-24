from sqlalchemy import Column, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
from datetime import datetime


class Milestone(Base):
    __tablename__ = "milestones"
    id = Column(UUID(as_uuid=True), primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    amount = Column(Numeric, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, nullable=False, default="pending")
    escrow_contract_id = Column(
        UUID(as_uuid=True), ForeignKey("escrow_contracts.id"), nullable=False
    )
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    created_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="milestones")
    escrow_contract = relationship("EscrowContract", back_populates="milestones")