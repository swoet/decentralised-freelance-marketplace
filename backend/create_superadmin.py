#!/usr/bin/env python3
"""
Super Admin Account Creation Script
Creates a default super admin account with specified credentials.
"""

import sys
import os
import asyncio
from datetime import datetime
from passlib.context import CryptContext

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.db import get_db
from app.models.user import User
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Super Admin Credentials
SUPER_ADMIN_EMAIL = "SwoetPhethan@gmail.com"
SUPER_ADMIN_PASSWORD = "Swoet@Phethan@14052020"
SUPER_ADMIN_USERNAME = "superadmin"

def hash_password(password: str) -> str:
    """Hash a password for storing."""
    return pwd_context.hash(password)

def create_super_admin():
    """Create the super admin account."""
    
    # Import database configuration
    from app.core.db import engine, SessionLocal
    
    # Create a database session
    db = SessionLocal()
    
    try:
        # Check if super admin already exists
        existing_admin = db.query(User).filter(
            User.email == SUPER_ADMIN_EMAIL
        ).first()
        
        if existing_admin:
            print(f"Super admin account already exists!")
            print(f"Email: {existing_admin.email}")
            print(f"Role: {existing_admin.role}")
            
            # Update existing user to super_admin if needed
            if existing_admin.role != 'super_admin':
                existing_admin.role = 'super_admin'
                existing_admin.is_active = True
                existing_admin.is_verified = True
                db.commit()
                print("✅ Updated existing user to super_admin role!")
            else:
                print("✅ Super admin already configured correctly!")
            
            return existing_admin
        
        # Create new super admin user
        hashed_password = hash_password(SUPER_ADMIN_PASSWORD)
        
        super_admin = User(
            email=SUPER_ADMIN_EMAIL,
            hashed_password=hashed_password,
            full_name="Super Admin",
            role='super_admin',
            is_active=True,
            is_verified=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(super_admin)
        db.commit()
        db.refresh(super_admin)
        
        # Set full_name and bio for super admin
        super_admin.full_name = "Super Admin"
        super_admin.bio = "System Super Administrator with full platform control"
        db.commit()
        
        print("🎉 Super Admin Account Created Successfully!")
        print(f"📧 Email: {SUPER_ADMIN_EMAIL}")
        print(f"🔐 Password: {SUPER_ADMIN_PASSWORD}")
        print(f"🛡️ Role: super_admin")
        print(f"✅ Status: Active & Verified")
        print(f"🆔 User ID: {super_admin.id}")
        
        print("\n⚠️ IMPORTANT SECURITY NOTES:")
        print("1. Change the default password after first login")
        print("2. Store these credentials securely")
        print("3. This account has full system access")
        print("4. Use this account to create other admin users")
        
        return super_admin
        
    except Exception as e:
        print(f"❌ Error creating super admin: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

def verify_super_admin():
    """Verify the super admin account exists and is properly configured."""
    from app.core.db import SessionLocal
    
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == SUPER_ADMIN_EMAIL).first()
        
        if not admin:
            print("❌ Super admin account not found!")
            return False
            
        print(f"✅ Super Admin Verification:")
        print(f"   Email: {admin.email}")
        print(f"   Role: {admin.role}")
        print(f"   Active: {admin.is_active}")
        print(f"   Verified: {admin.is_verified}")
        print(f"   Created: {admin.created_at}")
        
        # Show full name if available
        if admin.full_name:
            print(f"   Full Name: {admin.full_name}")
        
        return admin.role == 'super_admin' and admin.is_active
        
    except Exception as e:
        print(f"❌ Error verifying super admin: {str(e)}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 FreelanceX Super Admin Setup")
    print("=" * 50)
    
    try:
        # Create or update super admin
        super_admin = create_super_admin()
        
        print("\n" + "=" * 50)
        print("🔍 Verifying Super Admin Account...")
        
        # Verify the account
        if verify_super_admin():
            print("✅ Super Admin account is ready!")
            print("\n📝 Next Steps:")
            print("1. Start your backend server")
            print("2. Start the admin dashboard (npm run dev in admin-dashboard/)")
            print("3. Go to http://localhost:3001/login")
            print("4. Login with the super admin credentials")
            print("5. Change the default password in settings")
        else:
            print("❌ Super Admin verification failed!")
            
    except Exception as e:
        print(f"💥 Setup failed: {str(e)}")
        print("Please check your database configuration and try again.")
        sys.exit(1)
