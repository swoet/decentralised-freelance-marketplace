from fastapi import APIRouter, Depends
from app.api.deps import get_current_active_user
from app.services.reputation import get_reputation, get_reputation_history

router = APIRouter(prefix="/reputation", tags=["reputation"]) 

@router.get("/score")
def reputation_score(user=Depends(get_current_active_user)):
    return get_reputation(user.id)

@router.get("/history")
def reputation_history(user=Depends(get_current_active_user)):
    return {"items": get_reputation_history(user.id)}
