"""Job management service for background task scheduling and monitoring."""

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from uuid import UUID
import redis
from rq import Queue, Worker, Connection
from rq.job import Job
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.job_queue import JobQueue, DeadLetterQueue, WebhookEvent
from app.worker.tasks import confirm_transaction, process_webhook_event, update_reputation_scores, cleanup_expired_sessions

logger = logging.getLogger(__name__)


class JobService:
    """Service for managing background jobs and queues."""
    
    def __init__(self, db: Session):
        self.db = db
        self.redis_conn = redis.from_url(settings.WORKER_REDIS_URL)
        self.queue = Queue(connection=self.redis_conn)
    
    def enqueue_transaction_confirmation(
        self, 
        tx_hash: str, 
        chain_id: int, 
        user_id: str,
        delay: Optional[int] = None
    ) -> str:
        """
        Enqueue a transaction confirmation job.
        
        Args:
            tx_hash: Transaction hash to confirm
            chain_id: Blockchain chain ID
            user_id: User ID who initiated the transaction
            delay: Optional delay in seconds before processing
        
        Returns:
            Job ID
        """
        job_kwargs = {
            'timeout': settings.JOB_TIMEOUT,
            'retry': settings.WORKER_RETRY_ATTEMPTS,
            'job_id': f"tx_confirm_{tx_hash}_{user_id}"
        }
        
        if delay:
            job_kwargs['delay'] = timedelta(seconds=delay)
        
        job = self.queue.enqueue(
            confirm_transaction,
            tx_hash,
            chain_id,
            user_id,
            **job_kwargs
        )
        
        # Track job in database
        self._create_job_record(
            job.id,
            "transaction_confirmation",
            {
                "tx_hash": tx_hash,
                "chain_id": chain_id,
                "user_id": user_id
            }
        )
        
        logger.info(f"Enqueued transaction confirmation job {job.id} for tx {tx_hash}")
        return job.id
    
    def enqueue_webhook_processing(
        self,
        event_id: str,
        provider: str,
        event_type: str,
        payload: Dict[str, Any],
        priority: int = 0
    ) -> str:
        """
        Enqueue a webhook processing job with idempotency check.
        
        Args:
            event_id: Unique event identifier
            provider: Webhook provider (github, slack, stripe, etc.)
            event_type: Type of webhook event
            payload: Event payload data
            priority: Job priority (higher = more important)
        
        Returns:
            Job ID or existing job ID if duplicate
        """
        # Check for duplicate events
        existing_event = self.db.query(WebhookEvent).filter(
            WebhookEvent.event_id == event_id,
            WebhookEvent.provider == provider
        ).first()
        
        if existing_event and existing_event.status == "processed":
            logger.info(f"Webhook event {event_id} already processed")
            return f"duplicate_{existing_event.id}"
        
        job_id = f"webhook_{provider}_{event_id}"
        
        job = self.queue.enqueue(
            process_webhook_event,
            event_id,
            provider,
            event_type,
            payload,
            timeout=settings.JOB_TIMEOUT,
            retry=settings.WORKER_RETRY_ATTEMPTS,
            job_id=job_id
        )
        
        # Track job in database
        self._create_job_record(
            job.id,
            "webhook_processing",
            {
                "event_id": event_id,
                "provider": provider,
                "event_type": event_type
            },
            priority=priority
        )
        
        logger.info(f"Enqueued webhook processing job {job.id} for {provider} event {event_id}")
        return job.id
    
    def enqueue_reputation_update(
        self,
        user_ids: Optional[List[str]] = None,
        delay: Optional[int] = None
    ) -> str:
        """
        Enqueue a reputation score update job.
        
        Args:
            user_ids: Optional list of specific user IDs to update
            delay: Optional delay in seconds before processing
        
        Returns:
            Job ID
        """
        job_kwargs = {
            'timeout': settings.JOB_TIMEOUT,
            'retry': settings.WORKER_RETRY_ATTEMPTS,
            'job_id': f"reputation_update_{datetime.utcnow().isoformat()}"
        }
        
        if delay:
            job_kwargs['delay'] = timedelta(seconds=delay)
        
        job = self.queue.enqueue(
            update_reputation_scores,
            user_ids,
            **job_kwargs
        )
        
        # Track job in database
        self._create_job_record(
            job.id,
            "reputation_update",
            {"user_ids": user_ids}
        )
        
        logger.info(f"Enqueued reputation update job {job.id}")
        return job.id
    
    def schedule_periodic_cleanup(self) -> str:
        """Schedule periodic cleanup job for expired sessions."""
        job = self.queue.enqueue(
            cleanup_expired_sessions,
            timeout=settings.JOB_TIMEOUT,
            job_id=f"cleanup_{datetime.utcnow().strftime('%Y%m%d_%H')}"  # Hourly cleanup
        )
        
        self._create_job_record(
            job.id,
            "session_cleanup",
            {}
        )
        
        logger.info(f"Scheduled cleanup job {job.id}")
        return job.id
    
    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a background job."""
        try:
            job = Job.fetch(job_id, connection=self.redis_conn)
            
            # Get database record
            db_record = self.db.query(JobQueue).filter(
                JobQueue.job_id == job_id
            ).first()
            
            return {
                "job_id": job_id,
                "status": job.get_status(),
                "result": job.result,
                "exc_info": job.exc_info,
                "created_at": job.created_at.isoformat() if job.created_at else None,
                "started_at": job.started_at.isoformat() if job.started_at else None,
                "ended_at": job.ended_at.isoformat() if job.ended_at else None,
                "retry_count": db_record.retry_count if db_record else 0
            }
        except Exception as e:
            logger.error(f"Error fetching job status for {job_id}: {e}")
            return None
    
    def cancel_job(self, job_id: str) -> bool:
        """Cancel a pending job."""
        try:
            job = Job.fetch(job_id, connection=self.redis_conn)
            job.cancel()
            
            # Update database record
            db_record = self.db.query(JobQueue).filter(
                JobQueue.job_id == job_id
            ).first()
            if db_record:
                db_record.status = "cancelled"
                db_record.completed_at = datetime.utcnow()
                self.db.commit()
            
            logger.info(f"Cancelled job {job_id}")
            return True
        except Exception as e:
            logger.error(f"Error cancelling job {job_id}: {e}")
            return False
    
    def get_queue_stats(self) -> Dict[str, Any]:
        """Get queue statistics and health metrics."""
        try:
            return {
                "queue_length": len(self.queue),
                "failed_jobs": len(self.queue.failed_job_registry),
                "scheduled_jobs": len(self.queue.scheduled_job_registry),
                "started_jobs": len(self.queue.started_job_registry),
                "deferred_jobs": len(self.queue.deferred_job_registry),
                "workers": len(Worker.all(connection=self.redis_conn))
            }
        except Exception as e:
            logger.error(f"Error getting queue stats: {e}")
            return {}
    
    def get_failed_jobs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get list of failed jobs for debugging."""
        failed_jobs = []
        try:
            for job_id in self.queue.failed_job_registry.get_job_ids()[:limit]:
                job = Job.fetch(job_id, connection=self.redis_conn)
                failed_jobs.append({
                    "job_id": job_id,
                    "func_name": job.func_name,
                    "args": job.args,
                    "kwargs": job.kwargs,
                    "exc_info": job.exc_info,
                    "failed_at": job.ended_at.isoformat() if job.ended_at else None
                })
        except Exception as e:
            logger.error(f"Error getting failed jobs: {e}")
        
        return failed_jobs
    
    def requeue_failed_job(self, job_id: str) -> bool:
        """Requeue a failed job."""
        try:
            job = Job.fetch(job_id, connection=self.redis_conn)
            self.queue.requeue(job_id)
            
            # Update database record
            db_record = self.db.query(JobQueue).filter(
                JobQueue.job_id == job_id
            ).first()
            if db_record:
                db_record.status = "pending"
                db_record.retry_count += 1
                db_record.error_message = None
                self.db.commit()
            
            logger.info(f"Requeued failed job {job_id}")
            return True
        except Exception as e:
            logger.error(f"Error requeuing job {job_id}: {e}")
            return False
    
    def move_to_dlq(self, job_id: str, error_message: str) -> bool:
        """Move a job to dead letter queue after max retries."""
        try:
            db_record = self.db.query(JobQueue).filter(
                JobQueue.job_id == job_id
            ).first()
            
            if db_record:
                # Create DLQ entry
                dlq_entry = DeadLetterQueue(
                    original_job_id=job_id,
                    job_type=db_record.job_type,
                    payload=db_record.payload,
                    final_error=error_message,
                    retry_count=db_record.retry_count,
                    original_created_at=db_record.created_at
                )
                self.db.add(dlq_entry)
                
                # Update original job status
                db_record.status = "dead_letter"
                db_record.error_message = error_message
                db_record.completed_at = datetime.utcnow()
                
                self.db.commit()
                logger.info(f"Moved job {job_id} to dead letter queue")
                return True
        except Exception as e:
            logger.error(f"Error moving job {job_id} to DLQ: {e}")
        
        return False
    
    def _create_job_record(
        self,
        job_id: str,
        job_type: str,
        payload: Dict[str, Any],
        priority: int = 0
    ) -> None:
        """Create a database record for tracking the job."""
        try:
            job_record = JobQueue(
                job_id=job_id,
                job_type=job_type,
                payload=payload,
                priority=priority,
                max_retries=settings.WORKER_RETRY_ATTEMPTS
            )
            self.db.add(job_record)
            self.db.commit()
        except Exception as e:
            logger.error(f"Error creating job record for {job_id}: {e}")
            self.db.rollback()
