# v1 API package init

from fastapi import APIRouter
from .auth import router as auth_router
from .users import router as users_router
from .organizations import router as orgs_router
from .projects import router as projects_router
from .bids import router as bids_router
from .escrow import router as escrow_router
from .reviews import router as reviews_router
from .messages import router as messages_router
from .web3 import router as web3_router
from .stripe import router as stripe_router
from .ws import router as ws_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(orgs_router)
api_router.include_router(projects_router)
api_router.include_router(bids_router)
api_router.include_router(escrow_router)
api_router.include_router(reviews_router)
api_router.include_router(messages_router)
api_router.include_router(web3_router)
api_router.include_router(stripe_router)
api_router.include_router(ws_router)