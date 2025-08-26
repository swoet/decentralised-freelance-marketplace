from fastapi import APIRouter, Depends
from app.api.deps import get_current_active_user
from app.services.sustainability import estimate_tx_carbon, offset_carbon

router = APIRouter(prefix="/sustainability", tags=["sustainability"]) 

@router.get("/estimate-tx")
def estimate(chain_id: int, tx_hash: str, user=Depends(get_current_active_user)):
    return estimate_tx_carbon(chain_id, tx_hash)

@router.post("/offset")
def offset(payload: dict, user=Depends(get_current_active_user)):
    amount = float(payload.get("amount_kg", 0))
    return offset_carbon(user.id, amount)
