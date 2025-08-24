#!/usr/bin/env python3
"""
Fix database schema issues by adding missing columns.
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

def fix_projects_table():
    """Add missing project_metadata column to projects table."""
    print("Fixing projects table schema...")
    
    engine = create_engine(settings.DATABASE_URL_FIXED)
    
    with engine.begin() as conn:  # Use begin() for auto-commit
        try:
            # Check if column exists
            result = conn.execute(text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_schema = 'marketplace' 
                AND table_name = 'projects' 
                AND column_name = 'project_metadata'
            """))
            
            if result.fetchone():
                print("[OK] project_metadata column already exists")
                return True
            
            # Add the missing column
            conn.execute(text("""
                ALTER TABLE marketplace.projects 
                ADD COLUMN project_metadata JSONB
            """))
            
            print("[OK] Added project_metadata column to projects table")
            
            # Verify it was added
            result = conn.execute(text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_schema = 'marketplace' 
                AND table_name = 'projects' 
                AND column_name = 'project_metadata'
            """))
            
            if result.fetchone():
                print("[OK] project_metadata column verified")
                return True
            else:
                print("[ERROR] Failed to verify column addition")
                return False
                
        except Exception as e:
            print(f"[ERROR] Failed to fix projects table: {e}")
            return False

def main():
    """Main function."""
    print("DATABASE SCHEMA FIX TOOL")
    print("=" * 40)
    
    success = fix_projects_table()
    
    if success:
        print("\n[SUCCESS] Schema fix completed!")
    else:
        print("\n[FAIL] Schema fix failed!")
    
    return success

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)