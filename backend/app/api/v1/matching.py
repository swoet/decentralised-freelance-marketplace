from fastapi import APIRouter, Depends
from app.api.deps import get_current_active_user
from app.services.ai_matching import match_projects_for_user

router = APIRouter(prefix="/matching", tags=["matching"]) 

@router.get("/feed")
def get_matching_feed(user=Depends(get_current_active_user)):
    return {"items": match_projects_for_user(user.id)}
