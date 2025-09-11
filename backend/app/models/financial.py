"""
Financial Models for Multi-Currency Payment System

This module contains models for currencies, exchange rates, multi-currency accounts,
and financial transactions supporting global freelancing operations.
"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, Index, JSON, Numeric, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timezone
import uuid
from enum import Enum as PyEnum
from decimal import Decimal

from .base import Base


class CurrencyType(str, PyEnum):
    """Currency types supported by the platform"""
    FIAT = "fiat"
    CRYPTO = "crypto"
    STABLECOIN = "stablecoin"


class PaymentStatus(str, PyEnum):
    """Payment transaction statuses"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class EscrowStatus(str, PyEnum):
    """Escrow account statuses"""
    ACTIVE = "active"
    RELEASED = "released"
    DISPUTED = "disputed"
    REFUNDED = "refunded"
    EXPIRED = "expired"


class Currency(Base):
    """Supported currencies with metadata and configuration"""
    __tablename__ = "currencies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(10), nullable=False, unique=True, index=True)  # USD, EUR, BTC, ETH
    name = Column(String(100), nullable=False)  # US Dollar, Bitcoin
    symbol = Column(String(10), nullable=False)  # $, €, ₿, Ξ
    currency_type = Column(String(20), nullable=False, index=True)  # fiat, crypto, stablecoin
    decimals = Column(Integer, nullable=False, default=2)  # Number of decimal places
    
    # Blockchain specific fields (for crypto currencies)
    chain_id = Column(Integer, nullable=True)  # Ethereum: 1, Polygon: 137
    contract_address = Column(String(255), nullable=True)  # Token contract address
    
    # Configuration
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    min_amount = Column(Numeric(30, 18), default=Decimal('0.01'))  # Minimum transaction amount
    max_amount = Column(Numeric(30, 18), nullable=True)  # Maximum transaction amount
    
    # Display and formatting
    display_order = Column(Integer, default=0)  # For UI sorting
    icon_url = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Indexes
    __table_args__ = (
        Index('idx_currency_type_active', 'currency_type', 'is_active'),
        Index('idx_currency_display_order', 'display_order'),
    )


class ExchangeRate(Base):
    """Real-time exchange rates between currencies"""
    __tablename__ = "exchange_rates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    from_currency_id = Column(UUID(as_uuid=True), ForeignKey("currencies.id"), nullable=False, index=True)
    to_currency_id = Column(UUID(as_uuid=True), ForeignKey("currencies.id"), nullable=False, index=True)
    
    # Exchange rate data
    rate = Column(Numeric(30, 18), nullable=False)  # 1 from_currency = rate * to_currency
    inverse_rate = Column(Numeric(30, 18), nullable=False)  # 1 to_currency = inverse_rate * from_currency
    
    # Rate metadata
    source = Column(String(50), nullable=False)  # coinbase, binance, coingecko, etc.
    confidence_score = Column(Numeric(5, 4), default=Decimal('1.0'))  # 0.0 to 1.0
    volume_24h = Column(Numeric(30, 18), nullable=True)  # 24h trading volume
    
    # Timestamps
    rate_timestamp = Column(DateTime(timezone=True), nullable=False)  # When rate was fetched
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Rate validity period

    # Relationships
    from_currency = relationship("Currency", foreign_keys=[from_currency_id])
    to_currency = relationship("Currency", foreign_keys=[to_currency_id])

    # Indexes
    __table_args__ = (
        Index('idx_exchange_rate_pair', 'from_currency_id', 'to_currency_id'),
        Index('idx_exchange_rate_timestamp', 'rate_timestamp'),
        Index('idx_exchange_rate_expires', 'expires_at'),
    )


