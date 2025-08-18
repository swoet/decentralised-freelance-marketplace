#!/usr/bin/env python3
"""
Database connection test script
"""
import os
import sys

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.config import settings
from sqlalchemy import create_engine, text
import urllib.parse

def test_db_connection():
    """Test database connection"""
    try:
        print(f"Original URL: {settings.DATABASE_URL}")
        
        # Debug URL parsing
        url = settings.DATABASE_URL
        if '@' in url and url.count('@') > 1:
            print(f"URL has {url.count('@')} @ symbols")
            parts = url.replace('postgresql://', '').split('@')
            print(f"Parts after splitting: {parts}")
            if len(parts) >= 2:
                credentials = parts[0]
                host_part = '@'.join(parts[1:])
                print(f"Credentials: {credentials}")
                print(f"Host part: {host_part}")
                
                if ':' in credentials:
                    username, password = credentials.split(':', 1)
                    encoded_password = urllib.parse.quote_plus(password)
                    fixed_url = f"postgresql://{username}:{encoded_password}@{host_part}"
                    print(f"Fixed URL: {fixed_url}")
        
        print(f"Fixed URL: {settings.DATABASE_URL_FIXED}")
        engine = create_engine(settings.DATABASE_URL_FIXED, pool_pre_ping=True)
        
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("Database connection successful!")
            
            # Check if tables exist
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))
            tables = [row[0] for row in result]
            print(f"Existing tables: {tables}")
            
    except Exception as e:
        print(f"Database connection failed: {e}")

if __name__ == "__main__":
    test_db_connection()
