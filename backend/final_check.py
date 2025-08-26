#!/usr/bin/env python3
"""
Final comprehensive check of database migration status
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

try:
    from app.core.db import engine
    from sqlalchemy import text
    
    print("=== Database Migration Status Check ===\n")
    
    with engine.connect() as conn:
        # 1. Check if marketplace schema exists
        schema_result = conn.execute(text(
            "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'marketplace'"
        ))
        schema_exists = schema_result.fetchone() is not None
        print(f"Marketplace schema exists: {schema_exists}")
        
        if not schema_exists:
            print("ERROR: Marketplace schema not found!")
            sys.exit(1)
        
        # 2. Check alembic version
        try:
            version_result = conn.execute(text('SELECT version_num FROM marketplace.alembic_version'))
            version = version_result.fetchone()
            current_version = version[0] if version else None
            print(f"Current migration version: {current_version}")
        except Exception as e:
            print(f"Could not read alembic version: {e}")
            current_version = None
        
        # 3. List all tables
        tables_result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'marketplace' 
            ORDER BY table_name
        """))
        tables = [row[0] for row in tables_result.fetchall()]
        
        print(f"\nTables in marketplace schema ({len(tables)}):")
        for table in tables:
            print(f"  ✓ {table}")
        
        # 4. Check for expected tables from migrations
        expected_tables = [
            'alembic_version',
            'users', 'audit_logs', 'organizations', 'portfolios', 
            'projects', 'bids', 'milestones', 'escrow_contracts',
            'messages', 'reviews',
            # From additional migrations
            'integrations', 'webhooks', 'api_keys', 'api_key_usages',
            'token_transactions', 'sessions', 'backup_codes', 'consent_logs'
        ]
        
        missing_tables = [t for t in expected_tables if t not in tables]
        extra_tables = [t for t in tables if t not in expected_tables]
        
        print(f"\nMigration Analysis:")
        if missing_tables:
            print(f"  Missing tables: {missing_tables}")
        else:
            print("  ✓ All expected tables present")
            
        if extra_tables:
            print(f"  Extra tables: {extra_tables}")
        
        # 5. Final status
        migration_complete = len(missing_tables) == 0 and current_version is not None
        print(f"\nMigration Status: {'✓ COMPLETE' if migration_complete else '✗ INCOMPLETE'}")
        
        if migration_complete:
            print("Database is ready for use!")
        else:
            print("Database migration needs attention.")
            
        sys.exit(0 if migration_complete else 1)
        
except Exception as e:
    print(f"Error during database check: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
