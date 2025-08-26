"""Background task definitions for the worker system."""

import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from rq import get_current_job

from app.core.db import SessionLocal
from app.models.token import TokenTransaction
from app.models.job_queue import WebhookEvent, DeadLetterQueue
from app.models.security import Session as UserSession
from app.services.chain_registry import registry
from app.core.config import settings

logger = logging.getLogger(__name__)


def confirm_transaction(tx_hash: str, chain_id: int, user_id: str) -> Dict[str, Any]:
    """
    Background task to confirm blockchain transaction status.
    Updates TokenTransaction record based on blockchain receipt.
    """
    job = get_current_job()
    db = SessionLocal()
    
    try:
        # Find the transaction record
        tx_record = db.query(TokenTransaction).filter(
            TokenTransaction.tx_hash == tx_hash,
            TokenTransaction.user_id == user_id
        ).first()
        
        if not tx_record:
            logger.warning(f"Transaction not found: {tx_hash} for user {user_id}")
            return {"status": "error", "message": "Transaction not found"}
        
        # Skip if already confirmed or failed
        if tx_record.status in ['confirmed', 'failed']:
            return {"status": "skipped", "message": f"Transaction already {tx_record.status}"}
        
        # Get Web3 instance for the chain
        w3 = registry.get_web3(chain_id)
        if not w3:
            raise Exception(f"Web3 provider not configured for chain {chain_id}")
        
        try:
            # Get transaction receipt
            receipt = w3.eth.get_transaction_receipt(tx_hash)
            
            # Update status based on receipt
            new_status = "confirmed" if getattr(receipt, 'status', 0) == 1 else "failed"
            tx_record.status = new_status
            tx_record.block_number = getattr(receipt, 'blockNumber', None)
            tx_record.gas_used = getattr(receipt, 'gasUsed', None)
            
            db.commit()
            
            logger.info(f"Transaction {tx_hash} confirmed with status: {new_status}")
            return {
                "status": "success",
                "tx_hash": tx_hash,
                "new_status": new_status,
                "block_number": tx_record.block_number
            }
            
        except Exception as e:
            # Transaction might still be pending
            if "not found" in str(e).lower():
                # Reschedule for later if within reasonable time window
                if tx_record.created_at > datetime.utcnow() - timedelta(hours=24):
                    logger.info(f"Transaction {tx_hash} still pending, will retry")
                    return {"status": "pending", "message": "Transaction still in mempool"}
                else:
                    # Mark as failed if too old
                    tx_record.status = "failed"
                    db.commit()
                    return {"status": "timeout", "message": "Transaction timeout"}
            else:
                raise
                
    except Exception as e:
        logger.error(f"Error confirming transaction {tx_hash}: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


def process_webhook_event(event_id: str, provider: str, event_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Background task to process webhook events with idempotency and retry logic.
    """
    job = get_current_job()
    db = SessionLocal()
    
    try:
        # Check if event already processed (idempotency)
        existing_event = db.query(WebhookEvent).filter(
            WebhookEvent.event_id == event_id,
            WebhookEvent.provider == provider
        ).first()
        
        if existing_event and existing_event.status == "processed":
            logger.info(f"Webhook event {event_id} already processed")
            return {"status": "duplicate", "message": "Event already processed"}
        
        # Create or update webhook event record
        if not existing_event:
            webhook_event = WebhookEvent(
                event_id=event_id,
                provider=provider,
                event_type=event_type,
                payload=payload,
                status="processing"
            )
            db.add(webhook_event)
        else:
            existing_event.status = "processing"
            existing_event.retry_count += 1
            webhook_event = existing_event
        
        db.commit()
        
        # Process based on provider and event type
        result = None
        if provider == "github":
            result = _process_github_webhook(event_type, payload, db)
        elif provider == "slack":
            result = _process_slack_webhook(event_type, payload, db)
        elif provider == "stripe":
            result = _process_stripe_webhook(event_type, payload, db)
        else:
            logger.warning(f"Unknown webhook provider: {provider}")
            result = {"status": "unsupported", "message": f"Provider {provider} not supported"}
        
        # Update webhook event status
        webhook_event.status = "processed" if result.get("status") == "success" else "failed"
        webhook_event.processed_at = datetime.utcnow()
        if result.get("status") != "success":
            webhook_event.error_message = result.get("message", "Unknown error")
        
        db.commit()
        
        logger.info(f"Processed webhook event {event_id} from {provider}: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error processing webhook event {event_id}: {e}")
        
        # Update webhook event with error
        if 'webhook_event' in locals():
            webhook_event.status = "failed"
            webhook_event.error_message = str(e)
            db.commit()
        
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


def update_reputation_scores(user_ids: Optional[list] = None) -> Dict[str, Any]:
    """
    Background task to recalculate reputation scores for users.
    """
    job = get_current_job()
    db = SessionLocal()
    
    try:
        from app.models.user import User
        from app.models.review import Review
        from app.services.reputation_service import ReputationService
        
        reputation_service = ReputationService(db)
        updated_count = 0
        
        if user_ids:
            # Update specific users
            for user_id in user_ids:
                try:
                    reputation_service.calculate_user_reputation(user_id)
                    updated_count += 1
                except Exception as e:
                    logger.error(f"Error updating reputation for user {user_id}: {e}")
        else:
            # Update all users with recent activity
            recent_cutoff = datetime.utcnow() - timedelta(days=7)
            active_users = db.query(User).filter(
                User.updated_at >= recent_cutoff
            ).all()
            
            for user in active_users:
                try:
                    reputation_service.calculate_user_reputation(user.id)
                    updated_count += 1
                except Exception as e:
                    logger.error(f"Error updating reputation for user {user.id}: {e}")
        
        logger.info(f"Updated reputation scores for {updated_count} users")
        return {"status": "success", "updated_count": updated_count}
        
    except Exception as e:
        logger.error(f"Error updating reputation scores: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


def cleanup_expired_sessions() -> Dict[str, Any]:
    """
    Background task to clean up expired user sessions.
    """
    job = get_current_job()
    db = SessionLocal()
    
    try:
        # Delete expired sessions
        expired_cutoff = datetime.utcnow()
        expired_sessions = db.query(UserSession).filter(
            UserSession.expires_at < expired_cutoff
        )
        
        count = expired_sessions.count()
        expired_sessions.delete()
        db.commit()
        
        logger.info(f"Cleaned up {count} expired sessions")
        return {"status": "success", "cleaned_count": count}
        
    except Exception as e:
        logger.error(f"Error cleaning up expired sessions: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


# Helper functions for webhook processing
def _process_github_webhook(event_type: str, payload: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Process GitHub webhook events."""
    try:
        if event_type == "push":
            # Handle code push events for skills verification
            return {"status": "success", "message": "Push event processed"}
        elif event_type == "pull_request":
            # Handle PR events for contribution tracking
            return {"status": "success", "message": "PR event processed"}
        else:
            return {"status": "ignored", "message": f"Event type {event_type} not handled"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def _process_slack_webhook(event_type: str, payload: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Process Slack webhook events."""
    try:
        if event_type == "message":
            # Handle Slack messages for project communication
            return {"status": "success", "message": "Message event processed"}
        else:
            return {"status": "ignored", "message": f"Event type {event_type} not handled"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def _process_stripe_webhook(event_type: str, payload: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Process Stripe webhook events."""
    try:
        if event_type == "payment_intent.succeeded":
            # Handle successful payments
            return {"status": "success", "message": "Payment success processed"}
        elif event_type == "payment_intent.payment_failed":
            # Handle failed payments
            return {"status": "success", "message": "Payment failure processed"}
        else:
            return {"status": "ignored", "message": f"Event type {event_type} not handled"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
