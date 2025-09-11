"""
Advanced Security Service providing comprehensive threat detection,
risk assessment, rate limiting, fraud detection, and audit logging.
"""

import asyncio
import json
import logging
import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from collections import defaultdict, deque
import ipaddress

try:
    import redis
    import geoip2.database
    import geoip2.errors
    OPTIONAL_DEPS_AVAILABLE = True
except ImportError:
    redis = None
    geoip2 = None
    OPTIONAL_DEPS_AVAILABLE = False

from sqlalchemy.orm import Session
from app.schemas.security import (
    SecurityEvent, SecurityThreat, RiskAssessment, AuditLogEntry,
    SecurityMetrics, IPIntelligence, UserRiskProfile, TransactionRisk,
    SecurityAlert, RateLimitStatus, ThreatType, RiskLevel, SecurityEventStatus
)

logger = logging.getLogger(__name__)


class SecurityService:
    """
    Advanced security service providing threat detection, risk assessment,
    rate limiting, fraud detection, IP intelligence, and audit logging.
    """
    
    def __init__(
        self,
        redis_client: Optional[redis.Redis] = None,
        geoip_db_path: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None
    ):
        self.redis_client = redis_client
        self.geoip_reader = None
        self.config = config or self._get_default_config()
        
        # Initialize GeoIP database if available
        if geoip_db_path and geoip2:
            try:
                self.geoip_reader = geoip2.database.Reader(geoip_db_path)
                logger.info("GeoIP database initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize GeoIP database: {e}")
        
        # In-memory storage for when Redis is not available
        self._memory_store = {
            'rate_limits': defaultdict(dict),
            'security_events': deque(maxlen=10000),
            'ip_cache': {},
            'user_sessions': defaultdict(list),
            'alerts': deque(maxlen=1000)
        }
        
        # Threat detection patterns
        self._threat_patterns = self._initialize_threat_patterns()
        
        logger.info("SecurityService initialized")
    
    async def assess_user_risk(self, user_id: int, request_data: Dict[str, Any]) -> RiskAssessment:
        """
        Comprehensive risk assessment for user actions
        """
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return RiskAssessment(
                    risk_score=1.0,
                    risk_level="critical",
                    factors=["user_not_found"],
                    recommended_actions=["block_request"]
                )
            
            risk_factors = []
            risk_score = 0.0
            
            # IP-based risk assessment
            ip_risk = await self._assess_ip_risk(request_data.get('client_ip'))
            risk_score += ip_risk.risk_score * 0.3
            risk_factors.extend(ip_risk.risk_factors)
            
            # User behavior analysis
            behavior_risk = await self._assess_user_behavior(user_id, request_data)
            risk_score += behavior_risk * 0.4
            
            # Transaction pattern analysis
            if 'transaction_amount' in request_data:
                transaction_risk = await self._assess_transaction_risk(user_id, request_data)
                risk_score += transaction_risk * 0.3
                
            # Device and session analysis
            device_risk = await self._assess_device_risk(user_id, request_data)
            risk_score += device_risk * 0.2
            
            # Determine risk level
            if risk_score >= 0.8:
                risk_level = "critical"
                recommended_actions = ["block_request", "require_manual_review"]
            elif risk_score >= 0.6:
                risk_level = "high"
                recommended_actions = ["require_additional_verification", "limit_actions"]
            elif risk_score >= 0.4:
                risk_level = "medium"
                recommended_actions = ["increase_monitoring", "require_2fa"]
            else:
                risk_level = "low"
                recommended_actions = ["allow"]
            
            assessment = RiskAssessment(
                user_id=user_id,
                risk_score=min(risk_score, 1.0),
                risk_level=risk_level,
                factors=risk_factors,
                recommended_actions=recommended_actions,
                assessed_at=datetime.utcnow()
            )
            
            # Cache assessment
            if self.redis:
                cache_key = f"risk_assessment:{user_id}"
                self.redis.setex(cache_key, 300, assessment.json())  # 5 min cache
            
            return assessment
            
        except Exception as e:
            logger.error(f"Error in risk assessment for user {user_id}: {e}")
            return RiskAssessment(
                risk_score=0.5,
                risk_level="medium",
                factors=["assessment_error"],
                recommended_actions=["manual_review"]
            )
    
    async def detect_fraud_patterns(self, user_id: int, action: str, data: Dict[str, Any]) -> bool:
        """
        Advanced fraud pattern detection using multiple signals
        """
        try:
            fraud_indicators = []
            
            # Velocity checks
            if await self._check_velocity_abuse(user_id, action):
                fraud_indicators.append("velocity_abuse")
            
            # Pattern anomalies
            if await self._detect_behavioral_anomalies(user_id, action, data):
                fraud_indicators.append("behavioral_anomaly")
            
            # Geographic inconsistencies
            if await self._detect_geographic_anomalies(user_id, data.get('client_ip')):
                fraud_indicators.append("geographic_anomaly")
            
            # Financial red flags
            if action in ['payment', 'withdrawal', 'transfer']:
                if await self._detect_financial_anomalies(user_id, data):
                    fraud_indicators.append("financial_anomaly")
            
            # Account takeover indicators
            if await self._detect_account_takeover_signs(user_id, data):
                fraud_indicators.append("account_takeover")
            
            # Multiple indicators suggest fraud
            is_fraudulent = len(fraud_indicators) >= 2
            
            if is_fraudulent:
                await self._create_security_alert(
                    user_id=user_id,
                    alert_type="fraud_detected",
                    severity="high",
                    details={
                        "action": action,
                        "indicators": fraud_indicators,
                        "data": data
                    }
                )
            
            return is_fraudulent
            
        except Exception as e:
            logger.error(f"Error in fraud detection for user {user_id}: {e}")
            return False
    
    async def check_rate_limits(self, identifier: str, endpoint: str, limit: int = None) -> Tuple[bool, Dict[str, Any]]:
        """
        Advanced rate limiting with multiple strategies
        """
        try:
            if not self.redis:
                return True, {"allowed": True, "remaining": limit or 1000}
            
            limit = limit or self.max_api_requests_per_hour
            window = self.rate_limit_window
            now = int(time.time())
            
            # Sliding window rate limiting
            pipe = self.redis.pipeline()
            key = f"rate_limit:{identifier}:{endpoint}"
            
            # Remove old entries
            pipe.zremrangebyscore(key, 0, now - window)
            
            # Count current requests
            pipe.zcard(key)
            
            # Add current request
            pipe.zadd(key, {str(now): now})
            pipe.expire(key, window)
            
            results = pipe.execute()
            current_count = results[1]
            
            allowed = current_count < limit
            remaining = max(0, limit - current_count - 1)
            
            # Enhanced rate limiting for suspicious behavior
            if not allowed:
                # Check for burst patterns
                recent_requests = self.redis.zrangebyscore(
                    key, now - 60, now  # Last minute
                )
                if len(recent_requests) > limit * 0.1:  # More than 10% of hourly limit in 1 minute
                    await self._create_security_alert(
                        identifier=identifier,
                        alert_type="rate_limit_abuse",
                        severity="medium",
                        details={
                            "endpoint": endpoint,
                            "requests_per_minute": len(recent_requests),
                            "hourly_limit": limit
                        }
                    )
            
            return allowed, {
                "allowed": allowed,
                "remaining": remaining,
                "reset_time": now + window,
                "retry_after": 60 if not allowed else 0
            }
            
        except Exception as e:
            logger.error(f"Error in rate limiting check: {e}")
            return True, {"allowed": True, "remaining": 1000}
    
    async def analyze_ip_intelligence(self, ip_address: str) -> IPIntelligence:
        """
        Comprehensive IP intelligence gathering
        """
        try:
            cache_key = f"ip_intel:{ip_address}"
            
            # Check cache first
            if self.redis:
                cached = self.redis.get(cache_key)
                if cached:
                    return IPIntelligence.parse_raw(cached)
            
            intel = IPIntelligence(ip_address=ip_address)
            
            # GeoIP lookup
            if self.geoip_reader:
                try:
                    response = self.geoip_reader.city(ip_address)
                    intel.country = response.country.iso_code
                    intel.city = response.city.name
                    intel.latitude = float(response.location.latitude) if response.location.latitude else None
                    intel.longitude = float(response.location.longitude) if response.location.longitude else None
                    intel.isp = response.traits.isp
                except Exception as e:
                    logger.warning(f"GeoIP lookup failed for {ip_address}: {e}")
            
            # Check against threat feeds
            intel.is_tor = await self._check_tor_exit_node(ip_address)
            intel.is_vpn = await self._check_vpn_provider(ip_address)
            intel.is_malicious = await self._check_threat_feeds(ip_address)
            
            # Reputation scoring
            intel.reputation_score = await self._calculate_ip_reputation(ip_address)
            
            # Risk assessment
            risk_factors = []
            if intel.is_tor:
                risk_factors.append("tor_exit_node")
            if intel.is_vpn:
                risk_factors.append("vpn_provider")
            if intel.is_malicious:
                risk_factors.append("threat_feed_match")
            if intel.reputation_score < 0.3:
                risk_factors.append("low_reputation")
            
            intel.risk_factors = risk_factors
            intel.risk_score = len(risk_factors) * 0.25
            
            # Cache results
            if self.redis:
                self.redis.setex(cache_key, self.threat_cache_ttl, intel.json())
            
            return intel
            
        except Exception as e:
            logger.error(f"Error in IP intelligence analysis for {ip_address}: {e}")
            return IPIntelligence(ip_address=ip_address, risk_score=0.5)
    
    async def create_audit_log(self, event: AuditLogEntry) -> None:
        """
        Create comprehensive audit log entries
        """
        try:
            # Enhance event data
            event.timestamp = event.timestamp or datetime.utcnow()
            event.event_id = event.event_id or self._generate_event_id()
            
            # Store in database
            # This would typically use a dedicated audit log table
            logger.info(f"AUDIT: {event.json()}")
            
            # Store in Redis for real-time analysis
            if self.redis:
                key = f"audit_log:{event.timestamp.strftime('%Y-%m-%d')}"
                self.redis.lpush(key, event.json())
                self.redis.expire(key, 86400 * 30)  # 30 days retention
            
            # Check for suspicious patterns in audit logs
            await self._analyze_audit_patterns(event)
            
        except Exception as e:
            logger.error(f"Error creating audit log: {e}")
    
    async def get_security_metrics(self, period: str = "24h") -> SecurityMetrics:
        """
        Generate comprehensive security metrics
        """
        try:
            end_time = datetime.utcnow()
            
            if period == "24h":
                start_time = end_time - timedelta(hours=24)
            elif period == "7d":
                start_time = end_time - timedelta(days=7)
            elif period == "30d":
                start_time = end_time - timedelta(days=30)
            else:
                start_time = end_time - timedelta(hours=24)
            
            # Calculate various security metrics
            metrics = SecurityMetrics(
                period=period,
                total_requests=await self._count_total_requests(start_time, end_time),
                blocked_requests=await self._count_blocked_requests(start_time, end_time),
                suspicious_activities=await self._count_suspicious_activities(start_time, end_time),
                fraud_attempts=await self._count_fraud_attempts(start_time, end_time),
                successful_attacks=await self._count_successful_attacks(start_time, end_time),
                countries_blocked=await self._count_blocked_countries(start_time, end_time),
                top_threat_types=await self._get_top_threat_types(start_time, end_time),
                security_score=await self._calculate_security_score(),
                generated_at=end_time
            )
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error generating security metrics: {e}")
            return SecurityMetrics(period=period, generated_at=datetime.utcnow())
    
    # Private helper methods
    
    async def _assess_ip_risk(self, ip_addr: str) -> IPIntelligence:
        """Assess risk associated with IP address"""
        if not ip_addr:
            return IPIntelligence(ip_address="", risk_score=0.0)
        
        return await self.analyze_ip_intelligence(ip_addr)
    
    async def _assess_user_behavior(self, user_id: int, request_data: Dict[str, Any]) -> float:
        """Analyze user behavior patterns for risk"""
        risk_score = 0.0
        
        # Check login patterns
        if await self._has_unusual_login_pattern(user_id):
            risk_score += 0.3
        
        # Check activity patterns
        if await self._has_unusual_activity_pattern(user_id):
            risk_score += 0.2
        
        # Check session behavior
        if await self._has_unusual_session_behavior(user_id, request_data):
            risk_score += 0.1
        
        return min(risk_score, 1.0)
    
    async def _assess_transaction_risk(self, user_id: int, request_data: Dict[str, Any]) -> float:
        """Assess transaction-specific risks"""
        risk_score = 0.0
        
        amount = request_data.get('transaction_amount', 0)
        
        # Large transaction risk
        if amount > self.suspicious_transaction_threshold:
            risk_score += 0.4
        
        # Velocity risk
        if await self._check_transaction_velocity(user_id, amount):
            risk_score += 0.3
        
        # Pattern risk
        if await self._check_transaction_patterns(user_id, request_data):
            risk_score += 0.3
        
        return min(risk_score, 1.0)
    
    async def _assess_device_risk(self, user_id: int, request_data: Dict[str, Any]) -> float:
        """Assess device and session risks"""
        risk_score = 0.0
        
        user_agent = request_data.get('user_agent', '')
        
        # Parse user agent
        if user_agent:
            parsed_ua = parse(user_agent)
            
            # Check for automation tools
            if any(bot in user_agent.lower() for bot in ['bot', 'crawler', 'spider', 'scraper']):
                risk_score += 0.5
            
            # Check for suspicious browsers
            if parsed_ua.browser.family in ['Other', 'Unknown']:
                risk_score += 0.2
        
        # Check device fingerprinting
        if await self._check_device_fingerprint(user_id, request_data):
            risk_score += 0.3
        
        return min(risk_score, 1.0)
    
    async def _check_velocity_abuse(self, user_id: int, action: str) -> bool:
        """Check for velocity abuse patterns"""
        if not self.redis:
            return False
        
        key = f"velocity:{user_id}:{action}"
        current_count = self.redis.incr(key)
        
        if current_count == 1:
            self.redis.expire(key, self.velocity_check_window)
        
        # Define velocity limits per action
        limits = {
            'login': 5,
            'password_reset': 3,
            'project_creation': 10,
            'payment': 5,
            'message': 50
        }
        
        limit = limits.get(action, 20)
        return current_count > limit
    
    async def _detect_behavioral_anomalies(self, user_id: int, action: str, data: Dict[str, Any]) -> bool:
        """Detect behavioral anomalies using ML models"""
        # This would use machine learning models to detect anomalies
        # For now, implement rule-based detection
        
        # Time-based anomalies
        now = datetime.utcnow().hour
        if now < 6 or now > 23:  # Late night activity
            return True
        
        # Frequency anomalies would be detected here
        return False
    
    async def _detect_geographic_anomalies(self, user_id: int, ip_address: str) -> bool:
        """Detect geographic inconsistencies"""
        if not ip_address or not self.redis:
            return False
        
        # Get previous locations for user
        prev_locations_key = f"user_locations:{user_id}"
        previous_ips = self.redis.lrange(prev_locations_key, 0, 10)
        
        if not previous_ips:
            # First time, store location
            self.redis.lpush(prev_locations_key, ip_address)
            self.redis.ltrim(prev_locations_key, 0, 10)
            self.redis.expire(prev_locations_key, 86400 * 30)
            return False
        
        # Check if current IP is from significantly different location
        current_intel = await self.analyze_ip_intelligence(ip_address)
        
        for prev_ip in previous_ips:
            if isinstance(prev_ip, bytes):
                prev_ip = prev_ip.decode()
            
            if prev_ip == ip_address:
                return False  # Same IP, no anomaly
            
            prev_intel = await self.analyze_ip_intelligence(prev_ip)
            
            # If countries differ significantly, flag as anomaly
            if (current_intel.country and prev_intel.country and 
                current_intel.country != prev_intel.country):
                return True
        
        return False
    
    async def _detect_financial_anomalies(self, user_id: int, data: Dict[str, Any]) -> bool:
        """Detect financial transaction anomalies"""
        amount = data.get('transaction_amount', 0)
        
        # Get user's transaction history
        # This would query actual transaction data
        avg_transaction = Decimal('1000')  # Placeholder
        
        # Anomaly if transaction is 10x larger than average
        if amount > avg_transaction * 10:
            return True
        
        return False
    
    async def _detect_account_takeover_signs(self, user_id: int, data: Dict[str, Any]) -> bool:
        """Detect signs of account takeover"""
        indicators = []
        
        # Password changes from new locations
        if data.get('action') == 'password_change':
            if await self._detect_geographic_anomalies(user_id, data.get('client_ip')):
                indicators.append('password_change_new_location')
        
        # Multiple failed logins followed by success
        if data.get('action') == 'login_success':
            if await self._has_recent_failed_logins(user_id):
                indicators.append('success_after_failures')
        
        return len(indicators) > 0
    
    async def _check_tor_exit_node(self, ip_address: str) -> bool:
        """Check if IP is a Tor exit node"""
        # This would check against Tor exit node lists
        return False
    
    async def _check_vpn_provider(self, ip_address: str) -> bool:
        """Check if IP belongs to VPN provider"""
        # This would check against VPN provider IP ranges
        return False
    
    async def _check_threat_feeds(self, ip_address: str) -> bool:
        """Check IP against threat intelligence feeds"""
        # This would check against various threat feeds
        return False
    
    async def _calculate_ip_reputation(self, ip_address: str) -> float:
        """Calculate IP reputation score"""
        # This would use multiple reputation sources
        return 0.8  # Placeholder
    
    def _generate_event_id(self) -> str:
        """Generate unique event ID"""
        return hashlib.sha256(
            f"{datetime.utcnow().isoformat()}{time.time()}".encode()
        ).hexdigest()[:16]
    
    async def _create_security_alert(self, **kwargs) -> None:
        """Create security alert"""
        alert = SecurityAlert(
            alert_id=self._generate_event_id(),
            **kwargs,
            created_at=datetime.utcnow()
        )
        
        logger.warning(f"SECURITY ALERT: {alert.json()}")
        
        if self.redis:
            self.redis.lpush("security_alerts", alert.json())
    
    # Metrics helper methods
    
    async def _count_total_requests(self, start_time: datetime, end_time: datetime) -> int:
        """Count total requests in period"""
        return 10000  # Placeholder
    
    async def _count_blocked_requests(self, start_time: datetime, end_time: datetime) -> int:
        """Count blocked requests in period"""
        return 150  # Placeholder
    
    async def _count_suspicious_activities(self, start_time: datetime, end_time: datetime) -> int:
        """Count suspicious activities in period"""
        return 45  # Placeholder
    
    async def _count_fraud_attempts(self, start_time: datetime, end_time: datetime) -> int:
        """Count fraud attempts in period"""
        return 12  # Placeholder
    
    async def _count_successful_attacks(self, start_time: datetime, end_time: datetime) -> int:
        """Count successful attacks in period"""
        return 2  # Placeholder
    
    async def _count_blocked_countries(self, start_time: datetime, end_time: datetime) -> int:
        """Count number of countries with blocked requests"""
        return 8  # Placeholder
    
    async def _get_top_threat_types(self, start_time: datetime, end_time: datetime) -> List[str]:
        """Get top threat types in period"""
        return ["rate_limit_abuse", "fraud_attempt", "account_takeover", "bot_traffic"]
    
    async def _calculate_security_score(self) -> float:
        """Calculate overall security score"""
        return 85.7  # Placeholder
    
    # Additional placeholder methods
    
    async def _has_unusual_login_pattern(self, user_id: int) -> bool:
        return False
    
    async def _has_unusual_activity_pattern(self, user_id: int) -> bool:
        return False
    
    async def _has_unusual_session_behavior(self, user_id: int, request_data: Dict[str, Any]) -> bool:
        return False
    
    async def _check_transaction_velocity(self, user_id: int, amount: Any) -> bool:
        return False
    
    async def _check_transaction_patterns(self, user_id: int, request_data: Dict[str, Any]) -> bool:
        return False
    
    async def _check_device_fingerprint(self, user_id: int, request_data: Dict[str, Any]) -> bool:
        return False
    
    async def _has_recent_failed_logins(self, user_id: int) -> bool:
        return False
    
    async def _analyze_audit_patterns(self, event: AuditLogEntry) -> None:
        pass


def get_security_service(db: Session) -> SecurityService:
    """Get security service instance"""
    redis_client = None
    if settings.REDIS_HOST:
        try:
            redis_client = Redis.from_url(settings.REDIS_HOST)
        except Exception as e:
            logger.warning(f"Could not connect to Redis: {e}")
    
    return SecurityService(db, redis_client)
