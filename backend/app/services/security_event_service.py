"""
Security Event Service

This service handles comprehensive security event logging for audit trails,
security monitoring, and threat detection.
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_

from app.models.security import SecurityEvent, SecurityEventType
from app.models.user import User

logger = logging.getLogger(__name__)


class SecurityEventService:
    """Service for handling security event logging and monitoring"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def log_event(
        self,
        event_type: str,
        event_category: str,
        message: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        severity: str = "info",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        endpoint: Optional[str] = None,
        method: Optional[str] = None,
        status_code: Optional[int] = None,
        event_metadata: Optional[Dict[str, Any]] = None,
        risk_score: int = 0
    ) -> SecurityEvent:
        """
        Log a security event
        
        Args:
            event_type: Type of security event (login_success, mfa_failed, etc.)
            event_category: Category of event (auth, session, mfa, etc.)
            message: Human-readable event description
            user_id: Optional user ID if event is user-specific
            session_id: Optional session ID if event is session-specific
            severity: Event severity (info, low, medium, high, critical)
            ip_address: Source IP address
            user_agent: User agent string
            endpoint: API endpoint if applicable
            method: HTTP method if applicable
            status_code: HTTP status code if applicable
            event_metadata: Additional context data as JSON
            risk_score: Risk assessment score 0-100
            
        Returns:
            Created SecurityEvent instance
        """
        try:
            event = SecurityEvent(
                user_id=user_id,
                session_id=session_id,
                event_type=event_type,
                event_category=event_category,
                severity=severity,
                ip_address=ip_address,
                user_agent=user_agent,
                endpoint=endpoint,
                method=method,
                status_code=status_code,
                message=message,
                event_metadata=event_metadata,
                risk_score=risk_score,
                created_at=datetime.now(timezone.utc)
            )
            
            self.db.add(event)
            self.db.commit()
            
            logger.info(f"Security event logged: {event_type} for user {user_id}")
            
            # Trigger alert if high risk score
            if risk_score >= 80:
                self._trigger_high_risk_alert(event)
            
            return event
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error logging security event: {str(e)}")
            raise e
    
    def get_user_events(
        self,
        user_id: str,
        limit: int = 100,
        event_category: Optional[str] = None,
        severity: Optional[str] = None,
        days_back: int = 30
    ) -> List[SecurityEvent]:
        """
        Get security events for a specific user
        
        Args:
            user_id: User ID to fetch events for
            limit: Maximum number of events to return
            event_category: Filter by event category
            severity: Filter by severity level
            days_back: Number of days to look back
            
        Returns:
            List of SecurityEvent instances
        """
        query = self.db.query(SecurityEvent).filter(
            SecurityEvent.user_id == user_id
        )
        
        # Apply filters
        if event_category:
            query = query.filter(SecurityEvent.event_category == event_category)
        
        if severity:
            query = query.filter(SecurityEvent.severity == severity)
        
        # Date range filter
        if days_back:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_back)
            query = query.filter(SecurityEvent.created_at >= cutoff_date)
        
        return query.order_by(desc(SecurityEvent.created_at)).limit(limit).all()
    
    def get_suspicious_events(
        self,
        min_risk_score: int = 50,
        limit: int = 100,
        hours_back: int = 24
    ) -> List[SecurityEvent]:
        """
        Get suspicious security events based on risk score
        
        Args:
            min_risk_score: Minimum risk score to consider suspicious
            limit: Maximum number of events to return
            hours_back: Number of hours to look back
            
        Returns:
            List of suspicious SecurityEvent instances
        """
        from datetime import timedelta
        
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        
        return self.db.query(SecurityEvent).filter(
            and_(
                SecurityEvent.risk_score >= min_risk_score,
                SecurityEvent.created_at >= cutoff_time
            )
        ).order_by(desc(SecurityEvent.created_at)).limit(limit).all()
    
    def get_failed_login_attempts(
        self,
        ip_address: Optional[str] = None,
        user_id: Optional[str] = None,
        hours_back: int = 1
    ) -> List[SecurityEvent]:
        """
        Get failed login attempts for monitoring brute force attacks
        
        Args:
            ip_address: Filter by IP address
            user_id: Filter by user ID
            hours_back: Number of hours to look back
            
        Returns:
            List of failed login SecurityEvent instances
        """
        from datetime import timedelta
        
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        
        query = self.db.query(SecurityEvent).filter(
            and_(
                SecurityEvent.event_type == SecurityEventType.LOGIN_FAILED.value,
                SecurityEvent.created_at >= cutoff_time
            )
        )
        
        if ip_address:
            query = query.filter(SecurityEvent.ip_address == ip_address)
        
        if user_id:
            query = query.filter(SecurityEvent.user_id == user_id)
        
        return query.order_by(desc(SecurityEvent.created_at)).all()
    
    def get_event_statistics(
        self,
        days_back: int = 7
    ) -> Dict[str, Any]:
        """
        Get security event statistics for monitoring dashboard
        
        Args:
            days_back: Number of days to analyze
            
        Returns:
            Dictionary with event statistics
        """
        from datetime import timedelta
        from sqlalchemy import func
        
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_back)
        
        # Total events
        total_events = self.db.query(SecurityEvent).filter(
            SecurityEvent.created_at >= cutoff_date
        ).count()
        
        # Events by category
        category_stats = self.db.query(
            SecurityEvent.event_category,
            func.count(SecurityEvent.id).label('count')
        ).filter(
            SecurityEvent.created_at >= cutoff_date
        ).group_by(SecurityEvent.event_category).all()
        
        # Events by severity
        severity_stats = self.db.query(
            SecurityEvent.severity,
            func.count(SecurityEvent.id).label('count')
        ).filter(
            SecurityEvent.created_at >= cutoff_date
        ).group_by(SecurityEvent.severity).all()
        
        # High risk events
        high_risk_events = self.db.query(SecurityEvent).filter(
            and_(
                SecurityEvent.created_at >= cutoff_date,
                SecurityEvent.risk_score >= 70
            )
        ).count()
        
        # Failed login attempts
        failed_logins = self.db.query(SecurityEvent).filter(
            and_(
                SecurityEvent.created_at >= cutoff_date,
                SecurityEvent.event_type == SecurityEventType.LOGIN_FAILED.value
            )
        ).count()
        
        # MFA events
        mfa_events = self.db.query(SecurityEvent).filter(
            and_(
                SecurityEvent.created_at >= cutoff_date,
                SecurityEvent.event_category == 'mfa'
            )
        ).count()
        
        return {
            'total_events': total_events,
            'high_risk_events': high_risk_events,
            'failed_logins': failed_logins,
            'mfa_events': mfa_events,
            'categories': {row.event_category: row.count for row in category_stats},
            'severities': {row.severity: row.count for row in severity_stats},
            'period_days': days_back
        }
    
    def detect_anomalies(
        self,
        user_id: str,
        hours_back: int = 24
    ) -> List[Dict[str, Any]]:
        """
        Detect anomalous security events for a user
        
        Args:
            user_id: User ID to analyze
            hours_back: Number of hours to analyze
            
        Returns:
            List of detected anomalies
        """
        from datetime import timedelta
        from collections import Counter
        
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours_back)
        
        events = self.db.query(SecurityEvent).filter(
            and_(
                SecurityEvent.user_id == user_id,
                SecurityEvent.created_at >= cutoff_time
            )
        ).all()
        
        anomalies = []
        
        # Check for unusual IP addresses
        ip_addresses = [event.ip_address for event in events if event.ip_address]
        ip_counter = Counter(ip_addresses)
        
        if len(ip_counter) > 3:  # More than 3 different IPs
            anomalies.append({
                'type': 'multiple_ips',
                'severity': 'medium',
                'description': f'User accessed from {len(ip_counter)} different IP addresses',
                'details': {'ips': list(ip_counter.keys())[:5]}  # Show first 5
            })
        
        # Check for rapid successive events
        if len(events) > 20:  # More than 20 events in the time window
            anomalies.append({
                'type': 'high_activity',
                'severity': 'medium',
                'description': f'Unusually high activity: {len(events)} events in {hours_back} hours',
                'details': {'event_count': len(events)}
            })
        
        # Check for failed authentication attempts
        failed_auths = [e for e in events if e.event_type in [
            SecurityEventType.LOGIN_FAILED.value,
            SecurityEventType.MFA_FAILED.value
        ]]
        
        if len(failed_auths) > 5:
            anomalies.append({
                'type': 'multiple_failures',
                'severity': 'high',
                'description': f'{len(failed_auths)} failed authentication attempts',
                'details': {'failure_count': len(failed_auths)}
            })
        
        return anomalies
    
    def _trigger_high_risk_alert(self, event: SecurityEvent):
        """
        Trigger alert for high-risk security events
        
        Args:
            event: High-risk SecurityEvent instance
        """
        # In production, this would integrate with alerting systems
        # like Slack, email notifications, or security monitoring tools
        logger.critical(
            f"HIGH RISK SECURITY EVENT: {event.event_type} "
            f"for user {event.user_id} from IP {event.ip_address}. "
            f"Risk score: {event.risk_score}/100"
        )
        
        # Could implement:
        # - Send Slack notification
        # - Send email alert
        # - Create incident ticket
        # - Trigger automatic response (e.g., account lockout)
    
    def cleanup_old_events(self, days_to_keep: int = 90) -> int:
        """
        Clean up old security events to manage database size
        
        Args:
            days_to_keep: Number of days of events to keep
            
        Returns:
            Number of events deleted
        """
        from datetime import timedelta
        
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_to_keep)
        
        # Keep high-risk events longer
        deleted_count = self.db.query(SecurityEvent).filter(
            and_(
                SecurityEvent.created_at < cutoff_date,
                SecurityEvent.risk_score < 70  # Don't delete high-risk events
            )
        ).delete(synchronize_session=False)
        
        self.db.commit()
        
        logger.info(f"Cleaned up {deleted_count} old security events")
        
        return deleted_count
