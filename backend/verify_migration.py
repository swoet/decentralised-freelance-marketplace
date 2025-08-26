#!/usr/bin/env python3
"""
Simple script to verify migration status
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from app.core.db import engine
from sqlalchemy import text

def verify_migration():
    try:
        with engine.connect() as conn:
            # Check current migration version
            result = conn.execute(text('SELECT version_num FROM marketplace.alembic_version'))
            version = result.fetchone()
            print(f"Current migration version: {version[0] if version else 'None'}")
            
            # List all tables in marketplace schema
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'marketplace' 
                ORDER BY table_name
            """))
            tables = result.fetchall()
            
            print(f"\nTables in marketplace schema ({len(tables)}):")
            for table in tables:
                print(f"  - {table[0]}")
            
            # Check if key tables exist
            expected_tables = [
                'users', 'projects', 'bids', 'escrow_contracts', 
                'integrations', 'api_keys', 'token_transactions',
                'sessions', 'backup_codes', 'consent_logs'
            ]
            
            existing_tables = [t[0] for t in tables]
            missing_tables = [t for t in expected_tables if t not in existing_tables]
            
            if missing_tables:
                print(f"\nMissing expected tables: {missing_tables}")
                return False
            else:
                print(f"\n✓ All expected tables are present")
                return True
                
    except Exception as e:
        print(f"Error checking migration status: {e}")
        return False

if __name__ == "__main__":
    success = verify_migration()
    sys.exit(0 if success else 1)
