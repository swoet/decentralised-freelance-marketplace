#!/usr/bin/env python3
"""
Script to create a super admin user in the database
"""
import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from app.core.db import SessionLocal, engine
from app.models.user import User
from app.core.auth import get_password_hash
from datetime import datetime, timezone
import uuid

def create_super_admin():
    """Create a super admin user"""
    
    # Create database session
    db: Session = SessionLocal()
    
    try:
        # Check if super admin already exists
        existing_admin = db.query(User).filter(
            User.email == "SwoetPhethan@gmail.com"
        ).first()
        
        if existing_admin:
            print("Super admin already exists!")
            print(f"Email: {existing_admin.email}")
            print(f"Role: {existing_admin.role}")
            return
        
        # Create super admin user
        super_admin = User(
            id=str(uuid.uuid4()),
            email="SwoetPhethan@gmail.com",
            hashed_password=get_password_hash("Swoet@Phethan@14052020"),
            full_name="Swoet Phethan",
            role="super_admin",
            is_active=True,
            is_verified=True,
            two_fa_enabled=False,
            wallet_address=None,
            created_at=datetime.now(timezone.utc)
        )
        
        # Add to database
        db.add(super_admin)
        db.commit()
        db.refresh(super_admin)
        
        print("✅ Super admin created successfully!")
        print(f"Email: {super_admin.email}")
        print(f"Full Name: {super_admin.full_name}")
        print(f"Role: {super_admin.role}")
        print(f"ID: {super_admin.id}")
        
    except Exception as e:
        print(f"❌ Error creating super admin: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Creating super admin user...")
    create_super_admin()
