"""Escrow contract management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.escrow import EscrowContract, EscrowContractCreate, EscrowCreate, EscrowResponse
from app.services.escrow_web3 import deploy_escrow, get_escrow_status, create_escrow_contract, release_escrow, get_escrow_contracts
from typing import List

router = APIRouter(prefix="/escrow", tags=["escrow"])


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
def list_escrow_contracts(db: Session = Depends(deps.get_db), user=Depends(deps.get_current_active_user)):
    return get_escrow_contracts(db, user) 