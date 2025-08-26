from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
from datetime import datetime


class EscrowContract(Base):
    __tablename__ = "escrow_contracts"
    id = Column(UUID(as_uuid=True), primary_key=True)
    contract_address = Column(String, nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    freelancer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    total_amount = Column(Numeric, nullable=False)
    status = Column(String, nullable=False, default="created")
    payment_mode = Column(String, nullable=True)  # 'native' or 'token'
    chain_id = Column(Integer, nullable=True)
    token_address = Column(String, nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="escrow_contract")
    client = relationship("User", foreign_keys=[client_id])
    freelancer = relationship("User", foreign_keys=[freelancer_id])
    milestones = relationship("Milestone", back_populates="escrow_contract")