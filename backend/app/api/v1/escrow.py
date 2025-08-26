"""Escrow contract management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.api import deps
from app.schemas.escrow import (
    EscrowContract, EscrowContractCreate, EscrowCreate, EscrowResponse,
    EscrowContractResponse, EscrowListResponse, EscrowContractFilter,
    EscrowContractUpdate
)
from app.services.escrow_web3 import deploy_escrow, get_escrow_status, create_escrow_contract, release_escrow, get_escrow_contracts
from app.services.escrow_service import EscrowService
from app.core.config import settings

router = APIRouter(prefix="/escrow", tags=["escrow"])


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


# Legacy endpoints (kept for backward compatibility)
@router.post("/deploy", response_model=EscrowContract)
def deploy_escrow_contract(
    escrow_in: EscrowContractCreate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Deploy a new escrow contract."""
    try:
        contract_address = deploy_escrow(
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
        status = get_escrow_status(contract_address)
        return {"status": status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=EscrowResponse)
def create_escrow_view(escrow_in: EscrowCreate, db: Session = Depends(deps.get_db), user=Depends(deps.get_current_active_user)):
    return create_escrow_contract(db, escrow_in, user)


@router.post("/{escrow_id}/release", response_model=EscrowResponse)
def release_escrow_view(escrow_id: str, db: Session = Depends(deps.get_db), user=Depends(deps.get_current_active_user)):
    return release_escrow(db, escrow_id, user)


@router.get("/", response_model=List[EscrowResponse])
def list_escrow_contracts_legacy(db: Session = Depends(deps.get_db), user=Depends(deps.get_current_active_user)):
    return get_escrow_contracts(db, user) 