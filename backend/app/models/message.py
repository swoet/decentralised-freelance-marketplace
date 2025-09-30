from sqlalchemy import Column, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
from datetime import datetime
import uuid


class Message(Base):
    __tablename__ = "messages"
    # Remove id column since it's inherited from Base
    content = Column(Text, nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("marketplace.projects.id"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("marketplace.users.id"), nullable=False)
    # recipient_id = Column(UUID(as_uuid=True), ForeignKey("marketplace.users.id"), nullable=True)
    is_read = Column(Boolean, nullable=False, default=False)
