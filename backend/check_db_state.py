from sqlalchemy import create_engine, text
from app.core.config import settings

def check_database_state():
    engine = create_engine(settings.DATABASE_URL_FIXED)
    
    with engine.begin() as conn:
        # Check existing tables
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'marketplace'
            ORDER BY table_name
        """))
        tables = [row[0] for row in result]
        print(f"Existing tables: {len(tables)}")
        for table in tables:
            print(f"  - {table}")
        
        # Check if alembic_version table exists
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'marketplace' AND table_name = 'alembic_version'
        """))
        version_table_exists = result.fetchone() is not None
        print(f"Alembic version table exists: {version_table_exists}")
        
        if version_table_exists:
            result = conn.execute(text("SELECT version_num FROM marketplace.alembic_version"))
            versions = [row[0] for row in result]
            print(f"Current alembic versions: {versions}")

if __name__ == "__main__":
    check_database_state()
