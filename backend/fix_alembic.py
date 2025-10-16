#!/usr/bin/env python3
"""Fix alembic version in database"""

import sqlite3
import os

def fix_alembic_version():
    db_path = 'freelance_marketplace.db'
    
    if not os.path.exists(db_path):
        print(f"Database file {db_path} does not exist")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current version
        cursor.execute('SELECT version_num FROM alembic_version')
        current_version = cursor.fetchone()
        print(f"Current alembic version: {current_version[0] if current_version else 'None'}")
        
        # Update to the correct base migration
        cursor.execute('UPDATE alembic_version SET version_num = ?', ('01e6735adbf8',))
        conn.commit()
        
        # Verify the change
        cursor.execute('SELECT version_num FROM alembic_version')
        new_version = cursor.fetchone()
        print(f"Updated alembic version to: {new_version[0] if new_version else 'None'}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error fixing alembic version: {e}")
        return False

if __name__ == "__main__":
    success = fix_alembic_version()
    if success:
        print("✅ Alembic version fixed successfully!")
    else:
        print("❌ Failed to fix alembic version")
