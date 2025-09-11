"""Blockchain-Based Reputation System Models"""

from __future__ import annotations
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from typing import Dict, List, Optional
import uuid

from .base import Base


class BlockchainReputation(Base):
    """Core blockchain reputation scores - immutable and cross-platform"""
    __tablename__ = "blockchain_reputation"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    
    # Core Reputation Scores (stored on-chain)
    overall_reputation = Column(Float, nullable=False, default=0.0)  # 0-1000 scale
    technical_skill_score = Column(Float, nullable=False, default=0.0)  # 0-1000
    communication_score = Column(Float, nullable=False, default=0.0)  # 0-1000
    reliability_score = Column(Float, nullable=False, default=0.0)  # 0-1000
    creativity_score = Column(Float, nullable=False, default=0.0)  # 0-1000
    
    # Blockchain Integration
    blockchain_address = Column(String, nullable=True, unique=True, index=True)  # wallet address
    reputation_contract_address = Column(String, nullable=True)
    reputation_token_id = Column(String, nullable=True)  # NFT token ID for reputation
    last_blockchain_sync = Column(DateTime(timezone=True), nullable=True)
    
    # Cross-Platform Verification Hashes
    github_verification_hash = Column(String, nullable=True)  # Hash of GitHub profile data
    linkedin_verification_hash = Column(String, nullable=True)
    stackoverflow_verification_hash = Column(String, nullable=True)
    cross_platform_reputation_hash = Column(String, nullable=True)  # Combined hash
    
    # Reputation Staking
    staked_reputation_amount = Column(Float, nullable=False, default=0.0)  # Amount staked on reputation
    staking_multiplier = Column(Float, nullable=False, default=1.0)  # Earning multiplier from staking
    reputation_at_risk = Column(Float, nullable=False, default=0.0)  # Can be lost if performance drops
    
    # Immutability Tracking
    reputation_merkle_root = Column(String, nullable=True)  # Merkle root of all reputation data
    blockchain_transaction_hash = Column(String, nullable=True)  # Latest on-chain transaction
    verification_count = Column(Integer, nullable=False, default=0)  # How many times verified
    
    # Performance Guarantees
    guaranteed_delivery_rate = Column(Float, nullable=True)  # Blockchain-backed guarantee
    guaranteed_quality_score = Column(Float, nullable=True)
    insurance_coverage_amount = Column(Float, nullable=False, default=0.0)  # Coverage for failures
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="blockchain_reputation")
    skill_certificates = relationship("SkillCertificateNFT", back_populates="reputation_profile")
    cross_platform_verifications = relationship("CrossPlatformVerification", back_populates="reputation_profile")


class SkillCertificateNFT(Base):
    """NFT-based skill certificates that freelancers own"""
    __tablename__ = "skill_certificate_nfts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reputation_id = Column(UUID(as_uuid=True), ForeignKey("blockchain_reputation.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # NFT Details
    nft_contract_address = Column(String, nullable=False, index=True)
    token_id = Column(String, nullable=False, index=True)
    token_uri = Column(String, nullable=True)  # IPFS URI for metadata
    
    # Certificate Information
    skill_name = Column(String, nullable=False, index=True)
    skill_category = Column(String, nullable=False)
    proficiency_level = Column(String, nullable=False)  # beginner, intermediate, advanced, expert
    certification_level = Column(Integer, nullable=False)  # 1-10 scale
    
    # Verification Details
    issuer_type = Column(String, nullable=False)  # platform, community, institution, self
    issuer_address = Column(String, nullable=True)  # blockchain address of issuer
    verification_method = Column(String, nullable=False)  # project_based, test_based, peer_review, etc.
    evidence_hash = Column(String, nullable=True)  # Hash of evidence/portfolio items
    
    # Validation and Trust
    verification_score = Column(Float, nullable=False, default=0.0)  # How trusted is this certificate
    peer_endorsements = Column(Integer, nullable=False, default=0)
    challenge_count = Column(Integer, nullable=False, default=0)  # Times this certificate was challenged
    validation_stake_amount = Column(Float, nullable=False, default=0.0)  # Amount staked by issuer
    
    # Market Value
    estimated_market_value = Column(Float, nullable=True)  # Market value in platform tokens
    rarity_score = Column(Float, nullable=False, default=0.0)  # How rare is this skill
    demand_multiplier = Column(Float, nullable=False, default=1.0)  # Current market demand
    
    # Certificate Metadata
    certificate_metadata = Column(JSONB, nullable=True)  # Additional metadata
    expiry_date = Column(DateTime(timezone=True), nullable=True)  # Some skills expire
    renewal_required = Column(Boolean, nullable=False, default=False)
    
    # Blockchain State
    blockchain_status = Column(String, nullable=False, default="pending")  # pending, minted, transferred
    mint_transaction_hash = Column(String, nullable=True)
    current_owner_address = Column(String, nullable=True)  # Current NFT owner
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    reputation_profile = relationship("BlockchainReputation", back_populates="skill_certificates")
    user = relationship("User")


