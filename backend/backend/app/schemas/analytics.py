"""
Analytics Schemas
Pydantic models for analytics data structures
"""

from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field
from enum import Enum


class TrendDirection(str, Enum):
    """Trend direction indicators"""
    INCREASING = "increasing"
    DECREASING = "decreasing" 
    STABLE = "stable"
    VOLATILE = "volatile"


class TimePeriod(str, Enum):
    """Standard time periods for analytics"""
    HOUR_24 = "24h"
    DAYS_7 = "7d"
    DAYS_30 = "30d"
    DAYS_90 = "90d"
    YEAR_1 = "1y"


class UserSegment(str, Enum):
    """User segment types"""
    ALL = "all"
    CLIENTS = "clients"
    FREELANCERS = "freelancers"
    ADMINS = "admins"


class TrendAnalysis(BaseModel):
    """Trend analysis for various metrics"""
    user_growth_trend: TrendDirection
    project_volume_trend: TrendDirection
    revenue_trend: TrendDirection
    quality_trend: TrendDirection
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)


class PlatformMetrics(BaseModel):
    """Comprehensive platform-wide metrics"""
    # User metrics
    total_users: int = Field(..., ge=0)
    active_users: int = Field(..., ge=0)
    verified_users: int = Field(..., ge=0)
    user_growth_rate: float = Field(..., description="Percentage growth rate")
    
    # Project metrics
    total_projects: int = Field(..., ge=0)
    active_projects: int = Field(..., ge=0)
    completed_projects: int = Field(..., ge=0)
    project_success_rate: float = Field(..., ge=0.0, le=100.0)
    
    # Financial metrics
    total_volume: Decimal = Field(..., ge=0)
    period_volume: Decimal = Field(..., ge=0)
    platform_fee_revenue: Decimal = Field(..., ge=0)
    
    # Engagement metrics
    total_bids: int = Field(..., ge=0)
    period_bids: int = Field(..., ge=0)
    average_rating: float = Field(..., ge=0.0, le=5.0)
    
    # Metadata
    period: str
    trends: Optional[TrendAnalysis] = None
    generated_at: datetime


class FinancialMetrics(BaseModel):
    """Detailed financial analytics"""
    # Revenue metrics
    gross_revenue: Decimal = Field(..., ge=0)
    platform_revenue: Decimal = Field(..., ge=0)
    net_revenue: Optional[Decimal] = Field(None, ge=0)
    
    # Transaction metrics
    total_transactions: int = Field(..., ge=0)
    avg_transaction_value: Decimal = Field(..., ge=0)
    transaction_volume: Optional[Decimal] = Field(None, ge=0)
    
    # Escrow metrics
    active_escrow_count: int = Field(..., ge=0)
    active_escrow_volume: Decimal = Field(..., ge=0)
    
    # Distribution metrics
    payment_method_distribution: Dict[str, int] = Field(default_factory=dict)
    geographic_revenue_distribution: Dict[str, Decimal] = Field(default_factory=dict)
    category_revenue_distribution: Optional[Dict[str, Decimal]] = Field(default_factory=dict)
    
    # Growth metrics
    revenue_growth_rate: Optional[float] = None
    transaction_growth_rate: Optional[float] = None
    
    # Metadata
    currency: str = "USD"
    period: str
    generated_at: datetime


class UserLifecycleStage(BaseModel):
    """User lifecycle stage metrics"""
    stage_name: str
    user_count: int = Field(..., ge=0)
    percentage: float = Field(..., ge=0.0, le=100.0)
    avg_value: Optional[Decimal] = None


class UserAnalytics(BaseModel):
    """Comprehensive user behavior analytics"""
    # Basic metrics
    total_users: int = Field(..., ge=0)
    new_users: int = Field(..., ge=0)
    active_users: int = Field(..., ge=0)
    
    # Engagement metrics
    retention_rate: float = Field(..., ge=0.0, le=100.0)
    churn_rate: float = Field(..., ge=0.0, le=100.0)
    engagement_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    
    # Lifecycle analysis
    lifecycle_stages: Dict[str, int] = Field(default_factory=dict)
    
    # Geographic distribution
    geographic_distribution: Dict[str, int] = Field(default_factory=dict)
    
    # Skill analysis (for freelancers)
    skill_distribution: Optional[Dict[str, int]] = Field(default_factory=dict)
    
    # Behavioral metrics
    avg_session_duration: Optional[float] = None  # minutes
    avg_projects_per_user: Optional[float] = None
    avg_bids_per_freelancer: Optional[float] = None
    
    # Metadata
    segment: UserSegment
    period: str
    generated_at: datetime


