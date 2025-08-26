#!/usr/bin/env python3
"""
Script to run database migrations with proper error handling
"""
import sys
import os
from alembic.config import Config
from alembic import command

def run_migration():
    try:
        # Set up alembic config
        alembic_cfg = Config("alembic.ini")
        
        # Show current version
        print("Current migration version:")
        command.current(alembic_cfg, verbose=True)
        
        # Run upgrade
        print("\nRunning migration upgrade...")
        command.upgrade(alembic_cfg, "head")
        
        print("\nMigration completed successfully!")
        
        # Show final version
        print("\nFinal migration version:")
        command.current(alembic_cfg, verbose=True)
        
    except Exception as e:
        print(f"Migration failed with error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