class CrossPlatformVerification(Base):
    """Verifies reputation across different platforms (GitHub, LinkedIn, etc.)"""
    __tablename__ = "cross_platform_verifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reputation_id = Column(UUID(as_uuid=True), ForeignKey("blockchain_reputation.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Platform Details
    platform_name = Column(String, nullable=False, index=True)  # github, linkedin, stackoverflow, etc.
    platform_user_id = Column(String, nullable=False)  # username/id on that platform
    platform_profile_url = Column(String, nullable=True)
    
    # Verification Data
    verification_status = Column(String, nullable=False, default="pending")  # pending, verified, failed, expired
    verification_method = Column(String, nullable=False)  # oauth, api_key, manual, blockchain_proof
    verification_timestamp = Column(DateTime(timezone=True), nullable=True)
    verification_expiry = Column(DateTime(timezone=True), nullable=True)
    
    # Extracted Reputation Data
    platform_reputation_score = Column(Float, nullable=True)  # Platform-specific score
    activity_level = Column(String, nullable=True)  # high, medium, low
    expertise_areas = Column(ARRAY(String), nullable=True)
    years_active = Column(Float, nullable=True)
    
    # Platform-Specific Metrics
    github_stars = Column(Integer, nullable=True)
    github_followers = Column(Integer, nullable=True)
    github_contributions = Column(Integer, nullable=True)
    stackoverflow_reputation = Column(Integer, nullable=True)
    stackoverflow_badges = Column(JSONB, nullable=True)
    linkedin_connections = Column(Integer, nullable=True)
    linkedin_recommendations = Column(Integer, nullable=True)
    
    # Verification Proof
    verification_signature = Column(String, nullable=True)  # Cryptographic proof
    api_response_hash = Column(String, nullable=True)  # Hash of API response for integrity
    verification_transaction_hash = Column(String, nullable=True)  # On-chain verification
    
    # Trust and Validation
    trust_score = Column(Float, nullable=False, default=0.0)  # How much we trust this verification
    validation_stake = Column(Float, nullable=False, default=0.0)  # Amount staked on this verification
    challenge_period_end = Column(DateTime(timezone=True), nullable=True)  # When challenges end
    
    # Metadata
    raw_platform_data = Column(JSONB, nullable=True)  # Store raw data for analysis
    analysis_results = Column(JSONB, nullable=True)  # AI analysis of platform data
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    reputation_profile = relationship("BlockchainReputation", back_populates="cross_platform_verifications")
    user = relationship("User")


class ReputationStake(Base):
    """Tracks reputation staking for enhanced credibility and earnings"""
    __tablename__ = "reputation_stakes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    reputation_id = Column(UUID(as_uuid=True), ForeignKey("blockchain_reputation.id"), nullable=False, index=True)
    
    # Staking Details
    stake_type = Column(String, nullable=False, index=True)  # reputation, skill, guarantee, insurance
    staked_amount = Column(Float, nullable=False, default=0.0)  # Amount of tokens staked
    stake_currency = Column(String, nullable=False, default="PLATFORM_TOKEN")
    
    # Staking Purpose
    target_skill = Column(String, nullable=True)  # Skill being staked on
    target_reputation_area = Column(String, nullable=True)  # Area of reputation
    guaranteed_performance_level = Column(Float, nullable=True)  # Performance level guaranteed
    
    # Risk and Rewards
    risk_level = Column(String, nullable=False, default="medium")  # low, medium, high
    potential_earnings_multiplier = Column(Float, nullable=False, default=1.0)
    potential_loss_percentage = Column(Float, nullable=False, default=0.0)  # Max loss %
    
    # Performance Tracking
    current_performance_score = Column(Float, nullable=True)  # Current actual performance
    performance_threshold = Column(Float, nullable=False)  # Threshold to avoid penalties
    consecutive_success_count = Column(Integer, nullable=False, default=0)
    
    # Staking State
    stake_status = Column(String, nullable=False, default="active")  # active, locked, slashing, withdrawn
    lock_period_end = Column(DateTime(timezone=True), nullable=True)
    auto_renewal = Column(Boolean, nullable=False, default=False)
    
    # Blockchain Integration
    stake_contract_address = Column(String, nullable=True)
    stake_transaction_hash = Column(String, nullable=True)
    withdrawal_transaction_hash = Column(String, nullable=True)
    
    # Earnings and Penalties
    total_earnings = Column(Float, nullable=False, default=0.0)
    total_penalties = Column(Float, nullable=False, default=0.0)
    last_reward_distribution = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User")
    reputation_profile = relationship("BlockchainReputation")


