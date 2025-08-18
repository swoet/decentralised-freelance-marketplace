#!/usr/bin/env python3
"""
Database initialization script
"""
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.config import settings
from app.models.base import Base
from app.models.user import User
from app.models.project import Project
from app.models.organization import Organization
from app.models.bid import Bid
from app.models.escrow_contract import EscrowContract
from app.models.milestone import Milestone
from app.models.review import Review
from app.models.message import Message
from app.models.portfolio import Portfolio
from app.models.audit_log import AuditLog

def init_db():
    """Initialize the database with all tables"""
    try:
        # Use the fixed database URL from settings
        engine = create_engine(settings.DATABASE_URL_FIXED, pool_pre_ping=True)
        
        # Ensure marketplace schema exists and is used
        with engine.connect() as connection:
            connection.exec_driver_sql("CREATE SCHEMA IF NOT EXISTS marketplace AUTHORIZATION CURRENT_USER")
            connection.exec_driver_sql("SET search_path TO marketplace")
        # Create all tables in marketplace schema
        Base.metadata.create_all(bind=engine)
        
        print("Database tables created successfully!")
        
        # Test connection
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        try:
            # Test query
            result = db.execute("SELECT 1")
            print("Database connection test successful!")
        except Exception as e:
            print(f"Database connection test failed: {e}")
        finally:
            db.close()
            
    except Exception as e:
        print(f"Failed to initialize database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init_db()
