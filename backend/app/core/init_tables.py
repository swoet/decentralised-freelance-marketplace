"""Initialize new tables for AI matching and blockchain reputation models"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.base import Base
from app.models.ai_matching import *
from app.models.blockchain_reputation import *
import logging

logger = logging.getLogger(__name__)


def create_ai_tables():
    """Create tables for AI matching and blockchain reputation models"""
    try:
        engine = create_engine(settings.DATABASE_URL_FIXED)
        
        # Import all models to ensure they're registered
        from app.models import ai_matching, blockchain_reputation
        
        # Create only the new tables (won't affect existing ones)
        Base.metadata.create_all(bind=engine)
        
        logger.info("Successfully created new AI and blockchain reputation tables")
        return True
        
    except Exception as e:
        logger.error(f"Failed to create AI tables: {e}")
        return False


if __name__ == "__main__":
    # Allow running directly
    create_ai_tables()
