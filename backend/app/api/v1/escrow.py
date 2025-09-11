"""Smart Escrow management endpoints with comprehensive automation support."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel

from app.api import deps
from app.schemas.escrow import (
    # Smart Escrow Schemas
    SmartEscrowCreate, SmartEscrowUpdate, SmartEscrowResponse, 
    SmartEscrowFilter, SmartEscrowListResponse,
    SmartMilestoneCreate, SmartMilestoneUpdate, SmartMilestoneResponse,
    SmartMilestoneFilter, SmartMilestoneListResponse,
    MilestoneConditionCreate, MilestoneConditionUpdate, MilestoneConditionResponse,
    MilestoneDeliverableCreate, MilestoneDeliverableUpdate, MilestoneDeliverableResponse,
    EscrowDisputeCreate, EscrowDisputeUpdate, EscrowDisputeResponse,
    EscrowAutomationEventCreate, EscrowAutomationEventResponse,
    MilestoneSubmissionSchema, MilestoneApprovalSchema, EscrowReleaseSchema,
    # Legacy Schemas (for backward compatibility)
    EscrowContract, EscrowContractCreate, EscrowCreate, EscrowResponse,
    EscrowContractResponse, EscrowListResponse, EscrowContractFilter,
    EscrowContractUpdate
)
from app.services.escrow_web3 import (
    deploy_escrow as web3_deploy_escrow,
    get_escrow_status as web3_get_escrow_status,
    deploy_escrow_contract as web3_deploy_escrow_contract,
    release_milestone as web3_release_milestone,
    get_contract_status as web3_get_contract_status,
)
from app.services.escrow_service import EscrowService
from app.services.smart_escrow_service import SmartEscrowService
from app.core.config import settings

router = APIRouter(prefix="/escrow", tags=["escrow"])
smart_router = APIRouter(prefix="/smart-escrow", tags=["smart-escrow"])


# Enhanced CRUD endpoints for escrow contracts
@router.get("/contracts", response_model=EscrowListResponse)
def list_escrow_contracts_enhanced(
    project_id: Optional[UUID] = Query(None, description="Filter by project ID"),
    chain_id: Optional[int] = Query(None, description="Filter by chain ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    payment_mode: Optional[str] = Query(None, description="Filter by payment mode"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """List escrow contracts with filtering and pagination."""
    escrow_service = EscrowService(db)
    
    # Create filter object
    filters = EscrowContractFilter(
        project_id=project_id,
        client_id=current_user.id,  # Only show user's contracts
        chain_id=chain_id,
        status=status,
        payment_mode=payment_mode
    )
    
    skip = (page - 1) * page_size
    contracts, total_count = escrow_service.list_escrow_contracts(filters, skip, page_size)
    
    # Convert to response format with additional data
    contract_responses = []
    for contract in contracts:
        response = EscrowContractResponse.from_orm(contract)
        # Add additional computed fields
        response.milestone_count = len(contract.milestones) if contract.milestones else 0
        response.remaining_amount = escrow_service.calculate_remaining_amount(contract.id)
        contract_responses.append(response)
    
    return EscrowListResponse(
        contracts=contract_responses,
        total_count=total_count,
        page=page,
        page_size=page_size,
        has_next=(skip + page_size) < total_count,
        has_prev=page > 1
    )


@router.get("/contracts/{escrow_id}", response_model=EscrowContractResponse)
def get_escrow_contract_details(
    escrow_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Get detailed information about a specific escrow contract."""
    escrow_service = EscrowService(db)
    
    # Validate access
    has_access, role = escrow_service.validate_escrow_access(escrow_id, current_user.id)
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escrow contract not found"
        )
    
    contract = escrow_service.get_escrow_contract(escrow_id)
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escrow contract not found"
        )
    
    response = EscrowContractResponse.from_orm(contract)
    response.milestone_count = len(contract.milestones) if contract.milestones else 0
    response.remaining_amount = escrow_service.calculate_remaining_amount(contract.id)
    
    return response


