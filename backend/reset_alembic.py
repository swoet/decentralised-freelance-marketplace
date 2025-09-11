from sqlalchemy import create_engine, text
from app.core.config import settings

def reset_alembic():
    engine = create_engine(settings.DATABASE_URL_FIXED)
    
    with engine.begin() as conn:
        # Clear the alembic version table
        conn.execute(text("DELETE FROM marketplace.alembic_version"))
        print("✅ Cleared alembic version table")
        
        # We could also drop it, but clearing is safer
        # conn.execute(text("DROP TABLE IF EXISTS marketplace.alembic_version"))
        
if __name__ == "__main__":
    reset_alembic()