class ReputationChallenge(Base):
    """Community challenges to reputation claims for maintaining trust"""
    __tablename__ = "reputation_challenges"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    challenged_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    challenger_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Challenge Details
    challenge_type = Column(String, nullable=False, index=True)  # skill, reputation, certificate, verification
    target_certificate_id = Column(UUID(as_uuid=True), ForeignKey("skill_certificate_nfts.id"), nullable=True)
    target_verification_id = Column(UUID(as_uuid=True), ForeignKey("cross_platform_verifications.id"), nullable=True)
    
    # Challenge Claims
    challenge_reason = Column(String, nullable=False)  # fake, outdated, exaggerated, etc.
    evidence_description = Column(Text, nullable=True)
    evidence_urls = Column(ARRAY(String), nullable=True)
    evidence_hash = Column(String, nullable=True)
    
    # Staking and Incentives
    challenger_stake = Column(Float, nullable=False, default=0.0)  # Amount challenger stakes
    defender_stake = Column(Float, nullable=False, default=0.0)  # Amount defender stakes
    community_jury_stake_total = Column(Float, nullable=False, default=0.0)
    
    # Resolution Process
    challenge_status = Column(String, nullable=False, default="open")  # open, jury_selected, voted, resolved
    jury_selection_deadline = Column(DateTime(timezone=True), nullable=True)
    voting_deadline = Column(DateTime(timezone=True), nullable=True)
    resolution_deadline = Column(DateTime(timezone=True), nullable=True)
    
    # Voting Results
    votes_for_challenger = Column(Integer, nullable=False, default=0)
    votes_for_defender = Column(Integer, nullable=False, default=0)
    total_jury_members = Column(Integer, nullable=False, default=0)
    winning_side = Column(String, nullable=True)  # challenger, defender, tied
    
    # Resolution Outcome
    resolution_summary = Column(Text, nullable=True)
    penalty_applied = Column(Float, nullable=False, default=0.0)
    reputation_adjustment = Column(Float, nullable=False, default=0.0)
    certificate_status_change = Column(String, nullable=True)  # revoked, downgraded, maintained
    
    # Blockchain Integration
    challenge_contract_address = Column(String, nullable=True)
    challenge_transaction_hash = Column(String, nullable=True)
    resolution_transaction_hash = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    challenged_user = relationship("User", foreign_keys=[challenged_user_id])
    challenger_user = relationship("User", foreign_keys=[challenger_user_id])
    target_certificate = relationship("SkillCertificateNFT")
    target_verification = relationship("CrossPlatformVerification")


class ReputationInsurance(Base):
    """Insurance coverage for reputation-backed work guarantees"""
    __tablename__ = "reputation_insurance"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Insurance Policy Details
    policy_type = Column(String, nullable=False)  # delivery_guarantee, quality_guarantee, scope_guarantee
    coverage_amount = Column(Float, nullable=False)  # Max payout amount
    premium_amount = Column(Float, nullable=False)  # Premium paid
    deductible_amount = Column(Float, nullable=False, default=0.0)
    
    # Coverage Scope
    covered_skills = Column(ARRAY(String), nullable=True)
    covered_project_types = Column(ARRAY(String), nullable=True)
    max_project_value = Column(Float, nullable=True)
    geographic_coverage = Column(ARRAY(String), nullable=True)
    
    # Policy Terms
    policy_status = Column(String, nullable=False, default="active")  # active, expired, claimed, cancelled
    policy_start_date = Column(DateTime(timezone=True), nullable=False)
    policy_end_date = Column(DateTime(timezone=True), nullable=False)
    auto_renewal = Column(Boolean, nullable=False, default=True)
    
    # Risk Assessment
    risk_score = Column(Float, nullable=False)  # 0-100, higher = riskier
    assessment_factors = Column(JSONB, nullable=True)  # Factors considered in risk assessment
    premium_calculation = Column(JSONB, nullable=True)  # How premium was calculated
    
    # Claims History
    total_claims = Column(Integer, nullable=False, default=0)
    total_payouts = Column(Float, nullable=False, default=0.0)
    claims_ratio = Column(Float, nullable=False, default=0.0)  # claims/coverage
    
    # Blockchain Integration
    insurance_contract_address = Column(String, nullable=True)
    policy_nft_token_id = Column(String, nullable=True)  # Policy as NFT
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User")
