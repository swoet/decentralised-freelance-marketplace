"""
Redis caching utilities for API responses and data caching
"""
from functools import wraps
import json
import hashlib
from typing import Any, Optional, Callable
import redis
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Redis client
try:
    redis_client = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_timeout=5
    )
    # Test connection
    redis_client.ping()
    logger.info("Redis connection established successfully")
except Exception as e:
    logger.error(f"Failed to connect to Redis: {e}")
    redis_client = None


def generate_cache_key(prefix: str, *args, **kwargs) -> str:
    """
    Generate a unique cache key based on function arguments
    """
    # Create a string representation of all arguments
    key_data = f"{prefix}:{str(args)}:{str(sorted(kwargs.items()))}"
    # Hash it to create a consistent key
    key_hash = hashlib.md5(key_data.encode()).hexdigest()
    return f"{prefix}:{key_hash}"


def cache_response(
    expire_time: int = 300,
    prefix: str = "api",
    key_builder: Optional[Callable] = None
):
    """
    Decorator to cache API responses in Redis
    
    Args:
        expire_time: Cache expiration time in seconds (default: 5 minutes)
        prefix: Cache key prefix
        key_builder: Optional custom function to build cache key
    
    Usage:
        @cache_response(expire_time=60, prefix="projects")
        async def get_projects(page: int = 1):
            return await fetch_projects(page)
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if not redis_client:
                # If Redis is not available, execute function normally
                return await func(*args, **kwargs)
            
            try:
                # Generate cache key
                if key_builder:
                    cache_key = key_builder(*args, **kwargs)
                else:
                    cache_key = generate_cache_key(
                        f"{prefix}:{func.__name__}",
                        *args,
                        **kwargs
                    )
                
                # Try to get from cache
                cached_data = redis_client.get(cache_key)
                if cached_data:
                    logger.debug(f"Cache hit for key: {cache_key}")
                    return json.loads(cached_data)
                
                # Cache miss - execute function
                logger.debug(f"Cache miss for key: {cache_key}")
                result = await func(*args, **kwargs)
                
                # Store in cache
                redis_client.setex(
                    cache_key,
                    expire_time,
                    json.dumps(result, default=str)
                )
                
                return result
                
            except Exception as e:
                logger.error(f"Cache error: {e}")
                # If caching fails, execute function normally
                return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def invalidate_cache(pattern: str):
    """
    Invalidate cache entries matching a pattern
    
    Args:
        pattern: Redis key pattern (e.g., "projects:*")
    """
    if not redis_client:
        return
    
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
            logger.info(f"Invalidated {len(keys)} cache entries matching: {pattern}")
    except Exception as e:
        logger.error(f"Error invalidating cache: {e}")


def cache_set(key: str, value: Any, expire_time: int = 300):
    """
    Set a value in cache
    
    Args:
        key: Cache key
        value: Value to cache
        expire_time: Expiration time in seconds
    """
    if not redis_client:
        return False
    
    try:
        redis_client.setex(
            key,
            expire_time,
            json.dumps(value, default=str)
        )
        return True
    except Exception as e:
        logger.error(f"Error setting cache: {e}")
        return False


def cache_get(key: str) -> Optional[Any]:
    """
    Get a value from cache
    
    Args:
        key: Cache key
    
    Returns:
        Cached value or None if not found
    """
    if not redis_client:
        return None
    
    try:
        cached_data = redis_client.get(key)
        if cached_data:
            return json.loads(cached_data)
        return None
    except Exception as e:
        logger.error(f"Error getting cache: {e}")
        return None


def cache_delete(key: str):
    """
    Delete a specific cache key
    
    Args:
        key: Cache key to delete
    """
    if not redis_client:
        return
    
    try:
        redis_client.delete(key)
        logger.debug(f"Deleted cache key: {key}")
    except Exception as e:
        logger.error(f"Error deleting cache: {e}")


def cache_exists(key: str) -> bool:
    """
    Check if a cache key exists
    
    Args:
        key: Cache key to check
    
    Returns:
        True if key exists, False otherwise
    """
    if not redis_client:
        return False
    
    try:
        return redis_client.exists(key) > 0
    except Exception as e:
        logger.error(f"Error checking cache existence: {e}")
        return False


def cache_increment(key: str, amount: int = 1, expire_time: int = 3600) -> int:
    """
    Increment a counter in cache
    
    Args:
        key: Cache key
        amount: Amount to increment by
        expire_time: Expiration time in seconds
    
    Returns:
        New value after increment
    """
    if not redis_client:
        return 0
    
    try:
        value = redis_client.incr(key, amount)
        redis_client.expire(key, expire_time)
        return value
    except Exception as e:
        logger.error(f"Error incrementing cache: {e}")
        return 0


# Specific cache utilities
class CacheManager:
    """
    Manager class for common caching operations
    """
    
    @staticmethod
    def cache_user_data(user_id: int, data: dict, expire_time: int = 600):
        """Cache user data"""
        cache_set(f"user:{user_id}", data, expire_time)
    
    @staticmethod
    def get_user_data(user_id: int) -> Optional[dict]:
        """Get cached user data"""
        return cache_get(f"user:{user_id}")
    
    @staticmethod
    def invalidate_user_cache(user_id: int):
        """Invalidate user cache"""
        invalidate_cache(f"user:{user_id}*")
    
    @staticmethod
    def cache_project_list(filters: dict, data: list, expire_time: int = 300):
        """Cache project list"""
        key = generate_cache_key("projects:list", **filters)
        cache_set(key, data, expire_time)
    
    @staticmethod
    def get_project_list(filters: dict) -> Optional[list]:
        """Get cached project list"""
        key = generate_cache_key("projects:list", **filters)
        return cache_get(key)
    
    @staticmethod
    def invalidate_project_cache():
        """Invalidate all project caches"""
        invalidate_cache("projects:*")
    
    @staticmethod
    def cache_stats(stats_type: str, data: dict, expire_time: int = 600):
        """Cache statistics data"""
        cache_set(f"stats:{stats_type}", data, expire_time)
    
    @staticmethod
    def get_stats(stats_type: str) -> Optional[dict]:
        """Get cached statistics"""
        return cache_get(f"stats:{stats_type}")
