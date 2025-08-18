from sqlalchemy import Column, Numeric, Text, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
from datetime import datetime


class Bid(Base):
    __tablename__ = "bids"
    id = Column(UUID(as_uuid=True), primary_key=True)
    amount = Column(Numeric, nullable=False)
    proposal = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="pending")
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    freelancer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at = Column(DateTime(timezone=True), nullable=True) 