class CategoryMetrics(BaseModel):
    """Performance metrics for a project category"""
    category_name: str
    project_count: int = Field(..., ge=0)
    success_rate: float = Field(..., ge=0.0, le=100.0)
    avg_budget: Decimal = Field(..., ge=0)
    avg_completion_time: float = Field(..., ge=0)  # days
    avg_bids: float = Field(..., ge=0)
    total_revenue: Decimal = Field(..., ge=0)


class ProjectAnalytics(BaseModel):
    """Comprehensive project performance analytics"""
    # Basic metrics
    total_projects: int = Field(..., ge=0)
    completed_projects: int = Field(..., ge=0)
    active_projects: int = Field(..., ge=0)
    cancelled_projects: int = Field(..., ge=0)
    
    # Performance metrics
    success_rate: float = Field(..., ge=0.0, le=100.0)
    avg_completion_time_days: float = Field(..., ge=0)
    avg_bids_per_project: float = Field(..., ge=0)
    
    # Financial metrics
    avg_project_value: Optional[Decimal] = Field(None, ge=0)
    total_project_value: Optional[Decimal] = Field(None, ge=0)
    
    # Distribution metrics
    budget_distribution: Dict[str, int] = Field(default_factory=dict)
    category_performance: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    duration_distribution: Optional[Dict[str, int]] = Field(default_factory=dict)
    
    # Quality metrics
    avg_client_satisfaction: Optional[float] = Field(None, ge=0.0, le=5.0)
    dispute_rate: Optional[float] = Field(None, ge=0.0, le=100.0)
    
    # Metadata
    category: Optional[str] = None
    period: str
    generated_at: datetime


class GeographicMetrics(BaseModel):
    """Geographic distribution and performance metrics"""
    user_distribution: Dict[str, int] = Field(default_factory=dict)
    project_distribution: Dict[str, int] = Field(default_factory=dict)
    revenue_distribution: Dict[str, Decimal] = Field(default_factory=dict)
    top_markets: List[str] = Field(default_factory=list)
    growth_markets: List[str] = Field(default_factory=list)
    avg_hourly_rates: Dict[str, Decimal] = Field(default_factory=dict)


class RealtimeMetrics(BaseModel):
    """Real-time platform metrics"""
    # Current activity
    current_active_users: int = Field(..., ge=0)
    active_sessions: Optional[int] = Field(None, ge=0)
    
    # Recent activity (24h)
    new_registrations_24h: int = Field(..., ge=0)
    new_projects_24h: Optional[int] = Field(None, ge=0)
    active_projects: int = Field(..., ge=0)
    recent_transactions_24h: int = Field(..., ge=0)
    
    # System metrics
    system_metrics: Dict[str, Union[float, int]] = Field(default_factory=dict)
    
    # API metrics
    api_requests_per_minute: Optional[int] = Field(None, ge=0)
    error_rate: Optional[float] = Field(None, ge=0.0, le=100.0)
    avg_response_time: Optional[float] = Field(None, ge=0)  # milliseconds
    
    # Generated timestamp
    generated_at: datetime


class CompetitorAnalysis(BaseModel):
    """Competitor analysis metrics"""
    market_position: Optional[str] = None
    market_share_estimate: Optional[float] = Field(None, ge=0.0, le=100.0)
    competitive_advantages: List[str] = Field(default_factory=list)
    improvement_areas: List[str] = Field(default_factory=list)
    feature_comparison: Optional[Dict[str, bool]] = Field(default_factory=dict)


class FraudMetrics(BaseModel):
    """Fraud detection and security metrics"""
    suspicious_users: int = Field(..., ge=0)
    blocked_users: int = Field(..., ge=0)
    fraud_attempts: int = Field(..., ge=0)
    fraud_prevention_rate: float = Field(..., ge=0.0, le=100.0)
    security_incidents: int = Field(..., ge=0)
    avg_risk_score: Optional[float] = Field(None, ge=0.0, le=1.0)


