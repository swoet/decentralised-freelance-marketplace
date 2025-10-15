from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL_FIXED,
    pool_pre_ping=True,
    connect_args={},
)

# SQLite doesn't support schemas like PostgreSQL
# Remove schema-specific configuration for SQLite compatibility
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 