from __future__ import annotations
from typing import Optional
import os

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from web3 import Web3

from app.services.escrow_web3 import deploy_escrow_contract, get_contract_status, release_milestone
from app.api.deps import get_current_active_user, get_db
from app.models.token import TokenTransaction
from app.services.chain_registry import registry
from app.services.token_web3 import get_allowance
from app.services.escrow_service import EscrowService
from app.schemas.escrow import EscrowContractCreate
from web3 import Web3 as _W3

router = APIRouter(prefix="/web3", tags=["web3"]) 


@router.post("/deploy")
def deploy_contract_view(
    data: dict, 
    user=Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Deploy escrow contract with optional persistence."""
    # data may include optional chain_id and payment_mode
    payment_mode = data.get('payment_mode')  # 'native' or 'token'
    chain_id = data.get('chain_id')
    
    if payment_mode == 'token':
        client = data.get('client')
        milestone_amounts = data.get('milestone_amounts') or []
        total = int(sum(milestone_amounts))
        factory = registry.get_factory_address(chain_id)
        if not factory:
            raise HTTPException(status_code=400, detail="Factory address not configured for this chain")
        allow = get_allowance(chain_id, client, factory)
        allowance_raw = int(allow.get('allowance_raw', '0'))
        if allowance_raw < total:
            raise HTTPException(status_code=400, detail=f"Insufficient allowance. Required {total}, current {allowance_raw}")
    
    # Deploy the contract
    result = deploy_escrow_contract(data, user)
    
    # Auto-persist escrow record if enabled and deployment successful
    auto_persist = os.getenv("ESCROW_AUTO_PERSIST", "true").lower() == "true"
    if auto_persist and result.get("contract_address"):
        try:
            escrow_service = EscrowService(db)
            
            # Extract data for persistence
            escrow_data = EscrowContractCreate(
                project_id=data.get('project_id'),
                client_id=data.get('client_id') or user.id,
                freelancer_id=data.get('freelancer_id'),
                total_amount=sum(data.get('milestone_amounts', [])),
                payment_mode=payment_mode or 'native',
                chain_id=chain_id,
                token_address=data.get('token_address')
            )
            
            # Create escrow record
            escrow_record = escrow_service.create_escrow_contract(
                escrow_data, 
                result["contract_address"]
            )
            
            # Add escrow record info to response
            result["escrow_id"] = str(escrow_record.id)
            result["persisted"] = True
            
        except Exception as e:
            # Log error but don't fail the deployment
            import logging
            logging.warning(f"Failed to persist escrow record: {e}")
            result["persisted"] = False
            result["persistence_error"] = str(e)
    
    return result


@router.get("/status/{contract_address}")
def get_contract_status_view(
    contract_address: str,
    chain_id: int | None = Query(default=None, description="Target chain id"),
    user=Depends(get_current_active_user),
):
    return get_contract_status(contract_address, user, chain_id)

@router.get("/factory")
def get_factory_address(chain_id: int | None = Query(default=None)):
    addr = registry.get_factory_address(chain_id)
    if not addr:
        raise HTTPException(status_code=404, detail="Factory address not configured")
    return {"factory": _W3.to_checksum_address(addr)}


@router.post("/release")
def release_milestone_view(
    payload: dict,
    user=Depends(get_current_active_user),
):
    escrow_address = payload.get('escrow_address')
    milestone_id = int(payload.get('milestone_id', 0))
    client_pk = payload.get('client_private_key')
    chain_id = payload.get('chain_id')
    if not all([escrow_address, client_pk]):
        raise HTTPException(status_code=400, detail="Missing escrow_address or client_private_key")
    tx_hash = release_milestone(escrow_address, milestone_id, client_pk, chain_id, str(getattr(user, 'id', '')) or None)
    return {"tx_hash": tx_hash}


@router.get("/txs")
def list_user_txs(
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
    type: Optional[str] = Query(default=None, description="Filter by tx type"),
    status: Optional[str] = Query(default=None, description="Filter by status"),
    chain_id: Optional[int] = Query(default=None, description="Filter by chain id"),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
):
    q = db.query(TokenTransaction).filter(TokenTransaction.user_id == user.id)
    if type:
        q = q.filter(TokenTransaction.tx_type == type)
    if status:
        q = q.filter(TokenTransaction.status == status)
    if chain_id is not None:
        q = q.filter(TokenTransaction.chain_id == chain_id)
    rows = q.order_by(TokenTransaction.created_at.desc()).offset(offset).limit(limit).all()
    return {"items": [
        {
            "tx_hash": r.tx_hash,
            "chain_id": r.chain_id,
            "type": r.tx_type,
            "status": r.status,
            "amount": str(r.amount) if r.amount is not None else None,
            "token_address": r.token_address,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "metadata": r.metadata,
        }
        for r in rows
    ]}


@router.get("/confirm")
def confirm_tx(
    tx_hash: str,
    chain_id: int | None = Query(default=None, description="Target chain id"),
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
):
    # Ensure transaction belongs to the user
    tt = db.query(TokenTransaction).filter(TokenTransaction.user_id == user.id, TokenTransaction.tx_hash == tx_hash).first()
    if not tt:
        raise HTTPException(status_code=404, detail="Transaction not found")

    w3 = registry.get_web3(chain_id)
    try:
        receipt = w3.eth.get_transaction_receipt(tx_hash)
    except Exception:
        # Still pending in mempool or unknown
        return {"tx_hash": tx_hash, "status": tt.status, "message": "No receipt yet"}

    # Update status based on receipt status
    new_status = "confirmed" if getattr(receipt, 'status', 0) == 1 else "failed"
    if tt.status != new_status:
        tt.status = new_status
        db.add(tt)
        db.commit()
    return {
        "tx_hash": tx_hash,
        "status": tt.status,
        "blockNumber": getattr(receipt, 'blockNumber', None),
        "transactionIndex": getattr(receipt, 'transactionIndex', None),
    }
