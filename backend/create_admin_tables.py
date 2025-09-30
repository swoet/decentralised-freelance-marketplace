#!/usr/bin/env python3
"""
Create admin tracking tables
"""
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.db import engine
from app.models.base import Base
from app.models.activity import ActivityLog, SystemMetrics, RevenueRecord, AIRequestLog, DisputeCase

def create_tables():
    """Create all admin tracking tables"""
    print("Creating admin tracking tables...")
    
    try:
        # Import all models to ensure they're registered
        import app.models.user
        import app.models.project
        
        # Create only the new tables
        ActivityLog.__table__.create(engine, checkfirst=True)
        print("✅ Created activity_logs table")
        
        SystemMetrics.__table__.create(engine, checkfirst=True)
        print("✅ Created system_metrics table")
        
        RevenueRecord.__table__.create(engine, checkfirst=True)
        print("✅ Created revenue_records table")
        
        AIRequestLog.__table__.create(engine, checkfirst=True)
        print("✅ Created ai_request_logs table")
        
        DisputeCase.__table__.create(engine, checkfirst=True)
        print("✅ Created dispute_cases table")
        
        print("\n✅ All admin tracking tables created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating tables: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    create_tables()
