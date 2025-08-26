"""
Escrow service for managing escrow contract operations.
Provides business logic layer between API endpoints and database models.
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from uuid import UUID
from decimal import Decimal

from app.models.escrow_contract import EscrowContract
from app.models.user import User
from app.models.project import Project
from app.models.milestone import Milestone
from app.schemas.escrow import EscrowContractCreate, EscrowContractUpdate, EscrowContractFilter


class EscrowService:
    """Service class for escrow contract operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_escrow_contract(
        self, 
        escrow_data: EscrowContractCreate,
        contract_address: str
    ) -> EscrowContract:
        """
        Create a new escrow contract record.
        Called after successful blockchain deployment.
        """
        db_escrow = EscrowContract(
            contract_address=contract_address,
            project_id=escrow_data.project_id,
            client_id=escrow_data.client_id,
            freelancer_id=escrow_data.freelancer_id,
            total_amount=escrow_data.total_amount,
            payment_mode=escrow_data.payment_mode or 'native',
            chain_id=escrow_data.chain_id,
            token_address=escrow_data.token_address,
            status='created'
        )
        
        self.db.add(db_escrow)
        self.db.commit()
        self.db.refresh(db_escrow)
        return db_escrow
    
    def get_escrow_contract(self, escrow_id: UUID) -> Optional[EscrowContract]:
        """Get escrow contract by ID."""
        return self.db.query(EscrowContract).filter(
            EscrowContract.id == escrow_id
        ).first()
    
    def get_escrow_by_address(self, contract_address: str) -> Optional[EscrowContract]:
        """Get escrow contract by blockchain address."""
        return self.db.query(EscrowContract).filter(
            EscrowContract.contract_address == contract_address
        ).first()
    
    def list_escrow_contracts(
        self,
        filters: EscrowContractFilter,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[EscrowContract], int]:
        """
        List escrow contracts with filtering and pagination.
        Returns (contracts, total_count).
        """
        query = self.db.query(EscrowContract)
        
        # Apply filters
        if filters.project_id:
            query = query.filter(EscrowContract.project_id == filters.project_id)
        
        if filters.client_id:
            query = query.filter(EscrowContract.client_id == filters.client_id)
        
        if filters.freelancer_id:
            query = query.filter(EscrowContract.freelancer_id == filters.freelancer_id)
        
        if filters.chain_id:
            query = query.filter(EscrowContract.chain_id == filters.chain_id)
        
        if filters.status:
            if isinstance(filters.status, list):
                query = query.filter(EscrowContract.status.in_(filters.status))
            else:
                query = query.filter(EscrowContract.status == filters.status)
        
        if filters.payment_mode:
            query = query.filter(EscrowContract.payment_mode == filters.payment_mode)
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply pagination and ordering
        contracts = query.order_by(EscrowContract.created_at.desc()).offset(skip).limit(limit).all()
        
        return contracts, total_count
    
    def update_escrow_status(
        self, 
        escrow_id: UUID, 
        status: str,
        updated_by: Optional[UUID] = None
    ) -> Optional[EscrowContract]:
        """Update escrow contract status."""
        escrow = self.get_escrow_contract(escrow_id)
        if not escrow:
            return None
        
        escrow.status = status
        if updated_by:
            # Could add audit trail here if needed
            pass
        
        self.db.commit()
        self.db.refresh(escrow)
        return escrow
    
    def get_user_escrows(
        self, 
        user_id: UUID, 
        role: str = 'both',  # 'client', 'freelancer', or 'both'
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[EscrowContract], int]:
        """Get escrow contracts for a specific user."""
        query = self.db.query(EscrowContract)
        
        if role == 'client':
            query = query.filter(EscrowContract.client_id == user_id)
        elif role == 'freelancer':
            query = query.filter(EscrowContract.freelancer_id == user_id)
        else:  # both
            query = query.filter(
                or_(
                    EscrowContract.client_id == user_id,
                    EscrowContract.freelancer_id == user_id
                )
            )
        
        total_count = query.count()
        contracts = query.order_by(EscrowContract.created_at.desc()).offset(skip).limit(limit).all()
        
        return contracts, total_count
    
    def get_escrow_milestones(self, escrow_id: UUID) -> List[Milestone]:
        """Get all milestones for an escrow contract."""
        return self.db.query(Milestone).filter(
            Milestone.escrow_contract_id == escrow_id
        ).order_by(Milestone.created_at.asc()).all()
    
    def calculate_remaining_amount(self, escrow_id: UUID) -> Decimal:
        """Calculate remaining amount to be released in escrow."""
        escrow = self.get_escrow_contract(escrow_id)
        if not escrow:
            return Decimal('0')
        
        milestones = self.get_escrow_milestones(escrow_id)
        released_amount = sum(
            milestone.amount for milestone in milestones 
            if milestone.status == 'released'
        )
        
        return escrow.total_amount - released_amount
    
    def validate_escrow_access(
        self, 
        escrow_id: UUID, 
        user_id: UUID
    ) -> tuple[bool, Optional[str]]:
        """
        Validate if user has access to escrow contract.
        Returns (has_access, role) where role is 'client', 'freelancer', or None.
        """
        escrow = self.get_escrow_contract(escrow_id)
        if not escrow:
            return False, None
        
        if escrow.client_id == user_id:
            return True, 'client'
        elif escrow.freelancer_id == user_id:
            return True, 'freelancer'
        
        return False, None
