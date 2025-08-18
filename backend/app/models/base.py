from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from sqlalchemy.ext.declarative import as_declarative, declared_attr

@as_declarative()
class Base:
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    __name__: str

    # to generate table name from class name
    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower() + "s" 