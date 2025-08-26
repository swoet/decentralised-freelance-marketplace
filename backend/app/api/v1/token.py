from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from app.api.deps import get_current_active_user
from app.services.token_web3 import get_token_balance, approve_token, get_allowance

router = APIRouter(prefix="/token", tags=["token"]) 

@router.get("/balance")
def token_balance(address: str, chain_id: int | None = Query(default=None), user=Depends(get_current_active_user)):
    return get_token_balance(chain_id, address)

@router.get("/allowance")
def token_allowance(owner: str, spender: str, chain_id: int | None = Query(default=None), user=Depends(get_current_active_user)):
    return get_allowance(chain_id, owner, spender)

class ApproveReq(BaseModel):
    chain_id: int | None = None
    owner_private_key: str
    spender: str
    amount_wei: int

@router.post("/approve")
def token_approve(payload: ApproveReq, user=Depends(get_current_active_user)):
    try:
        tx_hash = approve_token(payload.chain_id, payload.owner_private_key, payload.spender, int(payload.amount_wei))
        return {"tx_hash": tx_hash}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
