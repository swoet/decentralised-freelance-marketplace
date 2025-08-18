from sqlalchemy import Column, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base import Base

class Review(Base):
    __tablename__ = 'reviews'
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False) # 1-5
    comment = Column(Text)
    
    project = relationship("Project", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews_given")
 