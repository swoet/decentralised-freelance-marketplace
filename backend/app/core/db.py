from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL_FIXED,
    pool_pre_ping=True,
    connect_args={},
)

# Set default schema to marketplace for all sessions
from sqlalchemy import event


@event.listens_for(engine, "connect")
def set_search_path_on_connect(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("SET search_path TO marketplace, public")
    finally:
        cursor.close()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 