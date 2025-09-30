"""
Migration script to create integration_requests table
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

def create_integration_requests_table():
    engine = create_engine(settings.DATABASE_URL_FIXED)
    with engine.connect() as conn:
        # Create integration_requests table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS marketplace.integration_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES marketplace.users(id) ON DELETE CASCADE,
                integration_name VARCHAR(100) NOT NULL,
                description VARCHAR(500),
                use_case VARCHAR(500),
                priority VARCHAR(20) NOT NULL DEFAULT 'medium',
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                upvotes INTEGER NOT NULL DEFAULT 0,
                admin_notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            )
        """))
        
        # Create indexes
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_integration_requests_user_id 
            ON marketplace.integration_requests(user_id)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_integration_requests_status 
            ON marketplace.integration_requests(status)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_integration_requests_upvotes 
            ON marketplace.integration_requests(upvotes DESC)
        """))
        
        conn.commit()
        print('[OK] integration_requests table created successfully')
        
        # Verify the table
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'marketplace' 
            AND table_name = 'integration_requests'
        """))
        if result.fetchone():
            print('[OK] Verified: integration_requests table exists')

if __name__ == '__main__':
    create_integration_requests_table()
