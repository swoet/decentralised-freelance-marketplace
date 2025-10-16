# v1 API package init

from fastapi import APIRouter
from .auth import router as auth_router
from .users import router as users_router
from .organizations import router as orgs_router
from .projects import router as projects_router
from .bids import router as bids_router
from .escrow import router as escrow_router, smart_router as smart_escrow_router
from .reviews import router as reviews_router
from .messages import router as messages_router
from .web3 import router as web3_router
from .stripe import router as stripe_router
from .ws import router as ws_router
from .health import router as health_router
from .matching import router as matching_router
from .sustainability import router as sustainability_router
from .integrations import router as integrations_router
from .developer import router as developer_router
from .reputation import router as reputation_router
from .skills import router as skills_router
from .community import router as community_router
from .events import router as events_router
from .token import router as token_router
from .security import router as security_router
from .oauth import router as oauth_router
from .sessions import router as sessions_router
from .matching_v2 import router as matching_v2_router
from .dashboard import router as dashboard_router
from .ai import router as ai_router
from .ai_matching import router as ai_matching_router
from .ai_content import router as ai_content_router
from .blockchain import router as blockchain_router
from .admin import router as admin_router
from .statistics import router as statistics_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(orgs_router)
api_router.include_router(projects_router)
api_router.include_router(bids_router)
api_router.include_router(escrow_router)
api_router.include_router(smart_escrow_router)
api_router.include_router(reviews_router)
api_router.include_router(messages_router)
api_router.include_router(web3_router)
api_router.include_router(stripe_router)
api_router.include_router(ws_router)
api_router.include_router(health_router)
api_router.include_router(matching_router)
api_router.include_router(sustainability_router)
api_router.include_router(integrations_router)
api_router.include_router(developer_router)
api_router.include_router(reputation_router)
api_router.include_router(skills_router)
api_router.include_router(community_router)
api_router.include_router(events_router, prefix="/events", tags=["events"])
api_router.include_router(token_router)
api_router.include_router(security_router)
api_router.include_router(oauth_router, prefix="/oauth", tags=["oauth"])
api_router.include_router(sessions_router, prefix="/sessions", tags=["sessions"])
api_router.include_router(matching_v2_router, prefix="/matching/v2", tags=["matching-v2"])
api_router.include_router(dashboard_router)
api_router.include_router(ai_router)
api_router.include_router(ai_matching_router, prefix="/ai/matching", tags=["ai-matching"])
# Additional route for frontend compatibility
api_router.include_router(ai_matching_router, prefix="/ai-matching", tags=["ai-matching-compat"])
api_router.include_router(ai_content_router, prefix="/ai/content", tags=["ai-content"])
api_router.include_router(blockchain_router, prefix="/blockchain", tags=["blockchain"])
api_router.include_router(admin_router)
api_router.include_router(statistics_router)
