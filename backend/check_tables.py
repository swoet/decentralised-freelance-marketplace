"""Check created tables in the marketplace schema."""
from sqlalchemy import create_engine, text
from app.core.config import settings

def main():
    """List all tables in the marketplace schema."""
    engine = create_engine(settings.DATABASE_URL_FIXED)
    
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'marketplace' 
            ORDER BY table_name
        """))
        
        print("\nTables in marketplace schema:")
        print("-" * 30)
        for row in result:
            print(row[0])

if __name__ == "__main__":
    main()
