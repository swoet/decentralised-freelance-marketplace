from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from decimal import Decimal
import json
import logging
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from uuid import UUID

from app.models.smart_escrow import (
    SmartEscrow, SmartMilestone, MilestoneCondition, MilestoneDeliverable,
    EscrowDispute, EscrowAutomationEvent,
    EscrowStatus, MilestoneStatus, MilestoneType, ConditionType, 
    DisputeStatus, AutomationEventType
)
from app.models.financial import Currency
from app.models.user import User
from app.models.project import Project
from app.schemas.escrow import (
    SmartEscrowCreate, SmartEscrowUpdate, SmartEscrowFilter,
    SmartMilestoneCreate, SmartMilestoneUpdate, SmartMilestoneFilter,
    MilestoneConditionCreate, MilestoneConditionUpdate,
    MilestoneDeliverableCreate, MilestoneDeliverableUpdate,
    EscrowDisputeCreate, EscrowDisputeUpdate,
    EscrowAutomationEventCreate,
    MilestoneSubmissionSchema, MilestoneApprovalSchema, EscrowReleaseSchema
)

logger = logging.getLogger(__name__)


class SmartEscrowService:
    """Advanced smart escrow service with milestone automation and dispute resolution"""
    
    def __init__(self, db: Session):
        self.db = db
        # TODO: Re-enable these services when they're available
        # self.multi_currency_service = MultiCurrencyService(db)
        # self.reputation_service = ReputationService(db)
        # self.notification_service = NotificationService()
    
    # === NEW SYNCHRONOUS API METHODS ===
    
    def create_smart_escrow(self, escrow_data: SmartEscrowCreate, user_id: str) -> SmartEscrow:
        """Create a new smart escrow"""
        try:
            # Validate currency exists
            currency = self.db.query(Currency).filter(
                Currency.id == escrow_data.currency_id
            ).first()
            if not currency:
                raise ValueError("Currency not found")
            
            # Validate project exists and user has access
            project = self.db.query(Project).filter(
                Project.id == escrow_data.project_id
            ).first()
            if not project:
                raise ValueError("Project not found")
            
            # Create smart escrow
            escrow = SmartEscrow(
                project_id=escrow_data.project_id,
                client_id=escrow_data.client_id,
                freelancer_id=escrow_data.freelancer_id,
                total_amount=escrow_data.total_amount,
                currency_id=escrow_data.currency_id,
                is_automated=escrow_data.is_automated,
                automation_enabled=escrow_data.automation_enabled,
                auto_release_delay_hours=escrow_data.auto_release_delay_hours,
                chain_id=escrow_data.chain_id,
                payment_mode=escrow_data.payment_mode,
                token_address=escrow_data.token_address,
                reputation_impact_enabled=escrow_data.reputation_impact_enabled,
                quality_threshold=escrow_data.quality_threshold,
                meta_data=escrow_data.metadata or {},
                terms_hash=escrow_data.terms_hash
            )
            
            self.db.add(escrow)
            self.db.flush()  # Get the ID
            
            # Log creation event
            self._log_automation_event(
                escrow.id, None, AutomationEventType.CONDITION_MET,
                "Escrow Created", "Smart escrow successfully created",
                {"created_by": user_id, "total_amount": str(escrow_data.total_amount)}
            )
            
            self.db.commit()
            return escrow
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating smart escrow: {str(e)}")
            raise
    
    def list_smart_escrows(
        self, 
        filters: SmartEscrowFilter, 
        skip: int = 0, 
        limit: int = 20,
        user_id: str = None
    ) -> Tuple[List[SmartEscrow], int]:
        """List smart escrows with filtering"""
        query = self.db.query(SmartEscrow)
        
        # Apply filters
        if filters.project_id:
            query = query.filter(SmartEscrow.project_id == filters.project_id)
        if filters.client_id:
            query = query.filter(SmartEscrow.client_id == filters.client_id)
        if filters.freelancer_id:
            query = query.filter(SmartEscrow.freelancer_id == filters.freelancer_id)
        if filters.status:
            if isinstance(filters.status, list):
                query = query.filter(SmartEscrow.status.in_(filters.status))
            else:
                query = query.filter(SmartEscrow.status == filters.status)
        if filters.is_automated is not None:
            query = query.filter(SmartEscrow.is_automated == filters.is_automated)
        if filters.automation_enabled is not None:
            query = query.filter(SmartEscrow.automation_enabled == filters.automation_enabled)
        if filters.chain_id:
            query = query.filter(SmartEscrow.chain_id == filters.chain_id)
        if filters.payment_mode:
            query = query.filter(SmartEscrow.payment_mode == filters.payment_mode)
        if filters.created_after:
            query = query.filter(SmartEscrow.created_at >= filters.created_after)
        if filters.created_before:
            query = query.filter(SmartEscrow.created_at <= filters.created_before)
        
        # Security: Users can only see escrows they're involved in
        if user_id:
            query = query.filter(
                or_(
                    SmartEscrow.client_id == user_id,
                    SmartEscrow.freelancer_id == user_id
                )
            )
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination and get results
        escrows = query.offset(skip).limit(limit).all()
        
        return escrows, total_count
    
    def get_smart_escrow(self, escrow_id: UUID, user_id: str = None) -> Optional[SmartEscrow]:
        """Get a specific smart escrow by ID"""
        query = self.db.query(SmartEscrow).filter(SmartEscrow.id == escrow_id)
        
        # Security: Users can only access escrows they're involved in
        if user_id:
            query = query.filter(
                or_(
                    SmartEscrow.client_id == user_id,
                    SmartEscrow.freelancer_id == user_id
                )
            )
        
        return query.first()
    
    def update_smart_escrow(
        self, 
        escrow_id: UUID, 
        update_data: SmartEscrowUpdate, 
        user_id: str
    ) -> Optional[SmartEscrow]:
        """Update a smart escrow"""
        try:
            escrow = self.get_smart_escrow(escrow_id, user_id)
            if not escrow:
                return None
            
            # Only client can update most fields
            if user_id != escrow.client_id:
                raise ValueError("Only client can update escrow")
            
            # Apply updates
            update_dict = update_data.dict(exclude_unset=True)
            for field, value in update_dict.items():
                if hasattr(escrow, field):
                    setattr(escrow, field, value)
            
            escrow.updated_at = datetime.utcnow()
            
            self._log_automation_event(
                escrow.id, None, AutomationEventType.CONDITION_MET,
                "Escrow Updated", f"Escrow updated by user {user_id}",
                {"updated_fields": list(update_dict.keys())}
            )
            
            self.db.commit()
            return escrow
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating smart escrow {escrow_id}: {str(e)}")
            raise
    
    def delete_smart_escrow(self, escrow_id: UUID, user_id: str) -> bool:
        """Delete a smart escrow (only if in draft status)"""
        try:
            escrow = self.get_smart_escrow(escrow_id, user_id)
            if not escrow:
                return False
            
            if escrow.status != EscrowStatus.DRAFT:
                raise ValueError("Can only delete escrows in draft status")
            
            if user_id != escrow.client_id:
                raise ValueError("Only client can delete escrow")
            
            self.db.delete(escrow)
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting smart escrow {escrow_id}: {str(e)}")
            raise
    
    # === MILESTONE METHODS ===
    
    def create_milestone(self, milestone_data: SmartMilestoneCreate, user_id: str) -> Optional[SmartMilestone]:
        """Create a new milestone"""
        try:
            # Validate escrow exists and user has access
            escrow = self.get_smart_escrow(milestone_data.escrow_id, user_id)
            if not escrow:
                return None
            
            if user_id != escrow.client_id:
                raise ValueError("Only client can create milestones")
            
            milestone = SmartMilestone(
                escrow_id=milestone_data.escrow_id,
                project_id=milestone_data.project_id,
                title=milestone_data.title,
                description=milestone_data.description,
                amount=milestone_data.amount,
                order_index=milestone_data.order_index,
                milestone_type=milestone_data.milestone_type,
                is_automated=milestone_data.is_automated,
                auto_release_enabled=milestone_data.auto_release_enabled,
                approval_required=milestone_data.approval_required,
                due_date=milestone_data.due_date,
                auto_release_date=milestone_data.auto_release_date,
                grace_period_hours=milestone_data.grace_period_hours,
                deliverable_requirements=milestone_data.deliverable_requirements or {},
                quality_criteria=milestone_data.quality_criteria or {},
                acceptance_criteria=milestone_data.acceptance_criteria,
                meta_data=milestone_data.metadata or {}
            )
            
            self.db.add(milestone)
            self.db.commit()
            return milestone
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating milestone: {str(e)}")
            raise
    
    def list_milestones(
        self, 
        filters: SmartMilestoneFilter, 
        skip: int = 0, 
        limit: int = 20,
        user_id: str = None
    ) -> Tuple[List[SmartMilestone], int]:
        """List milestones with filtering"""
        query = self.db.query(SmartMilestone)
        
        # Apply filters
        if filters.escrow_id:
            query = query.filter(SmartMilestone.escrow_id == filters.escrow_id)
        if filters.project_id:
            query = query.filter(SmartMilestone.project_id == filters.project_id)
        if filters.status:
            if isinstance(filters.status, list):
                query = query.filter(SmartMilestone.status.in_(filters.status))
            else:
                query = query.filter(SmartMilestone.status == filters.status)
        if filters.milestone_type:
            query = query.filter(SmartMilestone.milestone_type == filters.milestone_type)
        if filters.is_automated is not None:
            query = query.filter(SmartMilestone.is_automated == filters.is_automated)
        if filters.auto_release_enabled is not None:
            query = query.filter(SmartMilestone.auto_release_enabled == filters.auto_release_enabled)
        if filters.due_before:
            query = query.filter(SmartMilestone.due_date <= filters.due_before)
        if filters.due_after:
            query = query.filter(SmartMilestone.due_date >= filters.due_after)
        
        # Security: Users can only see milestones from escrows they're involved in
        if user_id:
            query = query.join(SmartEscrow).filter(
                or_(
                    SmartEscrow.client_id == user_id,
                    SmartEscrow.freelancer_id == user_id
                )
            )
        
        total_count = query.count()
        milestones = query.offset(skip).limit(limit).all()
        
        return milestones, total_count
    
    def get_milestone(self, milestone_id: UUID, user_id: str = None) -> Optional[SmartMilestone]:
        """Get a specific milestone by ID"""
        query = self.db.query(SmartMilestone).filter(SmartMilestone.id == milestone_id)
        
        if user_id:
            query = query.join(SmartEscrow).filter(
                or_(
                    SmartEscrow.client_id == user_id,
                    SmartEscrow.freelancer_id == user_id
                )
            )
        
        return query.first()
    
    def update_milestone(self, milestone_id: UUID, update_data: SmartMilestoneUpdate, user_id: str) -> Optional[SmartMilestone]:
        """Update a milestone"""
        try:
            milestone = self.get_milestone(milestone_id, user_id)
            if not milestone:
                return None
            
            # Apply updates
            update_dict = update_data.dict(exclude_unset=True)
            for field, value in update_dict.items():
                if hasattr(milestone, field):
                    setattr(milestone, field, value)
            
            milestone.updated_at = datetime.utcnow()
            self.db.commit()
            return milestone
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating milestone {milestone_id}: {str(e)}")
            raise
    
    def submit_milestone(self, milestone_id: UUID, submission_data: MilestoneSubmissionSchema, user_id: str) -> bool:
        """Submit a milestone for review (freelancer only)"""
        try:
            milestone = self.get_milestone(milestone_id, user_id)
            if not milestone:
                return False
            
            escrow = milestone.escrow
            if escrow.freelancer_id != user_id:
                raise ValueError("Only freelancer can submit milestones")
            
            if milestone.status not in [MilestoneStatus.PENDING, MilestoneStatus.IN_PROGRESS]:
                raise ValueError(f"Cannot submit milestone in status {milestone.status}")
            
            # Update milestone
            milestone.status = MilestoneStatus.SUBMITTED
            milestone.submitted_at = datetime.utcnow()
            milestone.submission_data = submission_data.dict()
            
            self._log_automation_event(
                escrow.id, milestone_id, AutomationEventType.CONDITION_MET,
                "Milestone Submitted", "Freelancer submitted milestone",
                {"submission_notes": submission_data.submission_notes}
            )
            
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error submitting milestone {milestone_id}: {str(e)}")
            raise
    
    def approve_milestone(self, milestone_id: UUID, approval_data: MilestoneApprovalSchema, user_id: str) -> bool:
        """Approve or reject a milestone (client only)"""
        try:
            milestone = self.get_milestone(milestone_id, user_id)
            if not milestone:
                return False
            
            escrow = milestone.escrow
            if escrow.client_id != user_id:
                raise ValueError("Only client can approve milestones")
            
            if milestone.status != MilestoneStatus.SUBMITTED:
                raise ValueError(f"Cannot approve milestone in status {milestone.status}")
            
            if approval_data.approved:
                milestone.status = MilestoneStatus.APPROVED
                milestone.approved_at = datetime.utcnow()
                # TODO: Release funds logic
            else:
                milestone.status = MilestoneStatus.REJECTED
            
            self._log_automation_event(
                escrow.id, milestone_id, AutomationEventType.CONDITION_MET,
                "Milestone Approved" if approval_data.approved else "Milestone Rejected",
                f"Client {'approved' if approval_data.approved else 'rejected'} milestone",
                {"feedback": approval_data.feedback, "quality_score": str(approval_data.quality_score) if approval_data.quality_score else None}
            )
            
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error approving milestone {milestone_id}: {str(e)}")
            raise
    
    # === CONDITION METHODS ===
    
    def create_milestone_condition(self, condition_data: MilestoneConditionCreate, user_id: str) -> Optional[MilestoneCondition]:
        """Create a milestone condition"""
        try:
            milestone = self.get_milestone(condition_data.milestone_id, user_id)
            if not milestone:
                return None
            
            condition = MilestoneCondition(
                milestone_id=condition_data.milestone_id,
                condition_type=condition_data.condition_type,
                name=condition_data.name,
                description=condition_data.description,
                config=condition_data.config,
                is_required=condition_data.is_required,
                weight=condition_data.weight
            )
            
            self.db.add(condition)
            self.db.commit()
            return condition
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating milestone condition: {str(e)}")
            raise
    
    def list_milestone_conditions(self, milestone_id: UUID, user_id: str) -> List[MilestoneCondition]:
        """List conditions for a milestone"""
        milestone = self.get_milestone(milestone_id, user_id)
        if not milestone:
            return []
        
        return self.db.query(MilestoneCondition).filter(
            MilestoneCondition.milestone_id == milestone_id
        ).all()
    
    def update_milestone_condition(self, condition_id: UUID, update_data: MilestoneConditionUpdate, user_id: str) -> Optional[MilestoneCondition]:
        """Update a milestone condition"""
        try:
            condition = self.db.query(MilestoneCondition).filter(
                MilestoneCondition.id == condition_id
            ).first()
            if not condition:
                return None
            
            # Check user access via milestone
            milestone = self.get_milestone(condition.milestone_id, user_id)
            if not milestone:
                return None
            
            # Apply updates
            update_dict = update_data.dict(exclude_unset=True)
            for field, value in update_dict.items():
                if hasattr(condition, field):
                    setattr(condition, field, value)
            
            condition.updated_at = datetime.utcnow()
            self.db.commit()
            return condition
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating condition {condition_id}: {str(e)}")
            raise
    
    # === DELIVERABLE METHODS ===
    
    def create_milestone_deliverable(self, deliverable_data: MilestoneDeliverableCreate, user_id: str) -> Optional[MilestoneDeliverable]:
        """Create a milestone deliverable"""
        try:
            milestone = self.get_milestone(deliverable_data.milestone_id, user_id)
            if not milestone:
                return None
            
            deliverable = MilestoneDeliverable(
                milestone_id=deliverable_data.milestone_id,
                name=deliverable_data.name,
                description=deliverable_data.description,
                file_url=deliverable_data.file_url,
                file_type=deliverable_data.file_type,
                file_size=deliverable_data.file_size,
                file_hash=deliverable_data.file_hash,
                meta_data=deliverable_data.metadata or {}
            )
            
            self.db.add(deliverable)
            self.db.commit()
            return deliverable
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating deliverable: {str(e)}")
            raise
    
    def list_milestone_deliverables(self, milestone_id: UUID, user_id: str) -> List[MilestoneDeliverable]:
        """List deliverables for a milestone"""
        milestone = self.get_milestone(milestone_id, user_id)
        if not milestone:
            return []
        
        return self.db.query(MilestoneDeliverable).filter(
            MilestoneDeliverable.milestone_id == milestone_id
        ).all()
    
    def update_milestone_deliverable(self, deliverable_id: UUID, update_data: MilestoneDeliverableUpdate, user_id: str) -> Optional[MilestoneDeliverable]:
        """Update a deliverable"""
        try:
            deliverable = self.db.query(MilestoneDeliverable).filter(
                MilestoneDeliverable.id == deliverable_id
            ).first()
            if not deliverable:
                return None
            
            # Check user access via milestone
            milestone = self.get_milestone(deliverable.milestone_id, user_id)
            if not milestone:
                return None
            
            # Apply updates
            update_dict = update_data.dict(exclude_unset=True)
            for field, value in update_dict.items():
                if hasattr(deliverable, field):
                    setattr(deliverable, field, value)
            
            deliverable.updated_at = datetime.utcnow()
            self.db.commit()
            return deliverable
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating deliverable {deliverable_id}: {str(e)}")
            raise
    
    # === DISPUTE METHODS ===
    
    def create_dispute(self, dispute_data: EscrowDisputeCreate, user_id: str) -> Optional[EscrowDispute]:
        """Create a dispute"""
        try:
            escrow = self.get_smart_escrow(dispute_data.escrow_id, user_id)
            if not escrow:
                return None
            
            if user_id not in [escrow.client_id, escrow.freelancer_id]:
                raise ValueError("Only client or freelancer can create disputes")
            
            dispute = EscrowDispute(
                escrow_id=dispute_data.escrow_id,
                milestone_id=dispute_data.milestone_id,
                raised_by=dispute_data.raised_by,
                dispute_type=dispute_data.dispute_type,
                title=dispute_data.title,
                description=dispute_data.description,
                disputed_amount=dispute_data.disputed_amount,
                priority=dispute_data.priority,
                evidence_urls=dispute_data.evidence_urls or [],
                meta_data=dispute_data.metadata or {}
            )
            
            # Set deadlines
            dispute.response_deadline = datetime.utcnow() + timedelta(days=3)
            dispute.resolution_deadline = datetime.utcnow() + timedelta(days=14)
            dispute.auto_escalate_at = datetime.utcnow() + timedelta(days=21)
            
            self.db.add(dispute)
            escrow.status = EscrowStatus.DISPUTE_RAISED
            
            self._log_automation_event(
                escrow.id, dispute_data.milestone_id, AutomationEventType.DISPUTE_AUTO_RAISED,
                "Dispute Created", f"Dispute raised: {dispute.title}",
                {"dispute_type": dispute.dispute_type, "raised_by": user_id}
            )
            
            self.db.commit()
            return dispute
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating dispute: {str(e)}")
            raise
    
    def list_disputes(self, escrow_id: UUID, user_id: str) -> List[EscrowDispute]:
        """List disputes for an escrow"""
        escrow = self.get_smart_escrow(escrow_id, user_id)
        if not escrow:
            return []
        
        return self.db.query(EscrowDispute).filter(
            EscrowDispute.escrow_id == escrow_id
        ).all()
    
    def update_dispute(self, dispute_id: UUID, update_data: EscrowDisputeUpdate, user_id: str) -> Optional[EscrowDispute]:
        """Update a dispute"""
        try:
            dispute = self.db.query(EscrowDispute).filter(
                EscrowDispute.id == dispute_id
            ).first()
            if not dispute:
                return None
            
            # Check access
            escrow = self.get_smart_escrow(dispute.escrow_id, user_id)
            if not escrow:
                return None
            
            # Apply updates
            update_dict = update_data.dict(exclude_unset=True)
            for field, value in update_dict.items():
                if hasattr(dispute, field):
                    setattr(dispute, field, value)
            
            dispute.updated_at = datetime.utcnow()
            self.db.commit()
            return dispute
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating dispute {dispute_id}: {str(e)}")
            raise
    
    # === AUTOMATION METHODS ===
    
    def release_funds(self, escrow_id: UUID, release_data: EscrowReleaseSchema, user_id: str) -> bool:
        """Release escrow funds"""
        try:
            escrow = self.get_smart_escrow(escrow_id, user_id)
            if not escrow:
                return False
            
            # TODO: Implement fund release logic
            # This would interact with payment/blockchain systems
            
            self._log_automation_event(
                escrow.id, None, AutomationEventType.AUTO_RELEASE,
                "Funds Released", "Manual fund release triggered",
                {"released_by": user_id, "notes": release_data.release_notes}
            )
            
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error releasing funds for escrow {escrow_id}: {str(e)}")
            raise
    
    def process_automation(self, escrow_id: UUID, user_id: str) -> bool:
        """Process automation for an escrow"""
        try:
            escrow = self.get_smart_escrow(escrow_id, user_id)
            if not escrow:
                return False
            
            # TODO: Implement automation processing logic
            
            self._log_automation_event(
                escrow.id, None, AutomationEventType.CONDITION_MET,
                "Automation Processed", "Manual automation processing triggered",
                {"triggered_by": user_id}
            )
            
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error processing automation for escrow {escrow_id}: {str(e)}")
            raise
    
    def list_automation_events(self, escrow_id: UUID, limit: int, user_id: str) -> List[EscrowAutomationEvent]:
        """List automation events for an escrow"""
        escrow = self.get_smart_escrow(escrow_id, user_id)
        if not escrow:
            return []
        
        return self.db.query(EscrowAutomationEvent).filter(
            EscrowAutomationEvent.escrow_id == escrow_id
        ).order_by(EscrowAutomationEvent.created_at.desc()).limit(limit).all()
    
    def _log_automation_event(
        self,
        escrow_id: UUID,
        milestone_id: Optional[UUID],
        event_type: AutomationEventType,
        event_name: str,
        description: str,
        event_data: Dict[str, Any] = None
    ) -> None:
        """Log an automation event (synchronous version)"""
        try:
            event = EscrowAutomationEvent(
                escrow_id=escrow_id,
                milestone_id=milestone_id,
                event_type=event_type,
                event_name=event_name,
                description=description,
                event_data=event_data or {},
                triggered_by="system",
                processed_by="smart_escrow_service"
            )
            self.db.add(event)
            
        except Exception as e:
            logger.error(f"Error logging automation event: {str(e)}")
        
    async def create_smart_escrow(
        self,
        project_id: str,
        client_id: str,
        freelancer_id: str,
        total_amount: Decimal,
        currency_code: str,
        milestones_data: List[Dict[str, Any]],
        automation_config: Dict[str, Any] = None
    ) -> SmartEscrow:
        """Create a new smart escrow with milestones and automation"""
        try:
            # Get currency
            currency = self.db.query(Currency).filter(
                Currency.code == currency_code
            ).first()
            if not currency:
                raise ValueError(f"Currency {currency_code} not found")
            
            # Validate project exists
            project = self.db.query(Project).filter(Project.id == project_id).first()
            if not project:
                raise ValueError(f"Project {project_id} not found")
            
            # Create smart escrow
            escrow = SmartEscrow(
                project_id=project_id,
                client_id=client_id,
                freelancer_id=freelancer_id,
                total_amount=total_amount,
                currency_id=currency.id,
                is_automated=automation_config.get('is_automated', True) if automation_config else True,
                automation_enabled=automation_config.get('automation_enabled', True) if automation_config else True,
                auto_release_delay_hours=automation_config.get('auto_release_delay_hours', 72) if automation_config else 72,
                reputation_impact_enabled=automation_config.get('reputation_impact_enabled', True) if automation_config else True,
                quality_threshold=automation_config.get('quality_threshold', 4.0) if automation_config else 4.0,
                meta_data=automation_config.get('metadata', {}) if automation_config else {}
            )
            self.db.add(escrow)
            self.db.flush()  # Get the ID
            
            # Create milestones
            total_milestone_amount = Decimal('0')
            for i, milestone_data in enumerate(milestones_data):
                milestone = await self._create_milestone(escrow.id, project_id, milestone_data, i)
                total_milestone_amount += milestone.amount
            
            # Validate milestone amounts equal total
            if total_milestone_amount != total_amount:
                raise ValueError(f"Milestone amounts ({total_milestone_amount}) don't equal total amount ({total_amount})")
            
            # Log creation event
            await self._log_automation_event(
                escrow.id, None, AutomationEventType.CONDITION_MET,
                "Escrow Created", "Smart escrow successfully created with milestones",
                {"milestone_count": len(milestones_data), "total_amount": str(total_amount)}
            )
            
            self.db.commit()
            return escrow
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating smart escrow: {str(e)}")
            raise
    
    async def _create_milestone(
        self, 
        escrow_id: str, 
        project_id: str, 
        milestone_data: Dict[str, Any], 
        order_index: int
    ) -> SmartMilestone:
        """Create a milestone with automation conditions"""
        milestone = SmartMilestone(
            escrow_id=escrow_id,
            project_id=project_id,
            title=milestone_data['title'],
            description=milestone_data['description'],
            amount=Decimal(str(milestone_data['amount'])),
            order_index=order_index,
            milestone_type=MilestoneType(milestone_data.get('type', 'manual')),
            is_automated=milestone_data.get('is_automated', False),
            auto_release_enabled=milestone_data.get('auto_release_enabled', False),
            approval_required=milestone_data.get('approval_required', True),
            due_date=milestone_data.get('due_date'),
            grace_period_hours=milestone_data.get('grace_period_hours', 24),
            deliverable_requirements=milestone_data.get('deliverable_requirements', {}),
            quality_criteria=milestone_data.get('quality_criteria', {}),
            acceptance_criteria=milestone_data.get('acceptance_criteria'),
            meta_data=milestone_data.get('metadata', {})
        )
        
        # Set auto-release date if applicable
        if milestone.auto_release_enabled and milestone.due_date:
            milestone.auto_release_date = milestone.due_date + timedelta(
                hours=milestone.grace_period_hours
            )
        
        self.db.add(milestone)
        self.db.flush()
        
        # Create automation conditions if specified
        if 'conditions' in milestone_data:
            for condition_data in milestone_data['conditions']:
                await self._create_milestone_condition(milestone.id, condition_data)
        
        return milestone
    
    async def _create_milestone_condition(
        self, milestone_id: str, condition_data: Dict[str, Any]
    ) -> MilestoneCondition:
        """Create an automation condition for a milestone"""
        condition = MilestoneCondition(
            milestone_id=milestone_id,
            condition_type=ConditionType(condition_data['type']),
            name=condition_data['name'],
            description=condition_data.get('description'),
            config=condition_data.get('config', {}),
            is_required=condition_data.get('is_required', True),
            weight=Decimal(str(condition_data.get('weight', 1.0)))
        )
        self.db.add(condition)
        return condition
    
    async def activate_escrow(self, escrow_id: str, user_id: str) -> bool:
        """Activate an escrow (move from draft to active)"""
        try:
            escrow = self.db.query(SmartEscrow).filter(SmartEscrow.id == escrow_id).first()
            if not escrow:
                raise ValueError("Escrow not found")
            
            if escrow.status != EscrowStatus.DRAFT:
                raise ValueError(f"Cannot activate escrow in status {escrow.status.value}")
            
            if escrow.client_id != user_id:
                raise ValueError("Only client can activate escrow")
            
            # TODO: Validate payment/funding
            
            escrow.status = EscrowStatus.ACTIVE
            escrow.activated_at = datetime.utcnow()
            
            # Activate first milestone
            first_milestone = self.db.query(SmartMilestone).filter(
                and_(SmartMilestone.escrow_id == escrow_id, SmartMilestone.order_index == 0)
            ).first()
            
            if first_milestone:
                first_milestone.status = MilestoneStatus.IN_PROGRESS
            
            await self._log_automation_event(
                escrow_id, None, AutomationEventType.CONDITION_MET,
                "Escrow Activated", "Escrow moved to active status",
                {"activated_by": user_id}
            )
            
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error activating escrow {escrow_id}: {str(e)}")
            raise
    
    async def submit_milestone_deliverable(
        self,
        milestone_id: str,
        freelancer_id: str,
        deliverable_data: Dict[str, Any]
    ) -> MilestoneDeliverable:
        """Submit a deliverable for a milestone"""
        try:
            milestone = self.db.query(SmartMilestone).filter(
                SmartMilestone.id == milestone_id
            ).first()
            if not milestone:
                raise ValueError("Milestone not found")
            
            escrow = milestone.escrow
            if escrow.freelancer_id != freelancer_id:
                raise ValueError("Only assigned freelancer can submit deliverables")
            
            if milestone.status not in [MilestoneStatus.PENDING, MilestoneStatus.IN_PROGRESS]:
                raise ValueError(f"Cannot submit deliverable for milestone in status {milestone.status.value}")
            
            # Create deliverable
            deliverable = MilestoneDeliverable(
                milestone_id=milestone_id,
                name=deliverable_data['name'],
                description=deliverable_data.get('description'),
                file_url=deliverable_data.get('file_url'),
                file_type=deliverable_data.get('file_type'),
                file_size=deliverable_data.get('file_size'),
                file_hash=deliverable_data.get('file_hash'),
                meta_data=deliverable_data.get('metadata', {})
            )
            self.db.add(deliverable)
            
            # Update milestone status
            milestone.status = MilestoneStatus.SUBMITTED
            milestone.submitted_at = datetime.utcnow()
            milestone.submission_data = deliverable_data
            
            # Evaluate automation conditions
            await self._evaluate_milestone_conditions(milestone_id)
            
            await self._log_automation_event(
                escrow.id, milestone_id, AutomationEventType.CONDITION_MET,
                "Deliverable Submitted", "Freelancer submitted milestone deliverable",
                {"deliverable_name": deliverable.name, "file_type": deliverable.file_type}
            )
            
            self.db.commit()
            return deliverable
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error submitting deliverable for milestone {milestone_id}: {str(e)}")
            raise
    
    async def approve_milestone(
        self,
        milestone_id: str,
        client_id: str,
        approval_notes: str = None,
        quality_score: float = None
    ) -> bool:
        """Client approves a milestone"""
        try:
            milestone = self.db.query(SmartMilestone).filter(
                SmartMilestone.id == milestone_id
            ).first()
            if not milestone:
                raise ValueError("Milestone not found")
            
            escrow = milestone.escrow
            if escrow.client_id != client_id:
                raise ValueError("Only client can approve milestones")
            
            if milestone.status != MilestoneStatus.SUBMITTED:
                raise ValueError(f"Cannot approve milestone in status {milestone.status.value}")
            
            # Update deliverables
            for deliverable in milestone.deliverables:
                deliverable.is_approved = True
                deliverable.approval_notes = approval_notes
                deliverable.quality_score = quality_score if quality_score else 5.0
                deliverable.approved_at = datetime.utcnow()
            
            milestone.status = MilestoneStatus.APPROVED
            milestone.approved_at = datetime.utcnow()
            
            # Release milestone funds
            await self._release_milestone_funds(milestone_id)
            
            await self._log_automation_event(
                escrow.id, milestone_id, AutomationEventType.CONDITION_MET,
                "Milestone Approved", "Client approved milestone",
                {"quality_score": quality_score, "notes": approval_notes}
            )
            
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error approving milestone {milestone_id}: {str(e)}")
            raise
    
    async def _release_milestone_funds(self, milestone_id: str) -> bool:
        """Release funds for a completed milestone"""
        try:
            milestone = self.db.query(SmartMilestone).filter(
                SmartMilestone.id == milestone_id
            ).first()
            if not milestone:
                raise ValueError("Milestone not found")
            
            escrow = milestone.escrow
            
            # Update escrow released amount
            escrow.released_amount += milestone.amount
            
            # Update milestone status
            milestone.status = MilestoneStatus.COMPLETED
            milestone.released_at = datetime.utcnow()
            
            # Check if escrow is fully completed
            total_milestones = self.db.query(SmartMilestone).filter(
                SmartMilestone.escrow_id == escrow.id
            ).count()
            completed_milestones = self.db.query(SmartMilestone).filter(
                and_(
                    SmartMilestone.escrow_id == escrow.id,
                    SmartMilestone.status == MilestoneStatus.COMPLETED
                )
            ).count()
            
            if total_milestones == completed_milestones:
                escrow.status = EscrowStatus.COMPLETED
                escrow.completed_at = datetime.utcnow()
                
                # Update reputation
                if escrow.reputation_impact_enabled:
                    await self._update_completion_reputation(escrow)
            
            # Activate next milestone if exists
            else:
                next_milestone = self.db.query(SmartMilestone).filter(
                    and_(
                        SmartMilestone.escrow_id == escrow.id,
                        SmartMilestone.order_index == milestone.order_index + 1
                    )
                ).first()
                
                if next_milestone and next_milestone.status == MilestoneStatus.PENDING:
                    next_milestone.status = MilestoneStatus.IN_PROGRESS
            
            await self._log_automation_event(
                escrow.id, milestone_id, AutomationEventType.AUTO_RELEASE,
                "Funds Released", f"Milestone funds released: {milestone.amount}",
                {"amount": str(milestone.amount), "total_released": str(escrow.released_amount)}
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error releasing milestone funds {milestone_id}: {str(e)}")
            raise
    
    async def _evaluate_milestone_conditions(self, milestone_id: str) -> bool:
        """Evaluate all automation conditions for a milestone"""
        try:
            milestone = self.db.query(SmartMilestone).filter(
                SmartMilestone.id == milestone_id
            ).first()
            if not milestone:
                return False
            
            conditions = self.db.query(MilestoneCondition).filter(
                MilestoneCondition.milestone_id == milestone_id
            ).all()
            
            all_required_met = True
            total_score = Decimal('0')
            total_weight = Decimal('0')
            
            for condition in conditions:
                is_met = await self._evaluate_single_condition(condition)
                
                if condition.is_required and not is_met:
                    all_required_met = False
                
                if is_met:
                    total_score += condition.weight
                total_weight += condition.weight
                
                # Log condition evaluation
                await self._log_automation_event(
                    milestone.escrow_id, milestone_id,
                    AutomationEventType.CONDITION_MET if is_met else AutomationEventType.CONDITION_FAILED,
                    f"Condition Evaluated: {condition.name}",
                    f"Condition {condition.name} evaluated to {is_met}",
                    {"condition_type": condition.condition_type.value, "result": is_met}
                )
            
            # Calculate weighted score
            weighted_score = total_score / total_weight if total_weight > 0 else Decimal('0')
            
            # Auto-release if conditions are met
            if (all_required_met and 
                weighted_score >= Decimal('0.8') and  # 80% threshold
                milestone.auto_release_enabled):
                
                milestone.status = MilestoneStatus.AUTO_RELEASED
                milestone.approved_at = datetime.utcnow()
                await self._release_milestone_funds(milestone_id)
            
            return all_required_met and weighted_score >= Decimal('0.8')
            
        except Exception as e:
            logger.error(f"Error evaluating conditions for milestone {milestone_id}: {str(e)}")
            return False
    
    async def _evaluate_single_condition(self, condition: MilestoneCondition) -> bool:
        """Evaluate a single automation condition"""
        try:
            condition_type = condition.condition_type
            config = condition.config
            milestone = condition.milestone
            
            if condition_type == ConditionType.TIME_DELAY:
                # Check if enough time has passed
                delay_hours = config.get('delay_hours', 24)
                if milestone.submitted_at:
                    time_passed = datetime.utcnow() - milestone.submitted_at
                    return time_passed.total_seconds() >= (delay_hours * 3600)
                return False
            
            elif condition_type == ConditionType.DELIVERABLE_UPLOAD:
                # Check if required deliverables are uploaded
                required_count = config.get('required_count', 1)
                file_types = config.get('file_types', [])
                
                deliverables = milestone.deliverables
                if len(deliverables) < required_count:
                    return False
                
                if file_types:
                    uploaded_types = {d.file_type for d in deliverables}
                    required_types = set(file_types)
                    return required_types.issubset(uploaded_types)
                
                return True
            
            elif condition_type == ConditionType.CLIENT_APPROVAL:
                # Check if client has approved
                return milestone.status == MilestoneStatus.APPROVED
            
            elif condition_type == ConditionType.QUALITY_SCORE:
                # Check if quality meets threshold
                threshold = config.get('threshold', 4.0)
                total_score = Decimal('0')
                count = 0
                
                for deliverable in milestone.deliverables:
                    if deliverable.quality_score is not None:
                        total_score += Decimal(str(deliverable.quality_score))
                        count += 1
                
                if count == 0:
                    return False
                
                average_score = total_score / count
                return average_score >= Decimal(str(threshold))
            
            elif condition_type == ConditionType.REPUTATION_THRESHOLD:
                # Check freelancer reputation
                threshold = config.get('threshold', 4.0)
                freelancer_id = milestone.escrow.freelancer_id
                
                # Get freelancer reputation (simplified)
                freelancer = self.db.query(User).filter(User.id == freelancer_id).first()
                if freelancer and hasattr(freelancer, 'reputation_score'):
                    return freelancer.reputation_score >= threshold
                return True  # Default to true if no reputation system
            
            # Add more condition types as needed...
            
            return False
            
        except Exception as e:
            logger.error(f"Error evaluating condition {condition.id}: {str(e)}")
            return False
        finally:
            # Update condition status
            condition.evaluated_at = datetime.utcnow()
            if hasattr(condition, 'is_met'):
                condition.met_at = datetime.utcnow() if condition.is_met else None
    
    async def raise_dispute(
        self,
        escrow_id: str,
        milestone_id: Optional[str],
        raised_by: str,
        dispute_data: Dict[str, Any]
    ) -> EscrowDispute:
        """Raise a dispute for an escrow or milestone"""
        try:
            escrow = self.db.query(SmartEscrow).filter(SmartEscrow.id == escrow_id).first()
            if not escrow:
                raise ValueError("Escrow not found")
            
            # Validate user can raise dispute
            if raised_by not in [escrow.client_id, escrow.freelancer_id]:
                raise ValueError("Only client or freelancer can raise disputes")
            
            dispute = EscrowDispute(
                escrow_id=escrow_id,
                milestone_id=milestone_id,
                raised_by=raised_by,
                dispute_type=dispute_data['type'],
                title=dispute_data['title'],
                description=dispute_data['description'],
                disputed_amount=Decimal(str(dispute_data['disputed_amount'])),
                priority=dispute_data.get('priority', 'medium'),
                evidence_urls=dispute_data.get('evidence_urls', []),
                meta_data=dispute_data.get('metadata', {})
            )
            
            # Set deadlines
            dispute.response_deadline = datetime.utcnow() + timedelta(days=3)  # 3 days to respond
            dispute.resolution_deadline = datetime.utcnow() + timedelta(days=14)  # 14 days to resolve
            dispute.auto_escalate_at = datetime.utcnow() + timedelta(days=21)  # 21 days to auto-escalate
            
            self.db.add(dispute)
            
            # Update escrow status
            escrow.status = EscrowStatus.DISPUTE_RAISED
            escrow.disputed_amount += dispute.disputed_amount
            
            await self._log_automation_event(
                escrow_id, milestone_id, AutomationEventType.DISPUTE_AUTO_RAISED,
                "Dispute Raised", f"Dispute raised by {'client' if raised_by == escrow.client_id else 'freelancer'}",
                {"dispute_type": dispute.dispute_type, "amount": str(dispute.disputed_amount)}
            )
            
            self.db.commit()
            return dispute
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error raising dispute for escrow {escrow_id}: {str(e)}")
            raise
    
    async def resolve_dispute(
        self,
        dispute_id: str,
        resolution_data: Dict[str, Any],
        resolved_by: str
    ) -> bool:
        """Resolve a dispute with specified resolution"""
        try:
            dispute = self.db.query(EscrowDispute).filter(
                EscrowDispute.id == dispute_id
            ).first()
            if not dispute:
                raise ValueError("Dispute not found")
            
            if dispute.status != DisputeStatus.OPEN:
                raise ValueError(f"Cannot resolve dispute in status {dispute.status.value}")
            
            # Update dispute
            dispute.status = DisputeStatus(resolution_data['status'])
            dispute.resolution = resolution_data['resolution']
            dispute.resolution_amount_client = Decimal(str(resolution_data.get('client_amount', 0)))
            dispute.resolution_amount_freelancer = Decimal(str(resolution_data.get('freelancer_amount', 0)))
            dispute.resolved_at = datetime.utcnow()
            
            # Update escrow
            escrow = dispute.escrow
            escrow.status = EscrowStatus.ACTIVE if resolution_data.get('resume_escrow') else EscrowStatus.COMPLETED
            escrow.disputed_amount -= dispute.disputed_amount
            
            await self._log_automation_event(
                escrow.id, dispute.milestone_id, AutomationEventType.CONDITION_MET,
                "Dispute Resolved", f"Dispute resolved: {dispute.resolution}",
                {"resolution_type": dispute.status.value, "resolved_by": resolved_by}
            )
            
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error resolving dispute {dispute_id}: {str(e)}")
            raise
    
    async def _update_completion_reputation(self, escrow: SmartEscrow) -> None:
        """Update reputation scores upon escrow completion"""
        try:
            # Calculate overall quality score
            total_score = Decimal('0')
            milestone_count = 0
            
            for milestone in escrow.smart_milestones:
                if milestone.status == MilestoneStatus.COMPLETED:
                    for deliverable in milestone.deliverables:
                        if deliverable.quality_score:
                            total_score += Decimal(str(deliverable.quality_score))
                            milestone_count += 1
            
            if milestone_count == 0:
                return
            
            average_quality = total_score / milestone_count
            
            # Update freelancer reputation
            reputation_impact = {
                'project_completed': True,
                'quality_score': float(average_quality),
                'on_time_delivery': True,  # TODO: Check actual timing
                'escrow_amount': float(escrow.total_amount),
                'automation_used': escrow.is_automated
            }
            
            await self.reputation_service.update_project_completion_reputation(
                escrow.freelancer_id, escrow.project_id, reputation_impact
            )
            
        except Exception as e:
            logger.error(f"Error updating reputation for escrow {escrow.id}: {str(e)}")
    
    async def _log_automation_event(
        self,
        escrow_id: str,
        milestone_id: Optional[str],
        event_type: AutomationEventType,
        event_name: str,
        description: str,
        event_data: Dict[str, Any] = None
    ) -> None:
        """Log an automation event"""
        try:
            event = EscrowAutomationEvent(
                escrow_id=escrow_id,
                milestone_id=milestone_id,
                event_type=event_type,
                event_name=event_name,
                description=description,
                event_data=event_data or {},
                triggered_by="system",
                processed_by="smart_escrow_service"
            )
            self.db.add(event)
            
        except Exception as e:
            logger.error(f"Error logging automation event: {str(e)}")
    
    # Query methods for admin and reporting
    
    async def get_escrow_analytics(self, date_range: int = 30) -> Dict[str, Any]:
        """Get escrow analytics for the specified date range"""
        try:
            from_date = datetime.utcnow() - timedelta(days=date_range)
            
            # Basic metrics
            total_escrows = self.db.query(SmartEscrow).count()
            active_escrows = self.db.query(SmartEscrow).filter(
                SmartEscrow.status == EscrowStatus.ACTIVE
            ).count()
            completed_escrows = self.db.query(SmartEscrow).filter(
                SmartEscrow.status == EscrowStatus.COMPLETED
            ).count()
            disputed_escrows = self.db.query(SmartEscrow).filter(
                SmartEscrow.status.in_([EscrowStatus.DISPUTE_RAISED, EscrowStatus.DISPUTE_RESOLUTION])
            ).count()
            
            # Automation metrics
            automated_escrows = self.db.query(SmartEscrow).filter(
                SmartEscrow.is_automated == True
            ).count()
            auto_released_milestones = self.db.query(SmartMilestone).filter(
                SmartMilestone.status == MilestoneStatus.AUTO_RELEASED
            ).count()
            
            return {
                "total_escrows": total_escrows,
                "active_escrows": active_escrows,
                "completed_escrows": completed_escrows,
                "disputed_escrows": disputed_escrows,
                "automation_adoption_rate": (automated_escrows / total_escrows * 100) if total_escrows > 0 else 0,
                "auto_release_rate": auto_released_milestones,
                "dispute_rate": (disputed_escrows / total_escrows * 100) if total_escrows > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting escrow analytics: {str(e)}")
            return {}
    
    async def get_pending_automations(self) -> List[Dict[str, Any]]:
        """Get milestones pending automation evaluation"""
        try:
            # Get milestones that might be ready for auto-release
            pending_milestones = self.db.query(SmartMilestone).filter(
                and_(
                    SmartMilestone.status == MilestoneStatus.SUBMITTED,
                    SmartMilestone.auto_release_enabled == True,
                    SmartMilestone.auto_release_date <= datetime.utcnow()
                )
            ).all()
            
            results = []
            for milestone in pending_milestones:
                results.append({
                    "milestone_id": str(milestone.id),
                    "escrow_id": str(milestone.escrow_id),
                    "title": milestone.title,
                    "amount": str(milestone.amount),
                    "submitted_at": milestone.submitted_at.isoformat() if milestone.submitted_at else None,
                    "auto_release_date": milestone.auto_release_date.isoformat() if milestone.auto_release_date else None,
                    "overdue_hours": (datetime.utcnow() - milestone.auto_release_date).total_seconds() / 3600 if milestone.auto_release_date else 0
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting pending automations: {str(e)}")
            return []
    
    async def process_pending_automations(self) -> Dict[str, int]:
        """Process all pending automation tasks"""
        try:
            results = {"processed": 0, "errors": 0}
            
            pending_milestones = await self.get_pending_automations()
            
            for milestone_data in pending_milestones:
                try:
                    milestone_id = milestone_data["milestone_id"]
                    success = await self._evaluate_milestone_conditions(milestone_id)
                    
                    if success:
                        results["processed"] += 1
                    else:
                        results["errors"] += 1
                        
                except Exception as e:
                    logger.error(f"Error processing milestone {milestone_data['milestone_id']}: {str(e)}")
                    results["errors"] += 1
            
            if results["processed"] > 0:
                self.db.commit()
            
            return results
            
        except Exception as e:
            logger.error(f"Error processing pending automations: {str(e)}")
            return {"processed": 0, "errors": 1}
