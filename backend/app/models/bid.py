from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import Float, Text, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.user import User


class Bid(Base):
    id: Mapped[UUID] = mapped_column(PGUUID, primary_key=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    proposal: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    project_id: Mapped[UUID] = mapped_column(PGUUID, ForeignKey("projects.id"), nullable=False)
    freelancer_id: Mapped[UUID] = mapped_column(PGUUID, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="bids")
    freelancer: Mapped["User"] = relationship("User", back_populates="bids")