@router.patch("/contracts/{escrow_id}", response_model=EscrowContractResponse)
def update_escrow_contract_status(
    escrow_id: UUID,
    update_data: EscrowContractUpdate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Update escrow contract status (admin or authorized users only)."""
    escrow_service = EscrowService(db)
    
    # Validate access
    has_access, role = escrow_service.validate_escrow_access(escrow_id, current_user.id)
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escrow contract not found"
        )
    
    if update_data.status:
        contract = escrow_service.update_escrow_status(
            escrow_id, 
            update_data.status, 
            current_user.id
        )
        if not contract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Escrow contract not found"
            )
        
        return EscrowContractResponse.from_orm(contract)
    
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="No valid update data provided"
    )


@router.get("/contracts/{escrow_id}/milestones")
def get_escrow_milestones(
    escrow_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Get all milestones for an escrow contract."""
    escrow_service = EscrowService(db)
    
    # Validate access
    has_access, role = escrow_service.validate_escrow_access(escrow_id, current_user.id)
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escrow contract not found"
        )
    
    milestones = escrow_service.get_escrow_milestones(escrow_id)
    return {"milestones": milestones}


class ReleaseRequest(BaseModel):
    milestone_index: int
    client_private_key: str


@router.post("/contracts/{escrow_id}/release")
def release_escrow_milestone(
    escrow_id: UUID,
    req: ReleaseRequest,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Release a milestone for an escrow contract (client only). Returns tx hash."""
    escrow_service = EscrowService(db)

    # Validate access and ensure the caller is the client
    has_access, role = escrow_service.validate_escrow_access(escrow_id, current_user.id)
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escrow contract not found"
        )
    if role != 'client':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the client can release milestones"
        )

    contract = escrow_service.get_escrow_contract(escrow_id)
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escrow contract not found"
        )

    try:
        tx_hash = web3_release_milestone(
            escrow_address=contract.contract_address,
            milestone_id=req.milestone_index,
            client_private_key=req.client_private_key,
            chain_id=contract.chain_id,
            user_id=str(current_user.id),
        )
        return {"tx_hash": tx_hash}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# === SMART ESCROW ENDPOINTS ===

# Smart Escrow CRUD
@smart_router.post("/", response_model=SmartEscrowResponse, status_code=status.HTTP_201_CREATED)
def create_smart_escrow(
    escrow_data: SmartEscrowCreate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Create a new smart escrow with automation support."""
    service = SmartEscrowService(db)
    
    # Validate user has access to project
    # This would need to be implemented based on your project access logic
    
    try:
        escrow = service.create_smart_escrow(escrow_data, current_user.id)
        return SmartEscrowResponse.from_orm(escrow)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create smart escrow: {str(e)}"
        )


