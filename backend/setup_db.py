from sqlalchemy import create_engine, text
from app.core.config import settings

def setup_database():
    # Create engine
    engine = create_engine(settings.DATABASE_URL_FIXED)
    
    with engine.begin() as connection:
        try:
            # Create marketplace schema
            connection.execute(text("""
                DO $$ 
                BEGIN
                    -- Create schema if it doesn't exist
                    CREATE SCHEMA IF NOT EXISTS marketplace;
                    
                    -- Grant all privileges on schema
                    GRANT ALL ON SCHEMA marketplace TO CURRENT_USER;
                    
                    -- Set search path to marketplace schema
                    SET search_path TO marketplace;
                    
                    -- Create alembic_version table if it doesn't exist
                    CREATE TABLE IF NOT EXISTS marketplace.alembic_version (
                        version_num VARCHAR(32) NOT NULL,
                        CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
                    );
                    
                    -- Grant permissions on current and future tables
                    GRANT ALL ON ALL TABLES IN SCHEMA marketplace TO CURRENT_USER;
                    ALTER DEFAULT PRIVILEGES IN SCHEMA marketplace GRANT ALL ON TABLES TO CURRENT_USER;
                END;
                $$;
            """))
            
            # Verify the schema is set correctly
            result = connection.execute(text("SHOW search_path")).scalar()
            print(f"Current search path: {result}")
            
            print("Database schema and alembic_version table created successfully!")
        except Exception as e:
            print(f"Error occurred: {e}")
            raise

if __name__ == "__main__":
    setup_database()
