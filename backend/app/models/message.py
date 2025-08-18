from sqlalchemy import Column, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
from datetime import datetime


class Message(Base):
    __tablename__ = "messages"
    id = Column(UUID(as_uuid=True), primary_key=True)
    content = Column(Text, nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at = Column(DateTime(timezone=True), nullable=True) 