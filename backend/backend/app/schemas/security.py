"""
Security-related Pydantic schemas for threat detection, risk assessment, 
and audit logging functionality.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from enum import Enum
from decimal import Decimal
from pydantic import BaseModel, validator, Field


class ThreatType(str, Enum):
    """Types of security threats"""
    BRUTE_FORCE = "brute_force"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    SUSPICIOUS_LOGIN = "suspicious_login"
    FRAUD_ATTEMPT = "fraud_attempt"
    MALICIOUS_IP = "malicious_ip"
    ACCOUNT_TAKEOVER = "account_takeover"
    PAYMENT_FRAUD = "payment_fraud"
    DATA_BREACH_ATTEMPT = "data_breach_attempt"
    UNUSUAL_ACTIVITY = "unusual_activity"


class RiskLevel(str, Enum):
    """Risk severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SecurityEventStatus(str, Enum):
    """Status of security events"""
    ACTIVE = "active"
    RESOLVED = "resolved"
    INVESTIGATING = "investigating"
    FALSE_POSITIVE = "false_positive"


class SecurityEvent(BaseModel):
    """Security event data structure"""
    id: Optional[str] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    ip_address: str
    user_agent: Optional[str] = None
    threat_type: ThreatType
    risk_level: RiskLevel
    status: SecurityEventStatus = SecurityEventStatus.ACTIVE
    description: str
    metadata: Dict[str, Any] = {}
    detected_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    
    class Config:
        use_enum_values = True


class SecurityThreat(BaseModel):
    """Security threat assessment"""
    threat_type: ThreatType
    risk_score: float = Field(ge=0.0, le=100.0, description="Risk score from 0-100")
    risk_level: RiskLevel
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence level 0-1")
    indicators: List[str] = []
    mitigations: List[str] = []
    metadata: Dict[str, Any] = {}
    
    class Config:
        use_enum_values = True