class MultiCurrencyAccount(Base):
    """Multi-currency accounts for users to hold different currencies"""
    __tablename__ = "multi_currency_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    currency_id = Column(UUID(as_uuid=True), ForeignKey("currencies.id"), nullable=False, index=True)
    
    # Account balances
    available_balance = Column(Numeric(30, 18), default=Decimal('0'), nullable=False)
    held_balance = Column(Numeric(30, 18), default=Decimal('0'), nullable=False)  # Funds in escrow/pending
    total_balance = Column(Numeric(30, 18), default=Decimal('0'), nullable=False)  # available + held
    
    # Account metadata
    account_number = Column(String(50), nullable=True, unique=True)  # For traditional banking
    wallet_address = Column(String(255), nullable=True)  # For crypto wallets
    is_primary = Column(Boolean, default=False, nullable=False)  # Primary account for this currency
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    # Limits and restrictions
    daily_limit = Column(Numeric(30, 18), nullable=True)
    monthly_limit = Column(Numeric(30, 18), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_activity = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="currency_accounts")
    currency = relationship("Currency")

    # Indexes
    __table_args__ = (
        Index('idx_multi_currency_user', 'user_id', 'currency_id'),
        Index('idx_multi_currency_primary', 'user_id', 'is_primary'),
        Index('idx_multi_currency_active', 'is_active'),
    )


class PaymentTransaction(Base):
    """All payment transactions with multi-currency support"""
    __tablename__ = "payment_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Transaction parties
    payer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    payee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Currency and amounts
    currency_id = Column(UUID(as_uuid=True), ForeignKey("currencies.id"), nullable=False, index=True)
    gross_amount = Column(Numeric(30, 18), nullable=False)  # Original amount
    fee_amount = Column(Numeric(30, 18), default=Decimal('0'))  # Platform fee
    net_amount = Column(Numeric(30, 18), nullable=False)  # Amount after fees
    
    # Exchange rate information (if conversion occurred)
    original_currency_id = Column(UUID(as_uuid=True), ForeignKey("currencies.id"), nullable=True)
    original_amount = Column(Numeric(30, 18), nullable=True)
    exchange_rate_id = Column(UUID(as_uuid=True), ForeignKey("exchange_rates.id"), nullable=True)
    conversion_fee = Column(Numeric(30, 18), default=Decimal('0'))
    
    # Transaction details
    transaction_type = Column(String(50), nullable=False, index=True)  # payment, refund, fee, withdrawal
    status = Column(String(20), nullable=False, default=PaymentStatus.PENDING.value, index=True)
    reference_id = Column(String(100), nullable=True, index=True)  # External reference
    description = Column(Text, nullable=True)
    
    # Blockchain specific
    tx_hash = Column(String(255), nullable=True, index=True)
    block_number = Column(Integer, nullable=True)
    gas_fee = Column(Numeric(30, 18), nullable=True)
    
    # Related entities
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True, index=True)
    escrow_id = Column(UUID(as_uuid=True), ForeignKey("multi_currency_escrows.id"), nullable=True, index=True)
    
    # Metadata
    meta_data = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    payer = relationship("User", foreign_keys=[payer_id], overlaps="payment_transactions_sent")
    payee = relationship("User", foreign_keys=[payee_id], overlaps="payment_transactions_received")
    currency = relationship("Currency", foreign_keys=[currency_id])
    original_currency = relationship("Currency", foreign_keys=[original_currency_id])
    exchange_rate = relationship("ExchangeRate")
    project = relationship("Project")
    escrow = relationship("MultiCurrencyEscrow", back_populates="transactions")

    # Indexes
    __table_args__ = (
        Index('idx_payment_payer_status', 'payer_id', 'status'),
        Index('idx_payment_payee_status', 'payee_id', 'status'),
        Index('idx_payment_created', 'created_at'),
        Index('idx_payment_type_status', 'transaction_type', 'status'),
        Index('idx_payment_tx_hash', 'tx_hash'),
    )


