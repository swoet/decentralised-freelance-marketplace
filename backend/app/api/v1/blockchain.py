"""
Blockchain API endpoints for smart contract operations
Handles escrow creation, milestone management, disputes, and transaction monitoring
"""

import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.auth import get_current_user, require_roles
from app.models.user import User
from app.models.project import Project
from app.services.blockchain_service import blockchain_service
from app.schemas.blockchain import (
    # Request schemas
    EscrowCreateRequest,
    MilestoneSubmissionRequest,
    MilestoneApprovalRequest,
    MilestoneRejectionRequest,
    DisputeCreateRequest,
    DisputeResolutionRequest,
    GasEstimateRequest,
    WalletConnectionRequest,
    EscrowFilters,
    
    # Response schemas  
    EscrowData,
    EscrowSummary,
    EscrowListResponse,
    BlockchainTransactionResult,
    TransactionStatusResponse,
    GasEstimateResponse,
    WalletConnectionResponse,
    NetworkStatus,
    UserBlockchainProfile,
    EscrowMetrics,
    EventLogResponse,
    
    # Data schemas
    MilestoneData,
    DisputeData,
    EscrowState
)

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

# Escrow Management Endpoints

@router.post("/escrows", response_model=BlockchainTransactionResult, tags=["escrows"])
async def create_escrow(
    project_id: int,
    escrow_data: EscrowCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new smart escrow contract for a project.
    
    Requires the user to be the client of the project.
    Returns transaction details that can be signed and submitted.
    """
    try:
        # Verify project exists and user is the client
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
            
        if project.client_id != current_user.id:
            raise HTTPException(
                status_code=403, 
                detail="Only project client can create escrow"
            )
        
        # Get freelancer wallet address
        if not project.freelancer or not project.freelancer.wallet_address:
            raise HTTPException(
                status_code=400,
                detail="Freelancer must have verified wallet address"
            )
        
        # Get client wallet address
        if not current_user.wallet_address:
            raise HTTPException(
                status_code=400,
                detail="Client must have verified wallet address"
            )
            
        result = await blockchain_service.create_escrow(
            project_id=project_id,
            client_address=current_user.wallet_address,
            freelancer_address=project.freelancer.wallet_address,
            escrow_data=escrow_data
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error creating escrow: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/escrows/{escrow_id}", response_model=EscrowData, tags=["escrows"])
async def get_escrow(
    escrow_id: int = Path(..., description="Blockchain escrow ID"),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed escrow data from blockchain.
    
    Returns complete escrow information including milestones and disputes.
    """
    try:
        escrow_data = await blockchain_service.get_escrow_data(escrow_id)
        
        if not escrow_data:
            raise HTTPException(status_code=404, detail="Escrow not found")
            
        # Check if user has access to this escrow
        user_wallet = current_user.wallet_address
        if user_wallet and user_wallet.lower() not in [
            escrow_data.client.lower(), 
            escrow_data.freelancer.lower()
        ]:
            # Allow access if user is admin/arbitrator
            if current_user.role not in ['admin', 'arbitrator']:
                raise HTTPException(
                    status_code=403, 
                    detail="Access denied to this escrow"
                )
        
        return escrow_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting escrow {escrow_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/escrows", response_model=EscrowListResponse, tags=["escrows"])
async def list_user_escrows(
    user_type: str = Query("all", enum=["all", "client", "freelancer"]),
    state: Optional[EscrowState] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List escrows for the current user.
    
    Supports filtering by user role and escrow state.
    """
    try:
        if not current_user.wallet_address:
            return EscrowListResponse(
                escrows=[],
                total_count=0,
                page=page,
                per_page=per_page,
                has_next=False,
                has_prev=False
            )
        
        # Get escrow IDs from blockchain
        escrow_ids = []
        
        if user_type in ["all", "client"]:
            client_escrows = await blockchain_service.get_user_escrows(
                current_user.wallet_address, "client"
            )
            escrow_ids.extend(client_escrows)
            
        if user_type in ["all", "freelancer"]:
            freelancer_escrows = await blockchain_service.get_user_escrows(
                current_user.wallet_address, "freelancer"
            )
            escrow_ids.extend(freelancer_escrows)
        
        # Remove duplicates
        escrow_ids = list(set(escrow_ids))
        
        # Fetch detailed data for each escrow
        escrows = []
        for escrow_id in escrow_ids:
            escrow_data = await blockchain_service.get_escrow_data(escrow_id)
            if escrow_data:
                # Apply state filter
                if state and escrow_data.state != state:
                    continue
                    
                # Get project info
                project = db.query(Project).filter(Project.id == escrow_data.project_id).first()
                
                escrows.append(EscrowSummary(
                    escrow_id=escrow_data.escrow_id,
                    project_id=escrow_data.project_id,
                    project_title=project.title if project else f"Project {escrow_data.project_id}",
                    client_name=project.client.username if project and project.client else None,
                    freelancer_name=project.freelancer.username if project and project.freelancer else None,
                    total_amount=escrow_data.total_amount,
                    state=escrow_data.state,
                    milestones_completed=len([m for m in escrow_data.milestones if m.state == "Released"]),
                    milestones_total=len(escrow_data.milestones),
                    created_at=escrow_data.created_at,
                    last_activity=max(
                        [m.submitted_at or m.approved_at for m in escrow_data.milestones if m.submitted_at or m.approved_at] 
                        + [escrow_data.created_at]
                    )
                ))
        
        # Sort by created_at descending
        escrows.sort(key=lambda x: x.created_at, reverse=True)
        
        # Apply pagination
        total_count = len(escrows)
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_escrows = escrows[start_idx:end_idx]
        
        return EscrowListResponse(
            escrows=paginated_escrows,
            total_count=total_count,
            page=page,
            per_page=per_page,
            has_next=end_idx < total_count,
            has_prev=page > 1
        )
        
    except Exception as e:
        logger.error(f"Error listing escrows: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Milestone Management Endpoints

@router.post("/escrows/{escrow_id}/milestones/{milestone_index}/submit", 
            response_model=BlockchainTransactionResult, tags=["milestones"])
async def submit_milestone(
    escrow_id: int = Path(..., description="Blockchain escrow ID"),
    milestone_index: int = Path(..., ge=0, description="Milestone index"),
    submission: MilestoneSubmissionRequest = Body(...),
    current_user: User = Depends(get_current_user)
):
    """
    Submit a milestone deliverable for client review.
    
    Only the freelancer can submit milestones.
    """
    try:
        # Verify user has wallet
        if not current_user.wallet_address:
            raise HTTPException(
                status_code=400,
                detail="Verified wallet address required"
            )
        
        # Get escrow data to verify freelancer
        escrow_data = await blockchain_service.get_escrow_data(escrow_id)
        if not escrow_data:
            raise HTTPException(status_code=404, detail="Escrow not found")
            
        if escrow_data.freelancer.lower() != current_user.wallet_address.lower():
            raise HTTPException(
                status_code=403,
                detail="Only freelancer can submit milestones"
            )
            
        result = await blockchain_service.submit_milestone(
            escrow_id=escrow_id,
            milestone_index=milestone_index,
            deliverable_hash=submission.deliverable_hash,
            freelancer_address=current_user.wallet_address
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting milestone: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/escrows/{escrow_id}/milestones/{milestone_index}/approve", 
            response_model=BlockchainTransactionResult, tags=["milestones"])
async def approve_milestone(
    escrow_id: int = Path(..., description="Blockchain escrow ID"),
    milestone_index: int = Path(..., ge=0, description="Milestone index"),
    approval: MilestoneApprovalRequest = Body(...),
    current_user: User = Depends(get_current_user)
):
    """
    Approve a submitted milestone and release payment.
    
    Only the client can approve milestones.
    """
    try:
        # Verify user has wallet
        if not current_user.wallet_address:
            raise HTTPException(
                status_code=400,
                detail="Verified wallet address required"
            )
        
        # Get escrow data to verify client
        escrow_data = await blockchain_service.get_escrow_data(escrow_id)
        if not escrow_data:
            raise HTTPException(status_code=404, detail="Escrow not found")
            
        if escrow_data.client.lower() != current_user.wallet_address.lower():
            raise HTTPException(
                status_code=403,
                detail="Only client can approve milestones"
            )
            
        result = await blockchain_service.approve_milestone(
            escrow_id=escrow_id,
            milestone_index=milestone_index,
            feedback=approval.feedback,
            client_address=current_user.wallet_address
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving milestone: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/escrows/{escrow_id}/milestones/{milestone_index}/reject", 
            response_model=BlockchainTransactionResult, tags=["milestones"])
async def reject_milestone(
    escrow_id: int = Path(..., description="Blockchain escrow ID"),
    milestone_index: int = Path(..., ge=0, description="Milestone index"),
    rejection: MilestoneRejectionRequest = Body(...),
    current_user: User = Depends(get_current_user)
):
    """
    Reject a submitted milestone with feedback.
    
    Only the client can reject milestones.
    """
    try:
        # Verify user has wallet
        if not current_user.wallet_address:
            raise HTTPException(
                status_code=400,
                detail="Verified wallet address required"
            )
        
        # Get escrow data to verify client
        escrow_data = await blockchain_service.get_escrow_data(escrow_id)
        if not escrow_data:
            raise HTTPException(status_code=404, detail="Escrow not found")
            
        if escrow_data.client.lower() != current_user.wallet_address.lower():
            raise HTTPException(
                status_code=403,
                detail="Only client can reject milestones"
            )
            
        result = await blockchain_service.reject_milestone(
            escrow_id=escrow_id,
            milestone_index=milestone_index,
            feedback=rejection.feedback,
            client_address=current_user.wallet_address
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting milestone: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Dispute Management Endpoints

@router.post("/escrows/{escrow_id}/disputes", 
            response_model=BlockchainTransactionResult, tags=["disputes"])
async def create_dispute(
    escrow_id: int = Path(..., description="Blockchain escrow ID"),
    dispute_request: DisputeCreateRequest = Body(...),
    current_user: User = Depends(get_current_user)
):
    """
    Raise a dispute for an escrow.
    
    Both client and freelancer can raise disputes.
    """
    try:
        # Verify user has wallet
        if not current_user.wallet_address:
            raise HTTPException(
                status_code=400,
                detail="Verified wallet address required"
            )
        
        # Get escrow data to verify user involvement
        escrow_data = await blockchain_service.get_escrow_data(escrow_id)
        if not escrow_data:
            raise HTTPException(status_code=404, detail="Escrow not found")
            
        user_wallet = current_user.wallet_address.lower()
        if user_wallet not in [escrow_data.client.lower(), escrow_data.freelancer.lower()]:
            raise HTTPException(
                status_code=403,
                detail="Only escrow participants can raise disputes"
            )
            
        result = await blockchain_service.raise_dispute(
            escrow_id=escrow_id,
            reason=dispute_request.reason,
            affected_milestones=dispute_request.affected_milestones,
            user_address=current_user.wallet_address
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating dispute: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Transaction Monitoring Endpoints

@router.get("/transactions/{tx_hash}/status", 
           response_model=TransactionStatusResponse, tags=["transactions"])
async def get_transaction_status(
    tx_hash: str = Path(..., description="Transaction hash"),
    current_user: User = Depends(get_current_user)
):
    """
    Get the status of a blockchain transaction.
    
    Returns transaction details, confirmation count, and parsed event logs.
    """
    try:
        status_data = await blockchain_service.get_transaction_status(tx_hash)
        
        return TransactionStatusResponse(
            transaction_hash=tx_hash,
            status=status_data.get('status', 'unknown'),
            block_number=status_data.get('block_number'),
            gas_used=status_data.get('gas_used'),
            confirmations=status_data.get('confirmations'),
            logs=status_data.get('logs'),
            error=status_data.get('error'),
            message=status_data.get('message')
        )
        
    except Exception as e:
        logger.error(f"Error getting transaction status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Gas and Network Endpoints

@router.get("/network/status", response_model=NetworkStatus, tags=["network"])
async def get_network_status():
    """
    Get current blockchain network status and gas price.
    """
    try:
        is_connected = blockchain_service.w3 and blockchain_service.w3.is_connected()
        
        block_number = None
        gas_price = None
        
        if is_connected:
            try:
                block_number = blockchain_service.w3.eth.block_number
                gas_price = await blockchain_service.estimate_gas_price()
            except:
                pass
        
        return NetworkStatus(
            network=blockchain_service.w3._provider.endpoint_uri if blockchain_service.w3 else "unknown",
            connected=is_connected,
            block_number=block_number,
            gas_price=gas_price,
            contract_address=blockchain_service.escrow_contract.address if blockchain_service.escrow_contract else None
        )
        
    except Exception as e:
        logger.error(f"Error getting network status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/gas/estimate", response_model=GasEstimateResponse, tags=["network"])
async def estimate_gas(
    estimate_request: GasEstimateRequest = Body(...),
    current_user: User = Depends(get_current_user)
):
    """
    Estimate gas costs for blockchain operations.
    """
    try:
        # This is a simplified version - in practice you'd estimate gas for specific operations
        base_gas = {
            "create_escrow": 350000,
            "submit_milestone": 80000,
            "approve_milestone": 90000,
            "reject_milestone": 70000,
            "raise_dispute": 100000
        }
        
        gas_estimate = base_gas.get(estimate_request.operation_type, 100000)
        gas_price = await blockchain_service.estimate_gas_price()
        
        estimated_cost_eth = gas_estimate * gas_price / 10**9  # Convert from Gwei to ETH
        
        return GasEstimateResponse(
            gas_estimate=gas_estimate,
            gas_price_gwei=gas_price,
            estimated_cost_eth=estimated_cost_eth
        )
        
    except Exception as e:
        logger.error(f"Error estimating gas: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# User Profile Endpoints

@router.get("/profile/blockchain", response_model=UserBlockchainProfile, tags=["profile"])
async def get_blockchain_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Get user's blockchain profile including wallet address and escrow statistics.
    """
    try:
        profile = UserBlockchainProfile(
            wallet_address=current_user.wallet_address,
            is_verified=bool(current_user.wallet_address)
        )
        
        # Get escrow statistics if wallet is verified
        if current_user.wallet_address:
            client_escrows = await blockchain_service.get_user_escrows(
                current_user.wallet_address, "client"
            )
            freelancer_escrows = await blockchain_service.get_user_escrows(
                current_user.wallet_address, "freelancer"
            )
            
            profile.active_escrows = len(client_escrows) + len(freelancer_escrows)
            # Additional statistics could be computed here
            
        return profile
        
    except Exception as e:
        logger.error(f"Error getting blockchain profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Admin Endpoints

@router.get("/admin/metrics", response_model=EscrowMetrics, tags=["admin"])
async def get_escrow_metrics(
    current_user: User = Depends(require_roles(["admin", "arbitrator"]))
):
    """
    Get platform-wide escrow metrics.
    
    Admin/arbitrator access required.
    """
    try:
        # This would require additional blockchain queries to gather metrics
        # For now, return basic structure
        return EscrowMetrics()
        
    except Exception as e:
        logger.error(f"Error getting escrow metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))
