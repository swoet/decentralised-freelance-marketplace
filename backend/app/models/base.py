from sqlalchemy import Column, DateTime, func, MetaData, Integer
from sqlalchemy.ext.declarative import as_declarative, declared_attr

# SQLite doesn't support schemas, so we remove the schema specification
metadata = MetaData()

@as_declarative(metadata=metadata)
class Base:
    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    __name__: str

    # to generate table name from class name
    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower() + "s"