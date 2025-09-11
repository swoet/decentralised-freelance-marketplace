# Import all the models so that Base has them before being
# imported by Alembic
from app.models.base import Base, metadata

# Import all model classes
from app.models.user import User
from app.models.project import Project
from app.models.bid import Bid
from app.models.message import Message
from app.models.review import Review
from app.models.milestone import Milestone
from app.models.skills import Skill, UserSkill, SkillVerification, ReputationScore, ReputationEvent
from app.models.portfolio import Portfolio
from app.models.organization import Organization
from app.models.community import CommunityPost, CommunityThread, Event
from app.models.device import Device, RefreshToken, SessionActivity
from app.models.token import TokenTransaction
from app.models.security import Session, BackupCode, ConsentLog
from app.models.audit_log import AuditLog
from app.models.job_queue import JobQueue
from app.models.matching import ProjectEmbedding, FreelancerProfile, MatchingResult, ReputationScoreV2
from app.models.integration import Integration, Webhook, ApiKey, ApiKeyUsage
from app.models.oauth import OAuthToken, OAuthState, WebhookSignature
from app.models.escrow_contract import EscrowContract

# Import AI matching models
from app.models.ai_matching import (
    PersonalityProfile, WorkPattern, CompatibilityScore, 
    SkillDemandPrediction, MatchingQueueItem
)

# Import blockchain reputation models  
from app.models.blockchain_reputation import (
    BlockchainReputation, SkillCertificateNFT, CrossPlatformVerification,
    ReputationStake, ReputationChallenge, ReputationInsurance
)

__all__ = ["Base", "metadata"]
