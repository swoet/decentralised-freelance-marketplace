from __future__ import annotations
from sqlalchemy import Column, String, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from .base import Base

class TokenTransaction(Base):
    __tablename__ = "token_transactions"

    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    chain_id = Column(Integer, nullable=False, index=True)
    tx_hash = Column(String, nullable=False, unique=True, index=True)
    tx_type = Column(String, nullable=False)  # escrow_deploy, milestone_release, transfer, approve, reward
    amount = Column(Numeric, nullable=True)
    token_address = Column(String, nullable=True)
    status = Column(String, nullable=False, default="pending")  # pending, confirmed, failed
    transaction_metadata = Column(JSONB, nullable=True)
