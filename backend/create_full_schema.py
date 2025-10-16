#!/usr/bin/env python3
"""Create full database schema from SQLAlchemy models"""

import os
import sys
from sqlalchemy import create_engine
from app.models.base import Base

# Import all models to ensure they're registered with Base
from app.models.user import User
from app.models.project import Project
from app.models.bid import Bid
from app.models.escrow_contract import EscrowContract
from app.models.milestone import Milestone
from app.models.review import Review
from app.models.message import Message
from app.models.organization import Organization
from app.models.portfolio import Portfolio
from app.models.smart_escrow import SmartEscrow, SmartMilestone, MilestoneCondition, MilestoneDeliverable, EscrowDispute, EscrowAutomationEvent
from app.models.ai_matching import *
from app.models.security import *
from app.models.financial import *
from app.models.blockchain_reputation import *
from app.models.community import *
from app.models.integration import *
from app.models.oauth import *
from app.models.job_queue import *
from app.models.skills import *
from app.models.token import *
from app.models.activity import *
from app.models.audit_log import *
from app.models.device import *
from app.models.matching import *

def create_full_schema():
    """Create the full database schema from models"""
    
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL', 'postgresql://shawn:Shawn%402202@localhost:5432/freelance_marketplace')
    
    print(f"Connecting to database: {database_url}")
    
    engine = create_engine(database_url)
    
    try:
        # Create all tables
        print("Creating all tables from models...")
        Base.metadata.create_all(bind=engine)
        print("Database schema created successfully!")
        
        # List created tables
        from sqlalchemy import inspect
        inspector = inspect(engine)
        
        # Get tables from default schema
        tables = inspector.get_table_names()
        print(f"Tables in default schema: {len(tables)}")
        for table in sorted(tables):
            print(f"  - {table}")
        
        # Get tables from marketplace schema
        try:
            marketplace_tables = inspector.get_table_names(schema='marketplace')
            print(f"Tables in marketplace schema: {len(marketplace_tables)}")
            for table in sorted(marketplace_tables):
                print(f"  - marketplace.{table}")
        except Exception as e:
            print(f"No marketplace schema or error: {e}")
            
    except Exception as e:
        print(f"Error creating schema: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_full_schema()
