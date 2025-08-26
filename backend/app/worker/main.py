"""Worker process entry point for background job processing."""

import os
import sys
import logging
from rq import Worker, Connection
import redis

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """Main worker process."""
    if not settings.WORKER_ENABLED:
        logger.info("Worker is disabled via configuration")
        return
    
    # Connect to Redis
    redis_conn = redis.from_url(settings.WORKER_REDIS_URL)
    
    # Create worker
    worker = Worker(
        ['default'],  # Queue names to listen to
        connection=redis_conn,
        name=f"worker-{os.getpid()}"
    )
    
    logger.info(f"Starting RQ worker {worker.name}")
    logger.info(f"Redis URL: {settings.WORKER_REDIS_URL}")
    logger.info(f"Concurrency: {settings.WORKER_CONCURRENCY}")
    
    try:
        # Start the worker
        worker.work(with_scheduler=True)
    except KeyboardInterrupt:
        logger.info("Worker interrupted, shutting down...")
    except Exception as e:
        logger.error(f"Worker error: {e}")
        raise
    finally:
        logger.info("Worker shutdown complete")


if __name__ == "__main__":
    main()
