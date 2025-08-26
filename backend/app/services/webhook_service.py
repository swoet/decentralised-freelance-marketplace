"""Webhook signature verification and processing service."""

import hashlib
import hmac
import base64
import json
from typing import Optional, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.oauth import WebhookSignature
from app.services.job_service import JobService


class WebhookService:
    """Service for webhook signature verification and secure processing."""
    
    def __init__(self, db: Session):
        self.db = db
        self.job_service = JobService(db)
    
    def verify_webhook_signature(
        self,
        provider: str,
        payload: bytes,
        signature: str,
        timestamp: Optional[str] = None,
        event_id: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Verify webhook signature based on provider-specific methods.
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            if provider == "github":
                return self._verify_github_signature(payload, signature)
            elif provider == "slack":
                return self._verify_slack_signature(payload, signature, timestamp)
            elif provider == "stripe":
                return self._verify_stripe_signature(payload, signature, timestamp)
            elif provider == "jira":
                return self._verify_jira_signature(payload, signature)
            elif provider == "trello":
                return self._verify_trello_signature(payload, signature)
            else:
                return False, f"Unsupported webhook provider: {provider}"
                
        except Exception as e:
            return False, f"Signature verification error: {str(e)}"
    
    def process_webhook(
        self,
        provider: str,
        event_type: str,
        payload: Dict[str, Any],
        headers: Dict[str, str],
        signature: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process webhook with signature verification and idempotent handling.
        
        Returns:
            Dict with processing status and details
        """
        # Extract event ID for idempotency
        event_id = self._extract_event_id(provider, payload, headers)
        if not event_id:
            return {"success": False, "error": "Could not extract event ID"}
        
        # Verify signature if provided
        if signature:
            payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
            timestamp = headers.get('X-Timestamp') or headers.get('X-Slack-Request-Timestamp')
            
            is_valid, error_msg = self.verify_webhook_signature(
                provider, payload_bytes, signature, timestamp, event_id
            )
            
            if not is_valid:
                # Store failed verification attempt
                self._store_signature_record(
                    provider, event_id, signature, 
                    headers.get('X-Signature') or 'unknown',
                    verified=False, error=error_msg
                )
                return {"success": False, "error": f"Signature verification failed: {error_msg}"}
            
            # Store successful verification
            self._store_signature_record(
                provider, event_id, signature,
                headers.get('X-Signature') or 'unknown',
                verified=True
            )
        
        # Enqueue webhook processing job
        try:
            job_id = self.job_service.enqueue_webhook_processing(
                event_id=event_id,
                provider=provider,
                event_type=event_type,
                payload=payload,
                priority=self._get_event_priority(provider, event_type)
            )
            
            return {
                "success": True,
                "event_id": event_id,
                "job_id": job_id,
                "message": "Webhook queued for processing"
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to queue webhook: {str(e)}"}
    
    def _verify_github_signature(self, payload: bytes, signature: str) -> Tuple[bool, Optional[str]]:
        """Verify GitHub webhook signature using HMAC-SHA256."""
        if not signature.startswith('sha256='):
            return False, "Invalid GitHub signature format"
        
        expected_signature = signature[7:]  # Remove 'sha256=' prefix
        secret = settings.WEBHOOK_SECRET_KEY.encode('utf-8')
        
        computed_signature = hmac.new(
            secret, payload, hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(expected_signature, computed_signature):
            return False, "GitHub signature mismatch"
        
        return True, None
    
    def _verify_slack_signature(
        self, 
        payload: bytes, 
        signature: str, 
        timestamp: Optional[str]
    ) -> Tuple[bool, Optional[str]]:
        """Verify Slack webhook signature using their signing secret."""
        if not signature.startswith('v0='):
            return False, "Invalid Slack signature format"
        
        if not timestamp:
            return False, "Missing timestamp for Slack signature verification"
        
        # Check timestamp freshness (within 5 minutes)
        try:
            request_timestamp = int(timestamp)
            current_timestamp = int(datetime.utcnow().timestamp())
            if abs(current_timestamp - request_timestamp) > 300:  # 5 minutes
                return False, "Slack request timestamp too old"
        except ValueError:
            return False, "Invalid timestamp format"
        
        # Compute signature
        sig_basestring = f"v0:{timestamp}:{payload.decode('utf-8')}"
        secret = settings.WEBHOOK_SECRET_KEY.encode('utf-8')
        
        computed_signature = 'v0=' + hmac.new(
            secret, sig_basestring.encode('utf-8'), hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, computed_signature):
            return False, "Slack signature mismatch"
        
        return True, None
    
    def _verify_stripe_signature(
        self, 
        payload: bytes, 
        signature: str, 
        timestamp: Optional[str]
    ) -> Tuple[bool, Optional[str]]:
        """Verify Stripe webhook signature."""
        # Stripe signature format: t=timestamp,v1=signature
        sig_parts = {}
        for part in signature.split(','):
            if '=' in part:
                key, value = part.split('=', 1)
                sig_parts[key] = value
        
        if 't' not in sig_parts or 'v1' not in sig_parts:
            return False, "Invalid Stripe signature format"
        
        timestamp_str = sig_parts['t']
        expected_signature = sig_parts['v1']
        
        # Check timestamp freshness (within 5 minutes)
        try:
            request_timestamp = int(timestamp_str)
            current_timestamp = int(datetime.utcnow().timestamp())
            if abs(current_timestamp - request_timestamp) > 300:  # 5 minutes
                return False, "Stripe request timestamp too old"
        except ValueError:
            return False, "Invalid timestamp in Stripe signature"
        
        # Compute signature
        signed_payload = f"{timestamp_str}.{payload.decode('utf-8')}"
        secret = settings.STRIPE_WEBHOOK_SECRET.encode('utf-8')
        
        computed_signature = hmac.new(
            secret, signed_payload.encode('utf-8'), hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(expected_signature, computed_signature):
            return False, "Stripe signature mismatch"
        
        return True, None
    
    def _verify_jira_signature(self, payload: bytes, signature: str) -> Tuple[bool, Optional[str]]:
        """Verify Jira webhook signature using HMAC-SHA256."""
        secret = settings.WEBHOOK_SECRET_KEY.encode('utf-8')
        
        computed_signature = base64.b64encode(
            hmac.new(secret, payload, hashlib.sha256).digest()
        ).decode('utf-8')
        
        if not hmac.compare_digest(signature, computed_signature):
            return False, "Jira signature mismatch"
        
        return True, None
    
    def _verify_trello_signature(self, payload: bytes, signature: str) -> Tuple[bool, Optional[str]]:
        """Verify Trello webhook signature using HMAC-SHA1."""
        # Trello uses SHA1 with base64 encoding
        secret = settings.WEBHOOK_SECRET_KEY.encode('utf-8')
        
        computed_signature = base64.b64encode(
            hmac.new(secret, payload, hashlib.sha1).digest()
        ).decode('utf-8')
        
        if not hmac.compare_digest(signature, computed_signature):
            return False, "Trello signature mismatch"
        
        return True, None
    
    def _extract_event_id(
        self, 
        provider: str, 
        payload: Dict[str, Any], 
        headers: Dict[str, str]
    ) -> Optional[str]:
        """Extract unique event ID from webhook payload."""
        if provider == "github":
            return headers.get('X-GitHub-Delivery')
        elif provider == "slack":
            return payload.get('event_id') or headers.get('X-Slack-Request-Timestamp')
        elif provider == "stripe":
            return payload.get('id')
        elif provider == "jira":
            return payload.get('webhookEvent') + '_' + str(payload.get('timestamp', ''))
        elif provider == "trello":
            return payload.get('action', {}).get('id')
        
        return None
    
    def _get_event_priority(self, provider: str, event_type: str) -> int:
        """Determine processing priority for webhook events."""
        # Higher priority events (payment, security)
        high_priority_events = [
            'payment_intent.succeeded',
            'payment_intent.payment_failed',
            'account.updated',
            'customer.subscription.deleted'
        ]
        
        # Medium priority events (project updates)
        medium_priority_events = [
            'push',
            'pull_request',
            'issue_updated',
            'message'
        ]
        
        if event_type in high_priority_events:
            return 10
        elif event_type in medium_priority_events:
            return 5
        else:
            return 1  # Low priority
    
    def _store_signature_record(
        self,
        provider: str,
        event_id: str,
        signature: str,
        signature_header: str,
        verified: bool,
        error: Optional[str] = None
    ) -> None:
        """Store webhook signature verification record."""
        try:
            signature_record = WebhookSignature(
                provider=provider,
                event_id=event_id,
                signature=signature,
                signature_header=signature_header,
                verified=verified,
                verification_error=error,
                verified_at=datetime.utcnow() if verified else None
            )
            self.db.add(signature_record)
            self.db.commit()
        except Exception as e:
            # Don't fail webhook processing due to logging issues
            self.db.rollback()
    
    def get_webhook_stats(self, provider: Optional[str] = None) -> Dict[str, Any]:
        """Get webhook processing statistics."""
        from app.models.job_queue import WebhookEvent
        
        query = self.db.query(WebhookEvent)
        if provider:
            query = query.filter(WebhookEvent.provider == provider)
        
        total_events = query.count()
        processed_events = query.filter(WebhookEvent.status == 'processed').count()
        failed_events = query.filter(WebhookEvent.status == 'failed').count()
        pending_events = query.filter(WebhookEvent.status == 'pending').count()
        
        return {
            "total_events": total_events,
            "processed_events": processed_events,
            "failed_events": failed_events,
            "pending_events": pending_events,
            "success_rate": (processed_events / total_events * 100) if total_events > 0 else 0
        }
