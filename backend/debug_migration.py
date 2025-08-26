#!/usr/bin/env python3
"""
Debug script to check migration status and database connection
"""
import sys
import traceback
from sqlalchemy import create_engine, text
from alembic.config import Config
from alembic import command

def check_database_connection():
    """Check if database connection works"""
    try:
        engine = create_engine('postgresql://postgres:password@localhost/freelance_marketplace')
        with engine.connect() as conn:
            result = conn.execute(text('SELECT 1'))
            print("✓ Database connection successful")
            return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

def check_alembic_version():
    """Check current alembic version"""
    try:
        engine = create_engine('postgresql://postgres:password@localhost/freelance_marketplace')
        with engine.connect() as conn:
            result = conn.execute(text('SELECT version_num FROM alembic_version'))
            version = result.fetchone()
            if version:
                print(f"✓ Current migration version: {version[0]}")
                return version[0]
            else:
                print("✗ No migration version found")
                return None
    except Exception as e:
        print(f"✗ Failed to check migration version: {e}")
        return None

def check_marketplace_schema():
    """Check if marketplace schema exists"""
    try:
        engine = create_engine('postgresql://postgres:password@localhost/freelance_marketplace')
        with engine.connect() as conn:
            result = conn.execute(text("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'marketplace'"))
            schema = result.fetchone()
            if schema:
                print("✓ Marketplace schema exists")
                return True
            else:
                print("✗ Marketplace schema does not exist")
                return False
    except Exception as e:
        print(f"✗ Failed to check schema: {e}")
        return False

def list_tables():
    """List tables in marketplace schema"""
    try:
        engine = create_engine('postgresql://postgres:password@localhost/freelance_marketplace')
        with engine.connect() as conn:
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'marketplace' ORDER BY table_name"))
            tables = result.fetchall()
            if tables:
                print("✓ Tables in marketplace schema:")
                for table in tables:
                    print(f"  - {table[0]}")
            else:
                print("✗ No tables found in marketplace schema")
            return [table[0] for table in tables]
    except Exception as e:
        print(f"✗ Failed to list tables: {e}")
        return []

def run_migration():
    """Try to run migration"""
    try:
        cfg = Config("alembic.ini")
        print("Attempting to run migration...")
        command.upgrade(cfg, "head")
        print("✓ Migration completed successfully")
        return True
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=== Database Migration Debug ===")
    print()
    
    # Check database connection
    if not check_database_connection():
        sys.exit(1)
    
    # Check schema
    check_marketplace_schema()
    
    # Check current version
    current_version = check_alembic_version()
    
    # List existing tables
    tables = list_tables()
    
    print()
    print("=== Attempting Migration ===")
    success = run_migration()
    
    if success:
        print()
        print("=== Post-Migration Status ===")
        check_alembic_version()
        list_tables()
    
    sys.exit(0 if success else 1)