class QualityMetrics(BaseModel):
    """Quality assurance and satisfaction metrics"""
    avg_client_rating: float = Field(..., ge=0.0, le=5.0)
    avg_freelancer_rating: float = Field(..., ge=0.0, le=5.0)
    quality_score: float = Field(..., ge=0.0, le=100.0)
    dispute_resolution_time: Optional[float] = None  # days
    customer_satisfaction_score: float = Field(..., ge=0.0, le=100.0)
    nps_score: Optional[int] = Field(None, ge=-100, le=100)  # Net Promoter Score


class PredictiveAnalytics(BaseModel):
    """Predictive analytics and forecasting"""
    user_growth_forecast: Dict[str, int] = Field(default_factory=dict)
    revenue_forecast: Dict[str, Decimal] = Field(default_factory=dict)
    churn_prediction: Optional[float] = Field(None, ge=0.0, le=100.0)
    market_trends: List[str] = Field(default_factory=list)
    risk_factors: List[str] = Field(default_factory=list)
    confidence_intervals: Optional[Dict[str, float]] = Field(default_factory=dict)


class AnalyticsDashboardData(BaseModel):
    """Complete dashboard data package"""
    platform_metrics: PlatformMetrics
    financial_metrics: FinancialMetrics
    user_analytics: UserAnalytics
    project_analytics: ProjectAnalytics
    realtime_metrics: RealtimeMetrics
    geographic_metrics: Optional[GeographicMetrics] = None
    quality_metrics: Optional[QualityMetrics] = None
    fraud_metrics: Optional[FraudMetrics] = None
    predictive_analytics: Optional[PredictiveAnalytics] = None
    generated_at: datetime


# Request/Response Models for API endpoints

class AnalyticsRequest(BaseModel):
    """Base request model for analytics endpoints"""
    period: TimePeriod = TimePeriod.DAYS_30
    include_trends: bool = True
    include_predictions: bool = False


class PlatformMetricsRequest(AnalyticsRequest):
    """Request model for platform metrics"""
    segments: List[UserSegment] = Field(default=[UserSegment.ALL])
    categories: Optional[List[str]] = None


class UserAnalyticsRequest(AnalyticsRequest):
    """Request model for user analytics"""
    segment: UserSegment = UserSegment.ALL
    cohort_analysis: bool = False
    lifecycle_analysis: bool = True


class ProjectAnalyticsRequest(AnalyticsRequest):
    """Request model for project analytics"""
    category: Optional[str] = None
    budget_range: Optional[Dict[str, Decimal]] = None
    include_subcategories: bool = False


class RealtimeMetricsRequest(BaseModel):
    """Request model for realtime metrics"""
    include_system_metrics: bool = True
    include_api_metrics: bool = True


class AnalyticsExportRequest(BaseModel):
    """Request model for analytics data export"""
    metrics_types: List[str] = Field(..., min_items=1)
    period: TimePeriod = TimePeriod.DAYS_30
    format: str = Field("json", regex="^(json|csv|xlsx)$")
    include_raw_data: bool = False


class AnalyticsFilterOptions(BaseModel):
    """Available filter options for analytics"""
    available_periods: List[TimePeriod] = list(TimePeriod)
    available_segments: List[UserSegment] = list(UserSegment)
    available_categories: List[str] = Field(default_factory=list)
    available_countries: List[str] = Field(default_factory=list)
    date_range_limits: Dict[str, datetime] = Field(default_factory=dict)


# Webhook and notification schemas

class AnalyticsAlert(BaseModel):
    """Analytics alert/notification model"""
    alert_id: str
    alert_type: str  # threshold, anomaly, trend, etc.
    metric_name: str
    current_value: Union[int, float, Decimal]
    threshold_value: Union[int, float, Decimal]
    severity: str  # low, medium, high, critical
    message: str
    triggered_at: datetime
    acknowledged: bool = False


class AnalyticsWebhookPayload(BaseModel):
    """Webhook payload for analytics events"""
    event_type: str
    event_data: Dict[str, Any]
    timestamp: datetime
    platform_id: str
    webhook_id: str
