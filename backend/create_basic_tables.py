#!/usr/bin/env python3
"""Create basic tables needed for the application to run"""

import os
from sqlalchemy import create_engine, text
from app.core.config import settings

def create_basic_tables():
    """Create the essential tables needed for the application"""
    
    # Get database URL from environment or use default
    database_url = os.getenv('DATABASE_URL', 'postgresql://shawn:Shawn%402202@localhost:5432/freelance_marketplace')
    
    engine = create_engine(database_url)
    
    with engine.connect() as conn:
        # Create basic tables that are needed for the app to start
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR UNIQUE NOT NULL,
                hashed_password VARCHAR NOT NULL,
                full_name VARCHAR,
                role VARCHAR DEFAULT 'CLIENT',
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """))
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS projects (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                client_id UUID REFERENCES users(id),
                title VARCHAR NOT NULL,
                description TEXT NOT NULL,
                budget_min INTEGER,
                budget_max INTEGER,
                status VARCHAR DEFAULT 'open',
                project_metadata JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """))
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS bids (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                project_id UUID REFERENCES projects(id),
                freelancer_id UUID REFERENCES users(id),
                amount INTEGER NOT NULL,
                proposal TEXT NOT NULL,
                status VARCHAR DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """))
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS alembic_version (
                version_num VARCHAR(32) NOT NULL,
                CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
            );
        """))
        
        # Insert the current migration version
        conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('01e6735adbf8') ON CONFLICT DO NOTHING;"))
        
        conn.commit()
        print("✅ Basic tables created successfully!")

if __name__ == "__main__":
    create_basic_tables()
