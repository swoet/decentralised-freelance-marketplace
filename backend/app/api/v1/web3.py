from fastapi import APIRouter, Depends
from app.services.escrow_web3 import deploy_escrow_contract, get_contract_status
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/web3", tags=["web3"])

@router.post("/deploy")
def deploy_contract_view(data: dict, user=Depends(get_current_active_user)):
    return deploy_escrow_contract(data, user)

@router.get("/status/{contract_address}")
def get_contract_status_view(contract_address: str, user=Depends(get_current_active_user)):
    return get_contract_status(contract_address, user) 