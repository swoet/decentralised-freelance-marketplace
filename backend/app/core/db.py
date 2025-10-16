from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

database_url = settings.DATABASE_URL_FIXED
connect_args = {}
if database_url.startswith("sqlite"):
    # Needed for SQLite with FastAPI
    connect_args = {"check_same_thread": False}

engine = create_engine(
    database_url,
    pool_pre_ping=True,
    connect_args=connect_args,
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