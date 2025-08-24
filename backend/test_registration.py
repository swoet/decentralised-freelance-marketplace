#!/usr/bin/env python3
"""
Test script to diagnose and fix the user registration issue.
"""
import sys
import traceback
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate
from app.services.user import user
from app.core.auth import get_password_hash

def test_database_connection():
    """Test database connection and schema."""
    print("=" * 60)
    print("TESTING DATABASE CONNECTION")
    print("=" * 60)
    
    try:
        engine = create_engine(settings.DATABASE_URL_FIXED)
        with engine.connect() as conn:
            # Test basic connection
            result = conn.execute(text('SELECT version()'))
            print("[OK] Database connection successful")
            
            # Check marketplace schema
            result = conn.execute(text("""
                SELECT schema_name FROM information_schema.schemata 
                WHERE schema_name = 'marketplace'
            """))
            if result.fetchone():
                print("[OK] Marketplace schema exists")
            else:
                print("[ERROR] Marketplace schema missing")
                return False
                
            # Check users table structure
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_schema = 'marketplace' AND table_name = 'users'
                ORDER BY ordinal_position
            """))
            
            columns = result.fetchall()
            if columns:
                print("[OK] Users table exists with columns:")
                for col in columns:
                    nullable = "NULL" if col[2] == "YES" else "NOT NULL"
                    default = f" DEFAULT {col[3]}" if col[3] else ""
                    print(f"  - {col[0]:<20} {col[1]:<15} {nullable}{default}")
            else:
                print("[ERROR] Users table not found")
                return False
                
            return True
            
    except Exception as e:
        print(f"[ERROR] Database connection failed: {str(e)}")
        traceback.print_exc()
        return False

def test_user_creation():
    """Test user creation directly."""
    print("\n" + "=" * 60)
    print("TESTING USER CREATION")
    print("=" * 60)
    
    try:
        # Create database session
        engine = create_engine(settings.DATABASE_URL_FIXED)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Test data
        test_email = "test@example.com"
        test_password = "testpass123"
        test_name = "Test User"
        test_role = "client"
        
        print(f"Testing user creation with:")
        print(f"  Email: {test_email}")
        print(f"  Name: {test_name}")
        print(f"  Role: {test_role}")
        
        # Check if user already exists
        existing_user = user.get_by_email(db, email=test_email)
        if existing_user:
            print("[OK] Found existing test user, deleting...")
            db.delete(existing_user)
            db.commit()
        
        # Create user schema object
        user_create = UserCreate(
            email=test_email,
            password=test_password,
            full_name=test_name,
            role=test_role
        )
        
        print("[OK] UserCreate schema object created")
        
        # Test user creation
        print("Attempting to create user...")
        new_user = user.create(db, obj_in=user_create)
        print(f"[OK] User created successfully with ID: {new_user.id}")
        print(f"  Email: {new_user.email}")
        print(f"  Name: {new_user.full_name}")
        print(f"  Role: {new_user.role}")
        print(f"  Active: {new_user.is_active}")
        
        # Clean up
        db.delete(new_user)
        db.commit()
        print("[OK] Test user cleaned up")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"[ERROR] User creation failed: {str(e)}")
        traceback.print_exc()
        if 'db' in locals():
            db.close()
        return False

def test_registration_endpoint():
    """Test the registration endpoint logic."""
    print("\n" + "=" * 60)
    print("TESTING REGISTRATION ENDPOINT LOGIC")
    print("=" * 60)
    
    try:
        from app.api.v1.auth import register
        from app.api.deps import get_db
        from app.schemas.user import UserCreate
        
        # Create test user data
        user_data = UserCreate(
            email="endpoint_test@example.com",
            password="testpass123",
            full_name="Endpoint Test User",
            role="freelancer"
        )
        
        print(f"Testing registration endpoint with:")
        print(f"  Email: {user_data.email}")
        print(f"  Name: {user_data.full_name}")
        print(f"  Role: {user_data.role}")
        
        # Get database session
        db_gen = get_db()
        db = next(db_gen)
        
        # Check if user exists and clean up
        existing_user = user.get_by_email(db, email=user_data.email)
        if existing_user:
            print("[OK] Cleaning up existing test user...")
            db.delete(existing_user)
            db.commit()
        
        # Test registration
        print("Calling registration endpoint...")
        result = register(user_in=user_data, db=db)
        
        print("[OK] Registration endpoint successful!")
        print(f"  Token: {result['token'][:20]}...")
        print(f"  User ID: {result['user']['id']}")
        print(f"  User Email: {result['user']['email']}")
        
        # Clean up
        created_user = user.get_by_email(db, email=user_data.email)
        if created_user:
            db.delete(created_user)
            db.commit()
            print("[OK] Test user cleaned up")
        
        db.close()
        return True
        
    except Exception as e:
        print("[ERROR] Registration endpoint failed: {str(e)}")
        traceback.print_exc()
        if 'db' in locals():
            db.close()
        return False

def main():
    """Run all tests."""
    print("REGISTRATION DIAGNOSTIC TOOL")
    print("=" * 60)
    
    # Test 1: Database connection
    db_ok = test_database_connection()
    if not db_ok:
        print("\n[FAIL] Database connection failed. Cannot proceed.")
        return False
    
    # Test 2: User creation
    user_ok = test_user_creation()
    if not user_ok:
        print("\n[FAIL] User creation failed.")
        return False
    
    # Test 3: Registration endpoint
    endpoint_ok = test_registration_endpoint()
    if not endpoint_ok:
        print("\n[FAIL] Registration endpoint failed.")
        return False
    
    print("\n" + "=" * 60)
    print("[SUCCESS] ALL TESTS PASSED!")
    print("The registration system should be working correctly.")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)