class MultiCurrencyEscrow(Base):
    """Multi-currency escrow accounts for project payments"""
    __tablename__ = "multi_currency_escrows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Project and parties
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    freelancer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Currency and amounts
    currency_id = Column(UUID(as_uuid=True), ForeignKey("currencies.id"), nullable=False, index=True)
    total_amount = Column(Numeric(30, 18), nullable=False)
    released_amount = Column(Numeric(30, 18), default=Decimal('0'), nullable=False)
    held_amount = Column(Numeric(30, 18), nullable=False)  # total - released
    
    # Escrow configuration
    auto_release_days = Column(Integer, default=7, nullable=False)  # Auto-release after X days
    requires_both_signatures = Column(Boolean, default=False, nullable=False)
    allow_partial_release = Column(Boolean, default=True, nullable=False)
    
    # Status and timing
    status = Column(String(20), nullable=False, default=EscrowStatus.ACTIVE.value, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    released_at = Column(DateTime(timezone=True), nullable=True)
    
    # Smart contract integration
    contract_address = Column(String(255), nullable=True)  # On-chain escrow contract
    contract_tx_hash = Column(String(255), nullable=True)
    
    # Milestone tracking
    milestones = Column(JSONB, nullable=True)  # Milestone definitions and status
    current_milestone = Column(Integer, default=0, nullable=False)
    
    # Dispute resolution
    is_disputed = Column(Boolean, default=False, nullable=False, index=True)
    dispute_reason = Column(Text, nullable=True)
    dispute_created_at = Column(DateTime(timezone=True), nullable=True)
    arbitrator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Metadata
    meta_data = Column(JSONB, nullable=True)

    # Relationships
    project = relationship("Project")
    client = relationship("User", foreign_keys=[client_id], overlaps="escrow_accounts_client")
    freelancer = relationship("User", foreign_keys=[freelancer_id], overlaps="escrow_accounts_freelancer")
    currency = relationship("Currency")
    arbitrator = relationship("User", foreign_keys=[arbitrator_id])
    transactions = relationship("PaymentTransaction", back_populates="escrow")

    # Indexes
    __table_args__ = (
        Index('idx_escrow_project', 'project_id'),
        Index('idx_escrow_status', 'status'),
        Index('idx_escrow_disputed', 'is_disputed'),
        Index('idx_escrow_expires', 'expires_at'),
        Index('idx_escrow_client_currency', 'client_id', 'currency_id'),
    )


class CurrencyConversion(Base):
    """Currency conversion transactions and history"""
    __tablename__ = "currency_conversions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Conversion details
    from_currency_id = Column(UUID(as_uuid=True), ForeignKey("currencies.id"), nullable=False)
    to_currency_id = Column(UUID(as_uuid=True), ForeignKey("currencies.id"), nullable=False)
    from_amount = Column(Numeric(30, 18), nullable=False)
    to_amount = Column(Numeric(30, 18), nullable=False)
    
    # Rate and fees
    exchange_rate = Column(Numeric(30, 18), nullable=False)
    conversion_fee = Column(Numeric(30, 18), default=Decimal('0'))
    platform_fee_percentage = Column(Numeric(5, 4), default=Decimal('0.005'))  # 0.5% default
    
    # Transaction status
    status = Column(String(20), nullable=False, default=PaymentStatus.PENDING.value, index=True)
    initiated_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # External transaction references
    from_tx_hash = Column(String(255), nullable=True)
    to_tx_hash = Column(String(255), nullable=True)
    
    # Relationships
    user = relationship("User")
    from_currency = relationship("Currency", foreign_keys=[from_currency_id])
    to_currency = relationship("Currency", foreign_keys=[to_currency_id])

    # Indexes
    __table_args__ = (
        Index('idx_conversion_user', 'user_id'),
        Index('idx_conversion_status', 'status'),
        Index('idx_conversion_initiated', 'initiated_at'),
    )


# Add relationships to existing User model (to be added to user.py)
"""
Add to User model in user.py:

# Financial relationships
currency_accounts = relationship("MultiCurrencyAccount", back_populates="user")
payment_transactions_sent = relationship("PaymentTransaction", foreign_keys="PaymentTransaction.payer_id")
payment_transactions_received = relationship("PaymentTransaction", foreign_keys="PaymentTransaction.payee_id")
escrow_accounts_client = relationship("MultiCurrencyEscrow", foreign_keys="MultiCurrencyEscrow.client_id")
escrow_accounts_freelancer = relationship("MultiCurrencyEscrow", foreign_keys="MultiCurrencyEscrow.freelancer_id")
currency_conversions = relationship("CurrencyConversion", back_populates="user")
"""
