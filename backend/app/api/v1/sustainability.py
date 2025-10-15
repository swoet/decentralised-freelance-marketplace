from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.api.deps import get_current_active_user
from app.services.sustainability import (
    estimate_tx_carbon, 
    offset_carbon, 
    calculate_cumulative_footprint,
    get_offset_recommendations
)

router = APIRouter(prefix="/sustainability", tags=["sustainability"]) 


class TransactionEstimateRequest(BaseModel):
    chain_id: int
    tx_hash: str
    gas_used: Optional[int] = None


class OffsetRequest(BaseModel):
    amount_kg: float
    provider: str = "default"
    metadata: Optional[Dict[str, Any]] = None


class CumulativeFootprintRequest(BaseModel):
    transactions: List[Dict[str, Any]]


@router.get("/estimate-tx")
def estimate_transaction(
    chain_id: int, 
    tx_hash: str, 
    gas_used: Optional[int] = None,
    user=Depends(get_current_active_user)
):
    """
    Estimate carbon footprint for a single blockchain transaction.
    """
    return estimate_tx_carbon(chain_id, tx_hash, gas_used)


@router.post("/estimate-tx")
def estimate_transaction_post(
    request: TransactionEstimateRequest,
    user=Depends(get_current_active_user)
):
    """
    Estimate carbon footprint for a single blockchain transaction (POST version).
    """
    return estimate_tx_carbon(request.chain_id, request.tx_hash, request.gas_used)


@router.post("/estimate-cumulative")
def estimate_cumulative(
    request: CumulativeFootprintRequest,
    user=Depends(get_current_active_user)
):
    """
    Calculate cumulative carbon footprint for multiple transactions.
    """
    if not request.transactions:
        raise HTTPException(status_code=400, detail="No transactions provided")
    
    return calculate_cumulative_footprint(request.transactions)


@router.post("/offset")
def create_offset(
    request: OffsetRequest, 
    user=Depends(get_current_active_user)
):
    """
    Create a carbon offset intent with cost estimation.
    """
    if request.amount_kg <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    return offset_carbon(user.id, request.amount_kg, request.provider, request.metadata)


@router.get("/offset/recommendations")
def get_recommendations(
    amount_kg: float,
    user=Depends(get_current_active_user)
):
    """
    Get carbon offset provider recommendations with cost estimates.
    """
    if amount_kg <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    return get_offset_recommendations(amount_kg)


@router.get("/summary")
def get_sustainability_summary(user=Depends(get_current_active_user)):
    """
    Get sustainability summary for the current user.
    Returns user's carbon footprint, offsets, and impact metrics.
    """
    # This would typically query from a database of user's transactions
    # For now, return a sample structure
    return {
        "user_id": str(user.id),
        "total_footprint_kg": 0.0,
        "total_offset_kg": 0.0,
        "net_footprint_kg": 0.0,
        "transactions_count": 0,
        "offsets_count": 0,
        "carbon_neutral": True,
        "last_updated": None
    }
