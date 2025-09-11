"""
Rate Limiting Middleware

FastAPI middleware for applying rate limits to incoming requests
based on configurable rules and patterns.
"""

import logging
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from sqlalchemy.orm import Session
from fastapi import status

from app.core.db import SessionLocal
from app.services.rate_limit_service import RateLimitService
from app.models.security import RateLimitRule

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting requests"""
    
    def __init__(self, app, redis_client=None):
        super().__init__(app)
        self.redis_client = redis_client
        
        # Paths to exclude from rate limiting
        self.excluded_paths = {
            '/health',
            '/metrics',
            '/docs',
            '/redoc',
            '/openapi.json'
        }
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for excluded paths
        if any(request.url.path.startswith(path) for path in self.excluded_paths):
            return await call_next(request)
        
        # Get database session
        db: Session = SessionLocal()
        
        try:
            rate_limit_service = RateLimitService(db, self.redis_client)
            
            # Extract request information
            client_ip = self._get_client_ip(request)
            endpoint = request.url.path
            method = request.method
            user_agent = request.headers.get('user-agent')
            
            # Get user ID if available (from JWT or session)
            user_id = self._get_user_id(request)
            
            # Create identifier for rate limiting
            # Use user ID if authenticated, otherwise IP address
            identifier = user_id if user_id else client_ip
            
            # Check rate limits
            allowed, rate_limit_info = rate_limit_service.check_rate_limit(
                identifier=identifier,
                endpoint=endpoint,
                method=method,
                user_id=user_id,
                ip_address=client_ip,
                user_agent=user_agent
            )
            
            if not allowed:
                # Return rate limit exceeded response
                return self._create_rate_limit_response(rate_limit_info)
            
            # Continue with the request
            response = await call_next(request)
            
            # Add rate limit headers to response
            self._add_rate_limit_headers(response, rate_limit_info)
            
            return response
            
        except Exception as e:
            logger.error(f"Rate limiting middleware error: {str(e)}")
            # On error, allow the request to continue
            return await call_next(request)
        
        finally:
            db.close()
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request"""
        # Check for forwarded headers (when behind proxy/load balancer)
        forwarded_for = request.headers.get('x-forwarded-for')
        if forwarded_for:
            # Take the first IP in the chain
            return forwarded_for.split(',')[0].strip()
        
        real_ip = request.headers.get('x-real-ip')
        if real_ip:
            return real_ip.strip()
        
        # Fallback to direct client IP
        if hasattr(request.client, 'host'):
            return request.client.host
        
        return '127.0.0.1'  # Fallback
    
    def _get_user_id(self, request: Request) -> str | None:
        """Extract user ID from request if authenticated"""
        try:
            # Check for Authorization header with Bearer token
            auth_header = request.headers.get('authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return None
            
            # You could decode JWT here to get user ID
            # For now, we'll rely on the endpoint to handle auth
            # This is a placeholder - implement JWT decoding as needed
            
            # Alternative: Check if user info is stored in request state
            return getattr(request.state, 'user_id', None)
            
        except Exception:
            return None
    
    def _create_rate_limit_response(self, rate_limit_info: dict) -> JSONResponse:
        """Create rate limit exceeded response"""
        retry_after = rate_limit_info.get('retry_after', 60)
        
        headers = {
            'Retry-After': str(retry_after),
            'X-RateLimit-Limit': str(rate_limit_info.get('limit', 'unknown')),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': str(rate_limit_info.get('reset_time', int(time.time()) + retry_after))
        }
        
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                'error': 'Rate limit exceeded',
                'message': f"Too many requests. Try again in {retry_after} seconds.",
                'rule': rate_limit_info.get('rule', 'unknown'),
                'retry_after': retry_after
            },
            headers=headers
        )
    
    def _add_rate_limit_headers(self, response: Response, rate_limit_info: dict):
        """Add rate limit information to response headers"""
        if rate_limit_info.get('status') == 'allowed':
            # You could add current usage info here
            response.headers['X-RateLimit-Status'] = 'allowed'


# Utility function to create and initialize default rate limit rules
def create_default_rate_limit_rules(db: Session):
    """Create default rate limit rules for common endpoints"""
    rate_limit_service = RateLimitService(db)
    
    default_rules = [
        {
            'rule_name': 'api_general',
            'endpoint_pattern': r'/api/v1/.*',
            'limit_per_minute': 60,
            'limit_per_hour': 1000,
            'limit_per_day': 10000,
            'burst_limit': 10,
            'applies_to_authenticated': True,
            'applies_to_anonymous': True
        },
        {
            'rule_name': 'auth_endpoints',
            'endpoint_pattern': r'/api/v1/auth/.*',
            'limit_per_minute': 10,
            'limit_per_hour': 50,
            'limit_per_day': 200,
            'burst_limit': 3,
            'applies_to_authenticated': False,
            'applies_to_anonymous': True
        },
        {
            'rule_name': 'security_mfa',
            'endpoint_pattern': r'/api/v1/security/mfa/.*',
            'limit_per_minute': 20,
            'limit_per_hour': 100,
            'limit_per_day': 500,
            'burst_limit': 5,
            'applies_to_authenticated': True,
            'applies_to_anonymous': False
        },
        {
            'rule_name': 'file_uploads',
            'endpoint_pattern': r'/api/v1/.*/upload.*',
            'limit_per_minute': 10,
            'limit_per_hour': 50,
            'limit_per_day': 200,
            'burst_limit': 2,
            'applies_to_authenticated': True,
            'applies_to_anonymous': False
        },
        {
            'rule_name': 'admin_endpoints',
            'endpoint_pattern': r'/api/v1/admin/.*',
            'limit_per_minute': 30,
            'limit_per_hour': 200,
            'limit_per_day': 1000,
            'burst_limit': 5,
            'applies_to_authenticated': True,
            'applies_to_anonymous': False
        }
    ]
    
    # Check if rules already exist
    existing_rules = {rule.rule_name for rule in db.query(RateLimitRule).all()}
    
    for rule_config in default_rules:
        if rule_config['rule_name'] not in existing_rules:
            try:
                rate_limit_service.create_rule(**rule_config)
                logger.info(f"Created rate limit rule: {rule_config['rule_name']}")
            except Exception as e:
                logger.error(f"Failed to create rate limit rule {rule_config['rule_name']}: {str(e)}")


# Rate limit decorator for individual endpoints
def rate_limit(
    limit_per_minute: int = None,
    limit_per_hour: int = None,
    limit_per_day: int = None,
    burst_limit: int = None,
    key_func: callable = None
):
    """
    Decorator to apply rate limiting to specific FastAPI endpoints
    
    Args:
        limit_per_minute: Requests per minute limit
        limit_per_hour: Requests per hour limit  
        limit_per_day: Requests per day limit
        burst_limit: Burst requests limit
        key_func: Function to generate rate limit key
    """
    def decorator(func):
        func._rate_limit_config = {
            'limit_per_minute': limit_per_minute,
            'limit_per_hour': limit_per_hour,
            'limit_per_day': limit_per_day,
            'burst_limit': burst_limit,
            'key_func': key_func
        }
        return func
    return decorator