@smart_router.get("/", response_model=SmartEscrowListResponse)
def list_smart_escrows(
    project_id: Optional[UUID] = Query(None, description="Filter by project ID"),
    client_id: Optional[UUID] = Query(None, description="Filter by client ID"),
    freelancer_id: Optional[UUID] = Query(None, description="Filter by freelancer ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    is_automated: Optional[bool] = Query(None, description="Filter by automation enabled"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """List smart escrows with filtering and pagination."""
    service = SmartEscrowService(db)
    
    filters = SmartEscrowFilter(
        project_id=project_id,
        client_id=client_id,
        freelancer_id=freelancer_id,
        status=status,
        is_automated=is_automated
    )
    
    skip = (page - 1) * page_size
    escrows, total_count = service.list_smart_escrows(filters, skip, page_size, current_user.id)
    
    return SmartEscrowListResponse(
        escrows=[SmartEscrowResponse.from_orm(e) for e in escrows],
        total_count=total_count,
        page=page,
        page_size=page_size,
        has_next=(skip + page_size) < total_count,
        has_prev=page > 1
    )


@smart_router.get("/{escrow_id}", response_model=SmartEscrowResponse)
def get_smart_escrow(
    escrow_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Get a specific smart escrow by ID."""
    service = SmartEscrowService(db)
    
    escrow = service.get_smart_escrow(escrow_id, current_user.id)
    if not escrow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Smart escrow not found"
        )
    
    return SmartEscrowResponse.from_orm(escrow)


@smart_router.patch("/{escrow_id}", response_model=SmartEscrowResponse)
def update_smart_escrow(
    escrow_id: UUID,
    update_data: SmartEscrowUpdate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Update a smart escrow."""
    service = SmartEscrowService(db)
    
    escrow = service.update_smart_escrow(escrow_id, update_data, current_user.id)
    if not escrow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Smart escrow not found or access denied"
        )
    
    return SmartEscrowResponse.from_orm(escrow)


@smart_router.delete("/{escrow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_smart_escrow(
    escrow_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Delete a smart escrow (only if in draft status)."""
    service = SmartEscrowService(db)
    
    success = service.delete_smart_escrow(escrow_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Smart escrow not found or cannot be deleted"
        )


# Smart Milestone Endpoints
@smart_router.post("/{escrow_id}/milestones", response_model=SmartMilestoneResponse, status_code=status.HTTP_201_CREATED)
def create_milestone(
    escrow_id: UUID,
    milestone_data: SmartMilestoneCreate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Create a new milestone for a smart escrow."""
    service = SmartEscrowService(db)
    
    milestone_data.escrow_id = escrow_id
    milestone = service.create_milestone(milestone_data, current_user.id)
    if not milestone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create milestone"
        )
    
    return SmartMilestoneResponse.from_orm(milestone)


@smart_router.get("/{escrow_id}/milestones", response_model=SmartMilestoneListResponse)
def list_milestones(
    escrow_id: UUID,
    status: Optional[str] = Query(None, description="Filter by milestone status"),
    milestone_type: Optional[str] = Query(None, description="Filter by milestone type"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """List milestones for a smart escrow."""
    service = SmartEscrowService(db)
    
    filters = SmartMilestoneFilter(
        escrow_id=escrow_id,
        status=status,
        milestone_type=milestone_type
    )
    
    skip = (page - 1) * page_size
    milestones, total_count = service.list_milestones(filters, skip, page_size, current_user.id)
    
    return SmartMilestoneListResponse(
        milestones=[SmartMilestoneResponse.from_orm(m) for m in milestones],
        total_count=total_count,
        page=page,
        page_size=page_size,
        has_next=(skip + page_size) < total_count,
        has_prev=page > 1
    )


@smart_router.get("/milestones/{milestone_id}", response_model=SmartMilestoneResponse)
def get_milestone(
    milestone_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Get a specific milestone by ID."""
    service = SmartEscrowService(db)
    
    milestone = service.get_milestone(milestone_id, current_user.id)
    if not milestone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Milestone not found"
        )
    
    return SmartMilestoneResponse.from_orm(milestone)


@smart_router.patch("/milestones/{milestone_id}", response_model=SmartMilestoneResponse)
def update_milestone(
    milestone_id: UUID,
    update_data: SmartMilestoneUpdate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Update a milestone."""
    service = SmartEscrowService(db)
    
    milestone = service.update_milestone(milestone_id, update_data, current_user.id)
    if not milestone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Milestone not found or access denied"
        )
    
    return SmartMilestoneResponse.from_orm(milestone)


# Milestone Actions
@smart_router.post("/milestones/{milestone_id}/submit")
def submit_milestone(
    milestone_id: UUID,
    submission_data: MilestoneSubmissionSchema,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Submit a milestone for review (freelancer only)."""
    service = SmartEscrowService(db)
    
    result = service.submit_milestone(milestone_id, submission_data, current_user.id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to submit milestone"
        )
    
    return {"message": "Milestone submitted successfully", "milestone_id": milestone_id}


@smart_router.post("/milestones/{milestone_id}/approve")
def approve_milestone(
    milestone_id: UUID,
    approval_data: MilestoneApprovalSchema,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Approve or reject a milestone (client only)."""
    service = SmartEscrowService(db)
    
    result = service.approve_milestone(milestone_id, approval_data, current_user.id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to process milestone approval"
        )
    
    action = "approved" if approval_data.approved else "rejected"
    return {"message": f"Milestone {action} successfully", "milestone_id": milestone_id}


# Milestone Conditions
@smart_router.post("/milestones/{milestone_id}/conditions", response_model=MilestoneConditionResponse, status_code=status.HTTP_201_CREATED)
def create_milestone_condition(
    milestone_id: UUID,
    condition_data: MilestoneConditionCreate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Add an automation condition to a milestone."""
    service = SmartEscrowService(db)
    
    condition_data.milestone_id = milestone_id
    condition = service.create_milestone_condition(condition_data, current_user.id)
    if not condition:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create milestone condition"
        )
    
    return MilestoneConditionResponse.from_orm(condition)


@smart_router.get("/milestones/{milestone_id}/conditions", response_model=List[MilestoneConditionResponse])
def list_milestone_conditions(
    milestone_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """List all conditions for a milestone."""
    service = SmartEscrowService(db)
    
    conditions = service.list_milestone_conditions(milestone_id, current_user.id)
    return [MilestoneConditionResponse.from_orm(c) for c in conditions]


@smart_router.patch("/conditions/{condition_id}", response_model=MilestoneConditionResponse)
def update_milestone_condition(
    condition_id: UUID,
    update_data: MilestoneConditionUpdate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Update a milestone condition."""
    service = SmartEscrowService(db)
    
    condition = service.update_milestone_condition(condition_id, update_data, current_user.id)
    if not condition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Condition not found or access denied"
        )
    
    return MilestoneConditionResponse.from_orm(condition)


# Milestone Deliverables
@smart_router.post("/milestones/{milestone_id}/deliverables", response_model=MilestoneDeliverableResponse, status_code=status.HTTP_201_CREATED)
def create_milestone_deliverable(
    milestone_id: UUID,
    deliverable_data: MilestoneDeliverableCreate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Add a deliverable to a milestone."""
    service = SmartEscrowService(db)
    
    deliverable_data.milestone_id = milestone_id
    deliverable = service.create_milestone_deliverable(deliverable_data, current_user.id)
    if not deliverable:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create deliverable"
        )
    
    return MilestoneDeliverableResponse.from_orm(deliverable)


@smart_router.get("/milestones/{milestone_id}/deliverables", response_model=List[MilestoneDeliverableResponse])
def list_milestone_deliverables(
    milestone_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """List all deliverables for a milestone."""
    service = SmartEscrowService(db)
    
    deliverables = service.list_milestone_deliverables(milestone_id, current_user.id)
    return [MilestoneDeliverableResponse.from_orm(d) for d in deliverables]


@smart_router.patch("/deliverables/{deliverable_id}", response_model=MilestoneDeliverableResponse)
def update_milestone_deliverable(
    deliverable_id: UUID,
    update_data: MilestoneDeliverableUpdate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Update a deliverable (e.g., approve/reject)."""
    service = SmartEscrowService(db)
    
    deliverable = service.update_milestone_deliverable(deliverable_id, update_data, current_user.id)
    if not deliverable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deliverable not found or access denied"
        )
    
    return MilestoneDeliverableResponse.from_orm(deliverable)


# Dispute Management
@smart_router.post("/{escrow_id}/disputes", response_model=EscrowDisputeResponse, status_code=status.HTTP_201_CREATED)
def create_escrow_dispute(
    escrow_id: UUID,
    dispute_data: EscrowDisputeCreate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Create a dispute for an escrow."""
    service = SmartEscrowService(db)
    
    dispute_data.escrow_id = escrow_id
    dispute_data.raised_by = current_user.id
    dispute = service.create_dispute(dispute_data, current_user.id)
    if not dispute:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create dispute"
        )
    
    return EscrowDisputeResponse.from_orm(dispute)


@smart_router.get("/{escrow_id}/disputes", response_model=List[EscrowDisputeResponse])
def list_escrow_disputes(
    escrow_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """List all disputes for an escrow."""
    service = SmartEscrowService(db)
    
    disputes = service.list_disputes(escrow_id, current_user.id)
    return [EscrowDisputeResponse.from_orm(d) for d in disputes]


@smart_router.patch("/disputes/{dispute_id}", response_model=EscrowDisputeResponse)
def update_dispute(
    dispute_id: UUID,
    update_data: EscrowDisputeUpdate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Update a dispute (for mediators/arbitrators)."""
    service = SmartEscrowService(db)
    
    dispute = service.update_dispute(dispute_id, update_data, current_user.id)
    if not dispute:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dispute not found or access denied"
        )
    
    return EscrowDisputeResponse.from_orm(dispute)


# Automation and Release
@smart_router.post("/{escrow_id}/release")
def release_escrow_funds(
    escrow_id: UUID,
    release_data: EscrowReleaseSchema,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Release escrow funds (manual or automated)."""
    service = SmartEscrowService(db)
    
    result = service.release_funds(escrow_id, release_data, current_user.id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to release funds"
        )
    
    return {"message": "Funds released successfully", "escrow_id": escrow_id, "result": result}


@smart_router.post("/{escrow_id}/process-automation")
def process_automation(
    escrow_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Manually trigger automation processing for an escrow."""
    service = SmartEscrowService(db)
    
    result = service.process_automation(escrow_id, current_user.id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to process automation"
        )
    
    return {"message": "Automation processed successfully", "result": result}


@smart_router.get("/{escrow_id}/automation-events", response_model=List[EscrowAutomationEventResponse])
def list_automation_events(
    escrow_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """List automation events for an escrow."""
    service = SmartEscrowService(db)
    
    events = service.list_automation_events(escrow_id, limit, current_user.id)
    return [EscrowAutomationEventResponse.from_orm(e) for e in events]


# === LEGACY ENDPOINTS (kept for backward compatibility) ===

# Legacy endpoints (kept for backward compatibility)
@router.post("/deploy", response_model=EscrowContract)
def deploy_escrow_contract_route(
    escrow_in: EscrowContractCreate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Deploy a new escrow contract."""
    try:
        contract_address = web3_deploy_escrow(
            escrow_in.client,
            escrow_in.freelancer,
            escrow_in.milestone_descriptions,
            escrow_in.milestone_amounts,
            escrow_in.private_key
        )
        return {"contract_address": contract_address}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{contract_address}/status")
def get_contract_status(
    contract_address: str,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Get escrow contract status."""
    try:
        status = web3_get_escrow_status(contract_address)
        return {"status": status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=EscrowResponse)
def create_escrow_view(escrow_in: EscrowCreate, db: Session = Depends(deps.get_db), user=Depends(deps.get_current_active_user)):
    return web3_deploy_escrow_contract(escrow_in.dict(), user)


@router.post("/{escrow_id}/release", response_model=EscrowResponse)
def release_escrow_view(escrow_id: str, db: Session = Depends(deps.get_db), user=Depends(deps.get_current_active_user)):
    # This endpoint needs to be implemented with proper escrow service
    raise HTTPException(status_code=501, detail="Release escrow endpoint not implemented")


@router.get("/", response_model=List[EscrowResponse])
def list_escrow_contracts_legacy(db: Session = Depends(deps.get_db), user=Depends(deps.get_current_active_user)):
    # This endpoint needs to be implemented with proper escrow service
    raise HTTPException(status_code=501, detail="List escrow contracts endpoint not implemented")


# Include both routers for export
routers = [router, smart_router]
