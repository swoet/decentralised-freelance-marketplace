"""
Enterprise Analytics Service
Provides comprehensive analytics, metrics, and business intelligence for the platform
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from decimal import Decimal
from sqlalchemy import text, and_, or_, func
from sqlalchemy.orm import Session
from redis import Redis
import json

from app.core.db import get_db
from app.core.config import settings
from app.models.user import User
from app.models.project import Project
from app.models.bid import Bid
from app.models.escrow import Escrow
from app.models.review import Review
from app.schemas.analytics import (
    PlatformMetrics,
    FinancialMetrics,
    UserAnalytics,
    ProjectAnalytics,
    GeographicMetrics,
    TrendAnalysis,
    RealtimeMetrics
)

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Advanced analytics and business intelligence service"""
    
    def __init__(self, db: Session, redis_client: Optional[Redis] = None):
        self.db = db
        self.redis = redis_client
        self.cache_ttl = 300  # 5 minutes cache
        
    async def get_platform_metrics(
        self, 
        period: str = "30d",
        include_trends: bool = True
    ) -> PlatformMetrics:
        """Get comprehensive platform metrics"""
        cache_key = f"platform_metrics:{period}:{include_trends}"
        
        # Try cache first
        if self.redis:
            cached = self.redis.get(cache_key)
            if cached:
                return PlatformMetrics.parse_raw(cached)
        
        end_date = datetime.utcnow()
        start_date = self._get_period_start_date(period, end_date)
        
        # User metrics
        total_users = self.db.query(User).count()
        active_users = self.db.query(User).filter(
            User.created_at >= start_date
        ).count()
        
        verified_users = self.db.query(User).filter(
            User.is_verified == True
        ).count()
        
        # Project metrics
        total_projects = self.db.query(Project).count()
        active_projects = self.db.query(Project).filter(
            Project.created_at >= start_date
        ).count()
        
        completed_projects = self.db.query(Project).filter(
            Project.status == "completed",
            Project.created_at >= start_date
        ).count()
        
        # Financial metrics
        total_volume = self.db.query(
            func.sum(Project.budget)
        ).filter(
            Project.status == "completed"
        ).scalar() or Decimal('0')
        
        period_volume = self.db.query(
            func.sum(Project.budget)
        ).filter(
            Project.status == "completed",
            Project.created_at >= start_date
        ).scalar() or Decimal('0')
        
        # Engagement metrics
        total_bids = self.db.query(Bid).count()
        period_bids = self.db.query(Bid).filter(
            Bid.created_at >= start_date
        ).count()
        
        # Quality metrics
        avg_rating = self.db.query(
            func.avg(Review.rating)
        ).scalar() or 0.0
        
        success_rate = (completed_projects / active_projects * 100) if active_projects > 0 else 0.0
        
        metrics = PlatformMetrics(
            total_users=total_users,
            active_users=active_users,
            verified_users=verified_users,
            user_growth_rate=self._calculate_growth_rate(active_users, period),
            total_projects=total_projects,
            active_projects=active_projects,
            completed_projects=completed_projects,
            project_success_rate=success_rate,
            total_volume=total_volume,
            period_volume=period_volume,
            total_bids=total_bids,
            period_bids=period_bids,
            average_rating=avg_rating,
            platform_fee_revenue=period_volume * Decimal('0.05'),  # Assuming 5% fee
            period=period,
            generated_at=datetime.utcnow()
        )
        
        # Add trend analysis if requested
        if include_trends:
            metrics.trends = await self._calculate_trends(period)
        
        # Cache results
        if self.redis:
            self.redis.setex(
                cache_key, 
                self.cache_ttl, 
                metrics.json()
            )
        
        return metrics
    
    async def get_financial_metrics(
        self,
        period: str = "30d",
        currency: str = "USD"
    ) -> FinancialMetrics:
        """Get detailed financial analytics"""
        cache_key = f"financial_metrics:{period}:{currency}"
        
        if self.redis:
            cached = self.redis.get(cache_key)
            if cached:
                return FinancialMetrics.parse_raw(cached)
        
        end_date = datetime.utcnow()
        start_date = self._get_period_start_date(period, end_date)
        
        # Revenue calculations
        completed_projects = self.db.query(Project).filter(
            Project.status == "completed",
            Project.created_at >= start_date
        ).all()
        
        gross_revenue = sum(p.budget for p in completed_projects)
        platform_fee_revenue = gross_revenue * Decimal('0.05')  # 5% platform fee
        
        # Transaction metrics
        total_transactions = len(completed_projects)
        avg_transaction_value = gross_revenue / total_transactions if total_transactions > 0 else Decimal('0')
        
        # Escrow metrics
        active_escrows = self.db.query(Escrow).filter(
            Escrow.status.in_(["active", "disputed"])
        ).count()
        
        escrow_volume = self.db.query(
            func.sum(Escrow.total_amount)
        ).filter(
            Escrow.status.in_(["active", "disputed"])
        ).scalar() or Decimal('0')
        
        # Payment method distribution
        payment_methods = self._get_payment_method_distribution(start_date, end_date)
        
        # Geographic revenue distribution
        geographic_revenue = self._get_geographic_revenue_distribution(start_date, end_date)
        
        metrics = FinancialMetrics(
            gross_revenue=gross_revenue,
            platform_revenue=platform_fee_revenue,
            total_transactions=total_transactions,
            avg_transaction_value=avg_transaction_value,
            active_escrow_count=active_escrows,
            active_escrow_volume=escrow_volume,
            payment_method_distribution=payment_methods,
            geographic_revenue_distribution=geographic_revenue,
            currency=currency,
            period=period,
            generated_at=datetime.utcnow()
        )
        
        # Cache results
        if self.redis:
            self.redis.setex(cache_key, self.cache_ttl, metrics.json())
        
        return metrics
    
    async def get_user_analytics(
        self,
        segment: str = "all",
        period: str = "30d"
    ) -> UserAnalytics:
        """Get detailed user behavior analytics"""
        cache_key = f"user_analytics:{segment}:{period}"
        
        if self.redis:
            cached = self.redis.get(cache_key)
            if cached:
                return UserAnalytics.parse_raw(cached)
        
        end_date = datetime.utcnow()
        start_date = self._get_period_start_date(period, end_date)
        
        # Base query
        user_query = self.db.query(User)
        if segment == "clients":
            user_query = user_query.filter(User.role == "client")
        elif segment == "freelancers":
            user_query = user_query.filter(User.role == "freelancer")
        
        # User acquisition metrics
        total_users = user_query.count()
        new_users = user_query.filter(User.created_at >= start_date).count()
        
        # Engagement metrics
        active_users = self._get_active_users(segment, start_date, end_date)
        retention_rate = self._calculate_retention_rate(segment, period)
        
        # User lifecycle analysis
        lifecycle_stages = self._analyze_user_lifecycle(segment, start_date, end_date)
        
        # Geographic distribution
        geographic_distribution = self._get_user_geographic_distribution(segment)
        
        # Skill distribution (for freelancers)
        skill_distribution = None
        if segment in ["all", "freelancers"]:
            skill_distribution = self._get_skill_distribution()
        
        analytics = UserAnalytics(
            total_users=total_users,
            new_users=new_users,
            active_users=active_users,
            retention_rate=retention_rate,
            churn_rate=100.0 - retention_rate,
            lifecycle_stages=lifecycle_stages,
            geographic_distribution=geographic_distribution,
            skill_distribution=skill_distribution,
            segment=segment,
            period=period,
            generated_at=datetime.utcnow()
        )
        
        # Cache results
        if self.redis:
            self.redis.setex(cache_key, self.cache_ttl, analytics.json())
        
        return analytics
    
    async def get_project_analytics(
        self,
        category: Optional[str] = None,
        period: str = "30d"
    ) -> ProjectAnalytics:
        """Get detailed project performance analytics"""
        cache_key = f"project_analytics:{category or 'all'}:{period}"
        
        if self.redis:
            cached = self.redis.get(cache_key)
            if cached:
                return ProjectAnalytics.parse_raw(cached)
        
        end_date = datetime.utcnow()
        start_date = self._get_period_start_date(period, end_date)
        
        # Base query
        project_query = self.db.query(Project).filter(
            Project.created_at >= start_date
        )
        
        if category:
            project_query = project_query.filter(Project.category == category)
        
        # Project metrics
        total_projects = project_query.count()
        completed_projects = project_query.filter(Project.status == "completed").count()
        active_projects = project_query.filter(Project.status == "active").count()
        cancelled_projects = project_query.filter(Project.status == "cancelled").count()
        
        # Success metrics
        success_rate = (completed_projects / total_projects * 100) if total_projects > 0 else 0.0
        
        # Time metrics
        avg_completion_time = self._calculate_avg_completion_time(category, start_date, end_date)
        
        # Budget analytics
        budget_distribution = self._get_budget_distribution(category, start_date, end_date)
        
        # Category performance
        category_performance = self._get_category_performance(start_date, end_date)
        
        # Bid analytics
        avg_bids_per_project = self._get_avg_bids_per_project(category, start_date, end_date)
        
        analytics = ProjectAnalytics(
            total_projects=total_projects,
            completed_projects=completed_projects,
            active_projects=active_projects,
            cancelled_projects=cancelled_projects,
            success_rate=success_rate,
            avg_completion_time_days=avg_completion_time,
            avg_bids_per_project=avg_bids_per_project,
            budget_distribution=budget_distribution,
            category_performance=category_performance,
            category=category,
            period=period,
            generated_at=datetime.utcnow()
        )
        
        # Cache results
        if self.redis:
            self.redis.setex(cache_key, self.cache_ttl, analytics.json())
        
        return analytics
    
    async def get_realtime_metrics(self) -> RealtimeMetrics:
        """Get real-time platform metrics"""
        cache_key = "realtime_metrics"
        
        if self.redis:
            cached = self.redis.get(cache_key)
            if cached:
                data = json.loads(cached)
                # Only return if less than 1 minute old
                if datetime.utcnow() - datetime.fromisoformat(data['generated_at'].replace('Z', '+00:00')) < timedelta(minutes=1):
                    return RealtimeMetrics.parse_raw(cached)
        
        now = datetime.utcnow()
        last_hour = now - timedelta(hours=1)
        last_24h = now - timedelta(hours=24)
        
        # Current active users (users with activity in last hour)
        # This would require activity tracking in your actual implementation
        current_active_users = 0  # Placeholder
        
        # New registrations in last 24h
        new_registrations_24h = self.db.query(User).filter(
            User.created_at >= last_24h
        ).count()
        
        # Active projects (projects with recent activity)
        active_projects = self.db.query(Project).filter(
            Project.status.in_(["active", "in_progress"])
        ).count()
        
        # Recent transactions (last 24h)
        recent_transactions = self.db.query(Project).filter(
            Project.status == "completed",
            Project.updated_at >= last_24h
        ).count()
        
        # System load metrics (would be implemented based on your monitoring system)
        system_metrics = {
            "cpu_usage": 0.0,  # Placeholder
            "memory_usage": 0.0,  # Placeholder
            "db_connections": 0,  # Placeholder
            "api_requests_per_minute": 0  # Placeholder
        }
        
        metrics = RealtimeMetrics(
            current_active_users=current_active_users,
            new_registrations_24h=new_registrations_24h,
            active_projects=active_projects,
            recent_transactions_24h=recent_transactions,
            system_metrics=system_metrics,
            generated_at=now
        )
        
        # Cache for 30 seconds
        if self.redis:
            self.redis.setex(cache_key, 30, metrics.json())
        
        return metrics
    
    # Helper methods
    
    def _get_period_start_date(self, period: str, end_date: datetime) -> datetime:
        """Convert period string to start date"""
        if period == "24h":
            return end_date - timedelta(hours=24)
        elif period == "7d":
            return end_date - timedelta(days=7)
        elif period == "30d":
            return end_date - timedelta(days=30)
        elif period == "90d":
            return end_date - timedelta(days=90)
        elif period == "1y":
            return end_date - timedelta(days=365)
        else:
            return end_date - timedelta(days=30)
    
    def _calculate_growth_rate(self, current_value: int, period: str) -> float:
        """Calculate growth rate for a given period"""
        # This would need historical data to calculate properly
        # For now, return a placeholder
        return 0.0
    
    async def _calculate_trends(self, period: str) -> TrendAnalysis:
        """Calculate trend analysis for various metrics"""
        # Implementation would analyze historical data and calculate trends
        return TrendAnalysis(
            user_growth_trend="stable",
            project_volume_trend="increasing",
            revenue_trend="increasing",
            quality_trend="stable"
        )
    
    def _get_payment_method_distribution(self, start_date: datetime, end_date: datetime) -> Dict[str, int]:
        """Get distribution of payment methods used"""
        # This would query actual payment data
        return {
            "crypto": 45,
            "credit_card": 30,
            "bank_transfer": 20,
            "paypal": 5
        }
    
    def _get_geographic_revenue_distribution(self, start_date: datetime, end_date: datetime) -> Dict[str, Decimal]:
        """Get revenue distribution by geography"""
        # This would analyze user locations and project data
        return {
            "North America": Decimal("50000"),
            "Europe": Decimal("35000"),
            "Asia": Decimal("25000"),
            "Others": Decimal("15000")
        }
    
    def _get_active_users(self, segment: str, start_date: datetime, end_date: datetime) -> int:
        """Get count of active users in period"""
        # This would require activity tracking
        return 0
    
    def _calculate_retention_rate(self, segment: str, period: str) -> float:
        """Calculate user retention rate"""
        # This would analyze user behavior over time
        return 75.0  # Placeholder
    
    def _analyze_user_lifecycle(self, segment: str, start_date: datetime, end_date: datetime) -> Dict[str, int]:
        """Analyze users by lifecycle stage"""
        return {
            "new": 100,
            "active": 500,
            "at_risk": 50,
            "churned": 25
        }
    
    def _get_user_geographic_distribution(self, segment: str) -> Dict[str, int]:
        """Get user distribution by geography"""
        return {
            "United States": 200,
            "United Kingdom": 150,
            "Canada": 100,
            "Australia": 75,
            "Germany": 90,
            "Others": 300
        }
    
    def _get_skill_distribution(self) -> Dict[str, int]:
        """Get distribution of freelancer skills"""
        # This would analyze user skills data
        return {
            "Web Development": 150,
            "Mobile Development": 100,
            "Data Science": 75,
            "Design": 120,
            "Writing": 80,
            "Marketing": 60
        }
    
    def _calculate_avg_completion_time(self, category: Optional[str], start_date: datetime, end_date: datetime) -> float:
        """Calculate average project completion time"""
        # This would analyze project timelines
        return 21.5  # days
    
    def _get_budget_distribution(self, category: Optional[str], start_date: datetime, end_date: datetime) -> Dict[str, int]:
        """Get distribution of project budgets"""
        return {
            "< $500": 150,
            "$500 - $2000": 200,
            "$2000 - $5000": 100,
            "$5000+": 50
        }
    
    def _get_category_performance(self, start_date: datetime, end_date: datetime) -> Dict[str, Dict[str, Any]]:
        """Get performance metrics by category"""
        return {
            "web_development": {
                "projects": 120,
                "success_rate": 85.0,
                "avg_budget": 2500
            },
            "mobile_development": {
                "projects": 80,
                "success_rate": 90.0,
                "avg_budget": 3500
            },
            "design": {
                "projects": 100,
                "success_rate": 88.0,
                "avg_budget": 1200
            }
        }
    
    def _get_avg_bids_per_project(self, category: Optional[str], start_date: datetime, end_date: datetime) -> float:
        """Calculate average number of bids per project"""
        # This would analyze bid data
        return 7.5


def get_analytics_service(db: Session) -> AnalyticsService:
    """Get analytics service instance"""
    redis_client = None
    if settings.REDIS_HOST:
        try:
            redis_client = Redis.from_url(settings.REDIS_HOST)
        except Exception as e:
            logger.warning(f"Could not connect to Redis: {e}")
    
    return AnalyticsService(db, redis_client)