class IPIntelligence(BaseModel):
    """IP address intelligence data"""
    ip_address: str
    country: Optional[str] = None
    city: Optional[str] = None
    is_proxy: bool = False
    is_vpn: bool = False
    is_tor: bool = False
    is_malicious: bool = False
    reputation_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    asn: Optional[str] = None
    isp: Optional[str] = None
    threat_types: List[str] = []
    last_seen: Optional[datetime] = None
    
    @validator('reputation_score')
    def validate_reputation_score(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError('Reputation score must be between 0 and 100')
        return v


class UserRiskProfile(BaseModel):
    """User risk assessment profile"""
    user_id: str
    overall_risk_score: float = Field(ge=0.0, le=100.0)
    risk_level: RiskLevel
    login_patterns: Dict[str, Any] = {}
    transaction_patterns: Dict[str, Any] = {}
    behavioral_flags: List[str] = []
    recent_events: List[SecurityEvent] = []
    last_assessment: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        use_enum_values = True


class TransactionRisk(BaseModel):
    """Transaction risk assessment"""
    transaction_id: Optional[str] = None
    user_id: str
    amount: Decimal
    currency: str
    transaction_type: str
    risk_score: float = Field(ge=0.0, le=100.0)
    risk_level: RiskLevel
    fraud_indicators: List[str] = []
    velocity_check: Dict[str, Any] = {}
    device_fingerprint: Optional[Dict[str, Any]] = None
    geo_location: Optional[Dict[str, str]] = None
    recommended_action: str  # approve, decline, manual_review
    
    class Config:
        use_enum_values = True


class RiskAssessment(BaseModel):
    """Comprehensive risk assessment"""
    assessment_id: Optional[str] = None
    user_id: Optional[str] = None
    ip_address: str
    overall_risk_score: float = Field(ge=0.0, le=100.0)
    risk_level: RiskLevel
    threats: List[SecurityThreat] = []
    user_risk: Optional[UserRiskProfile] = None
    ip_intelligence: Optional[IPIntelligence] = None
    transaction_risk: Optional[TransactionRisk] = None
    recommendations: List[str] = []
    assessed_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        use_enum_values = True


class AuditLogEntry(BaseModel):
    """Audit log entry for security events"""
    id: Optional[str] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    ip_address: str
    user_agent: Optional[str] = None
    action: str
    resource: Optional[str] = None
    details: Dict[str, Any] = {}
    status: str  # success, failure, blocked
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    risk_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    
    @validator('risk_score')
    def validate_risk_score(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError('Risk score must be between 0 and 100')
        return v


class SecurityAlert(BaseModel):
    """Security alert notification"""
    id: Optional[str] = None
    alert_type: ThreatType
    severity: RiskLevel
    title: str
    description: str
    user_id: Optional[str] = None
    ip_address: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    
    class Config:
        use_enum_values = True


class SecurityMetrics(BaseModel):
    """Security metrics and statistics"""
    time_period: str  # e.g., "24h", "7d", "30d"
    total_events: int = 0
    events_by_type: Dict[str, int] = {}
    events_by_risk_level: Dict[str, int] = {}
    blocked_attempts: int = 0
    false_positives: int = 0
    detection_rate: Optional[float] = Field(None, ge=0.0, le=1.0)
    response_time_avg: Optional[float] = None  # in seconds
    top_threat_ips: List[Dict[str, Union[str, int]]] = []
    top_targeted_users: List[Dict[str, Union[str, int]]] = []
    geographic_distribution: Dict[str, int] = {}
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('detection_rate')
    def validate_detection_rate(cls, v):
        if v is not None and (v < 0 or v > 1):
            raise ValueError('Detection rate must be between 0 and 1')
        return v


class RateLimitStatus(BaseModel):
    """Rate limiting status for a user/IP"""
    identifier: str  # user_id or ip_address
    limit_type: str  # "user" or "ip"
    current_count: int
    limit: int
    window_start: datetime
    window_duration: int  # in seconds
    blocked: bool = False
    reset_at: datetime
    
    @property
    def remaining(self) -> int:
        return max(0, self.limit - self.current_count)
    
    @property
    def blocked_until(self) -> Optional[datetime]:
        return self.reset_at if self.blocked else None


class SecurityConfig(BaseModel):
    """Security service configuration"""
    rate_limits: Dict[str, Dict[str, int]] = {
        "login": {"requests": 5, "window": 300},  # 5 requests per 5 minutes
        "api": {"requests": 100, "window": 60},   # 100 requests per minute
        "payment": {"requests": 10, "window": 300} # 10 payment requests per 5 minutes
    }
    fraud_thresholds: Dict[str, float] = {
        "transaction_velocity": 0.8,
        "device_risk": 0.7,
        "location_risk": 0.6
    }
    ip_whitelist: List[str] = []
    ip_blacklist: List[str] = []
    enable_geoip: bool = True
    enable_device_fingerprinting: bool = True
    audit_retention_days: int = 90
    alert_thresholds: Dict[str, int] = {
        "high_risk_events_per_hour": 10,
        "failed_logins_per_user": 5,
        "suspicious_ips_per_hour": 20
    }


# Request/Response models for API endpoints

class AssessRiskRequest(BaseModel):
    """Request model for risk assessment"""
    user_id: Optional[str] = None
    ip_address: str
    user_agent: Optional[str] = None
    session_id: Optional[str] = None
    action: str  # login, payment, api_call, etc.
    metadata: Dict[str, Any] = {}


class AssessRiskResponse(BaseModel):
    """Response model for risk assessment"""
    assessment: RiskAssessment
    action_required: bool
    recommended_actions: List[str]
    block_request: bool = False


class AuditLogRequest(BaseModel):
    """Request model for audit logging"""
    user_id: Optional[str] = None
    action: str
    resource: Optional[str] = None
    details: Dict[str, Any] = {}
    status: str = "success"


class SecurityMetricsResponse(BaseModel):
    """Response model for security metrics"""
    metrics: SecurityMetrics
    alerts: List[SecurityAlert]
    recent_events: List[SecurityEvent]


class SecurityAlertsResponse(BaseModel):
    """Response model for security alerts"""
    alerts: List[SecurityAlert]
    total_count: int
    unacknowledged_count: int
    critical_count: int
