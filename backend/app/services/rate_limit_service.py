"""
Rate Limiting Service

This service implements Redis-based rate limiting with configurable rules,
sliding window counters, violation tracking, and progressive backoff mechanisms.
"""

import logging
import redis
import json
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

from app.models.security import (
    RateLimitRule,
    RateLimitViolation,
    SecurityEvent,
    SecurityEventType
)
from app.core.config import settings
from app.services.security_event_service import SecurityEventService

logger = logging.getLogger(__name__)


class RateLimitService:
    """Service for handling rate limiting with Redis backend"""
    
    def __init__(self, db: Session, redis_client: Optional[redis.Redis] = None):
        self.db = db
        self.security_service = SecurityEventService(db)
        
        # Initialize Redis connection
        if redis_client:
            self.redis = redis_client
        else:
            redis_url = getattr(settings, 'REDIS_HOST', 'redis://localhost:6379')
            try:
                self.redis = redis.from_url(redis_url, decode_responses=True)
                # Test connection
                self.redis.ping()
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}. Rate limiting will be disabled.")
                self.redis = None
        
        # Default rate limits if Redis is unavailable
        self.default_limits = {
            'requests_per_minute': 60,
            'requests_per_hour': 1000,
            'requests_per_day': 10000
        }
    
    def check_rate_limit(
        self,
        identifier: str,
        endpoint: str,
        method: str = "GET",
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Check if request should be rate limited
        
        Args:
            identifier: Unique identifier for rate limiting (IP, user_id, etc.)
            endpoint: API endpoint being accessed
            method: HTTP method
            user_id: User ID if authenticated
            ip_address: Client IP address
            user_agent: User agent string
            
        Returns:
            Tuple of (allowed, rate_limit_info)
        """
        if not self.redis:
            # Fallback when Redis is unavailable - allow all requests
            return True, {"status": "redis_unavailable"}
        
        try:
            # Get applicable rate limit rules
            rules = self._get_applicable_rules(endpoint, method, user_id is not None)
            
            if not rules:
                return True, {"status": "no_rules"}
            
            # Check each rule
            for rule in rules:
                allowed, info = self._check_rule(rule, identifier, endpoint, method)
                if not allowed:
                    # Log rate limit violation
                    self._log_violation(
                        rule_id=rule.id,
                        user_id=user_id,
                        ip_address=ip_address,
                        endpoint=endpoint,
                        method=method,
                        user_agent=user_agent,
                        time_window=info.get('window', 'unknown'),
                        violation_count=info.get('current_count', 0)
                    )
                    
                    return False, {
                        "status": "rate_limited",
                        "rule": rule.rule_name,
                        "limit": info.get('limit'),
                        "current": info.get('current_count'),
                        "reset_time": info.get('reset_time'),
                        "retry_after": info.get('retry_after')
                    }
            
            # All rules passed, increment counters
            for rule in rules:
                self._increment_counters(rule, identifier)
            
            return True, {"status": "allowed"}
            
        except Exception as e:
            logger.error(f"Rate limit check error: {str(e)}")
            # On error, allow the request but log the issue
            return True, {"status": "error", "error": str(e)}
    
    def _get_applicable_rules(
        self, 
        endpoint: str, 
        method: str, 
        is_authenticated: bool
    ) -> List[RateLimitRule]:
        """Get rate limit rules that apply to the current request"""
        import re
        
        rules = self.db.query(RateLimitRule).filter(
            RateLimitRule.is_enabled == True
        ).all()
        
        applicable_rules = []
        for rule in rules:
            # Check endpoint pattern match
            if not re.match(rule.endpoint_pattern, endpoint):
                continue
            
            # Check HTTP method
            if rule.method and rule.method.upper() != method.upper():
                continue
            
            # Check authentication requirements
            if not rule.applies_to_authenticated and is_authenticated:
                continue
            if not rule.applies_to_anonymous and not is_authenticated:
                continue
            
            applicable_rules.append(rule)
        
        return applicable_rules
    
    def _check_rule(
        self, 
        rule: RateLimitRule, 
        identifier: str, 
        endpoint: str, 
        method: str
    ) -> Tuple[bool, Dict[str, Any]]:
        """Check if a specific rule is violated"""
        current_time = int(time.time())
        
        # Check different time windows
        windows = [
            ('minute', 60, rule.limit_per_minute),
            ('hour', 3600, rule.limit_per_hour),
            ('day', 86400, rule.limit_per_day)
        ]
        
        for window_name, window_seconds, limit in windows:
            if limit <= 0:  # Skip disabled limits
                continue
            
            key = f"rate_limit:{rule.rule_name}:{identifier}:{window_name}"
            window_start = current_time - window_seconds
            
            # Use Redis sorted set for sliding window
            pipe = self.redis.pipeline()
            pipe.zremrangebyscore(key, 0, window_start)  # Remove old entries
            pipe.zcard(key)  # Count current entries
            pipe.expire(key, window_seconds)  # Set expiration
            results = pipe.execute()
            
            current_count = results[1]
            
            # Check burst limit
            if window_name == 'minute' and rule.burst_limit > 0:
                burst_key = f"burst:{rule.rule_name}:{identifier}"
                burst_count = self.redis.get(burst_key)
                if burst_count and int(burst_count) >= rule.burst_limit:
                    return False, {
                        'window': 'burst',
                        'limit': rule.burst_limit,
                        'current_count': int(burst_count),
                        'reset_time': current_time + 60,
                        'retry_after': 60
                    }
            
            if current_count >= limit:
                reset_time = current_time + window_seconds
                retry_after = window_seconds
                
                return False, {
                    'window': window_name,
                    'limit': limit,
                    'current_count': current_count,
                    'reset_time': reset_time,
                    'retry_after': retry_after
                }
        
        return True, {'status': 'passed'}
    
    def _increment_counters(self, rule: RateLimitRule, identifier: str):
        """Increment rate limit counters for a rule"""
        current_time = int(time.time())
        
        # Increment sliding window counters
        windows = ['minute', 'hour', 'day']
        pipe = self.redis.pipeline()
        
        for window in windows:
            key = f"rate_limit:{rule.rule_name}:{identifier}:{window}"
            pipe.zadd(key, {str(current_time): current_time})
            
            # Set expiration based on window
            if window == 'minute':
                pipe.expire(key, 60)
            elif window == 'hour':
                pipe.expire(key, 3600)
            else:  # day
                pipe.expire(key, 86400)
        
        # Increment burst counter
        if rule.burst_limit > 0:
            burst_key = f"burst:{rule.rule_name}:{identifier}"
            pipe.incr(burst_key)
            pipe.expire(burst_key, 60)  # Burst window is always 1 minute
        
        pipe.execute()
    
    def _log_violation(
        self,
        rule_id: str,
        user_id: Optional[str],
        ip_address: Optional[str],
        endpoint: str,
        method: str,
        user_agent: Optional[str],
        time_window: str,
        violation_count: int
    ):
        """Log rate limit violation to database"""
        try:
            # Create violation record
            violation = RateLimitViolation(
                rule_id=rule_id,
                user_id=user_id,
                ip_address=ip_address,
                endpoint=endpoint,
                method=method,
                user_agent=user_agent,
                violation_count=violation_count,
                time_window=time_window,
                expires_at=datetime.now(timezone.utc) + timedelta(days=7)  # Keep for 7 days
            )
            self.db.add(violation)
            
            # Log security event
            self.security_service.log_event(
                user_id=user_id,
                event_type=SecurityEventType.RATE_LIMIT_EXCEEDED.value,
                event_category="rate_limit",
                severity="medium",
                message=f"Rate limit exceeded for {endpoint}",
                ip_address=ip_address,
                user_agent=user_agent,
                endpoint=endpoint,
                method=method,
                event_metadata={
                    "rule_id": str(rule_id),
                    "time_window": time_window,
                    "violation_count": violation_count,
                    "endpoint": endpoint
                },
                risk_score=50 + min(violation_count * 5, 40)  # Escalating risk
            )
            
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Error logging rate limit violation: {str(e)}")
            self.db.rollback()
    
    def create_rule(
        self,
        rule_name: str,
        endpoint_pattern: str,
        method: Optional[str] = None,
        limit_per_minute: int = 60,
        limit_per_hour: int = 1000,
        limit_per_day: int = 10000,
        burst_limit: int = 10,
        applies_to_authenticated: bool = True,
        applies_to_anonymous: bool = True,
        whitelist_ips: Optional[List[str]] = None,
        blacklist_ips: Optional[List[str]] = None
    ) -> RateLimitRule:
        """Create a new rate limit rule"""
        rule = RateLimitRule(
            rule_name=rule_name,
            endpoint_pattern=endpoint_pattern,
            method=method,
            limit_per_minute=limit_per_minute,
            limit_per_hour=limit_per_hour,
            limit_per_day=limit_per_day,
            burst_limit=burst_limit,
            is_enabled=True,
            applies_to_authenticated=applies_to_authenticated,
            applies_to_anonymous=applies_to_anonymous,
            whitelist_ips=whitelist_ips or [],
            blacklist_ips=blacklist_ips or []
        )
        
        self.db.add(rule)
        self.db.commit()
        
        return rule
    
    def get_rate_limit_status(
        self, 
        rule_name: str, 
        identifier: str
    ) -> Dict[str, Any]:
        """Get current rate limit status for an identifier"""
        if not self.redis:
            return {"status": "redis_unavailable"}
        
        try:
            current_time = int(time.time())
            status = {}
            
            windows = [
                ('minute', 60),
                ('hour', 3600),
                ('day', 86400)
            ]
            
            for window_name, window_seconds in windows:
                key = f"rate_limit:{rule_name}:{identifier}:{window_name}"
                window_start = current_time - window_seconds
                
                # Clean up old entries and count current
                pipe = self.redis.pipeline()
                pipe.zremrangebyscore(key, 0, window_start)
                pipe.zcard(key)
                results = pipe.execute()
                
                status[f"{window_name}_count"] = results[1]
                status[f"{window_name}_reset_time"] = current_time + window_seconds
            
            return status
            
        except Exception as e:
            logger.error(f"Error getting rate limit status: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def reset_rate_limit(
        self, 
        rule_name: str, 
        identifier: str,
        admin_user_id: str,
        reason: str = "admin_reset"
    ) -> bool:
        """Reset rate limits for a specific identifier (admin function)"""
        if not self.redis:
            return False
        
        try:
            # Remove all rate limit keys for this identifier
            pattern = f"rate_limit:{rule_name}:{identifier}:*"
            keys = self.redis.keys(pattern)
            
            if keys:
                self.redis.delete(*keys)
            
            # Remove burst limit
            burst_key = f"burst:{rule_name}:{identifier}"
            self.redis.delete(burst_key)
            
            # Log admin action
            self.security_service.log_event(
                event_type="rate_limit_reset",
                event_category="admin",
                severity="info",
                message=f"Rate limits reset for {identifier}",
                event_metadata={
                    "admin_user_id": admin_user_id,
                    "rule_name": rule_name,
                    "identifier": identifier,
                    "reason": reason
                },
                risk_score=5  # Low risk admin action
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error resetting rate limits: {str(e)}")
            return False
    
    def get_violations_summary(
        self, 
        hours_back: int = 24,
        limit: int = 100
    ) -> Dict[str, Any]:
        """Get summary of rate limit violations"""
        from sqlalchemy import func
        
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        
        # Total violations
        total_violations = self.db.query(RateLimitViolation).filter(
            RateLimitViolation.created_at >= cutoff_time
        ).count()
        
        # Violations by endpoint
        endpoint_violations = self.db.query(
            RateLimitViolation.endpoint,
            func.count(RateLimitViolation.id).label('count')
        ).filter(
            RateLimitViolation.created_at >= cutoff_time
        ).group_by(RateLimitViolation.endpoint).order_by(
            desc('count')
        ).limit(10).all()
        
        # Violations by IP
        ip_violations = self.db.query(
            RateLimitViolation.ip_address,
            func.count(RateLimitViolation.id).label('count')
        ).filter(
            RateLimitViolation.created_at >= cutoff_time
        ).group_by(RateLimitViolation.ip_address).order_by(
            desc('count')
        ).limit(10).all()
        
        # Recent violations
        recent_violations = self.db.query(RateLimitViolation).filter(
            RateLimitViolation.created_at >= cutoff_time
        ).order_by(desc(RateLimitViolation.created_at)).limit(limit).all()
        
        return {
            "total_violations": total_violations,
            "hours_analyzed": hours_back,
            "top_endpoints": [
                {"endpoint": row.endpoint, "violations": row.count}
                for row in endpoint_violations
            ],
            "top_ips": [
                {"ip": row.ip_address, "violations": row.count}
                for row in ip_violations
            ],
            "recent_violations": [
                {
                    "id": str(v.id),
                    "endpoint": v.endpoint,
                    "ip_address": v.ip_address,
                    "method": v.method,
                    "time_window": v.time_window,
                    "violation_count": v.violation_count,
                    "created_at": v.created_at.isoformat()
                }
                for v in recent_violations
            ]
        }
    
    def cleanup_old_violations(self, days_to_keep: int = 7) -> int:
        """Clean up old rate limit violations"""
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_to_keep)
        
        deleted_count = self.db.query(RateLimitViolation).filter(
            RateLimitViolation.created_at < cutoff_date
        ).delete(synchronize_session=False)
        
        self.db.commit()
        
        logger.info(f"Cleaned up {deleted_count} old rate limit violations")
        return deleted_count
