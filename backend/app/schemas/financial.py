"""
Pydantic schemas for financial and multi-currency operations
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
import uuid


class CurrencyResponse(BaseModel):
    """Response schema for currency information"""
    id: str
    code: str = Field(..., description="Currency code (USD, BTC, etc.)")
    name: str = Field(..., description="Full currency name")
    symbol: str = Field(..., description="Currency symbol ($, ₿, etc.)")
    currency_type: str = Field(..., description="fiat, crypto, or stablecoin")
    decimals: int = Field(..., description="Number of decimal places")
    min_amount: str = Field(..., description="Minimum transaction amount")
    max_amount: Optional[str] = Field(None, description="Maximum transaction amount")
    is_active: bool = Field(..., description="Whether currency is active")
    chain_id: Optional[int] = Field(None, description="Blockchain chain ID")
    contract_address: Optional[str] = Field(None, description="Token contract address")
    icon_url: Optional[str] = Field(None, description="Currency icon URL")
    description: Optional[str] = Field(None, description="Currency description")

    class Config:
        from_attributes = True


class ExchangeRateResponse(BaseModel):
    """Response schema for exchange rates"""
    id: str
    from_currency: str = Field(..., description="Source currency code")
    to_currency: str = Field(..., description="Target currency code")
    rate: str = Field(..., description="Exchange rate (1 from = rate * to)")
    inverse_rate: str = Field(..., description="Inverse rate (1 to = inverse_rate * from)")
    source: str = Field(..., description="Rate source (coinbase, coingecko, etc.)")
    confidence_score: str = Field(..., description="Rate confidence (0.0 to 1.0)")
    rate_timestamp: datetime = Field(..., description="When rate was fetched")
    expires_at: Optional[datetime] = Field(None, description="Rate expiration time")

    class Config:
        from_attributes = True


class MultiCurrencyAccountResponse(BaseModel):
    """Response schema for multi-currency accounts"""
    id: str
    currency: CurrencyResponse
    available_balance: str = Field(..., description="Available balance")
    held_balance: str = Field(..., description="Held balance (in escrow/pending)")
    total_balance: str = Field(..., description="Total balance")
    is_primary: bool = Field(..., description="Whether this is primary account for currency")
    is_active: bool = Field(..., description="Whether account is active")
    created_at: datetime
    last_activity: Optional[datetime] = Field(None, description="Last account activity")

    class Config:
        from_attributes = True


class ConversionQuoteResponse(BaseModel):
    """Response schema for currency conversion quotes"""
    from_currency: str = Field(..., description="Source currency code")
    to_currency: str = Field(..., description="Target currency code")
    from_amount: str = Field(..., description="Amount to convert")
    exchange_rate: str = Field(..., description="Current exchange rate")
    gross_amount: str = Field(..., description="Gross converted amount")
    conversion_fee: str = Field(..., description="Conversion fee amount")
    fee_percentage: str = Field(..., description="Fee percentage")
    final_amount: str = Field(..., description="Final amount after fees")
    rate_timestamp: str = Field(..., description="Rate timestamp")
    expires_at: Optional[str] = Field(None, description="Quote expiration")

    class Config:
        from_attributes = True


class ConversionRequest(BaseModel):
    """Request schema for currency conversions"""
    from_currency: str = Field(..., description="Source currency code")
    to_currency: str = Field(..., description="Target currency code")
    amount: str = Field(..., description="Amount to convert")

    @validator('amount')
    def validate_amount(cls, v):
        try:
            decimal_amount = Decimal(v)
            if decimal_amount <= 0:
                raise ValueError('Amount must be positive')
            return v
        except:
            raise ValueError('Invalid amount format')

    @validator('from_currency', 'to_currency')
    def validate_currency_codes(cls, v):
        if not v or len(v) < 3:
            raise ValueError('Currency code must be at least 3 characters')
        return v.upper()

    class Config:
        from_attributes = True


class PortfolioAccountDetail(BaseModel):
    """Portfolio account details"""
    currency_code: str
    currency_name: str
    currency_symbol: str
    balance: str
    available_balance: str
    held_balance: str
    value_in_base_currency: str
    percentage_of_total: str


class PortfolioResponse(BaseModel):
    """Response schema for portfolio overview"""
    base_currency: str = Field(..., description="Base currency for total value")
    total_value: str = Field(..., description="Total portfolio value in base currency")
    account_count: int = Field(..., description="Number of accounts with balance")
    accounts: List[PortfolioAccountDetail] = Field(..., description="Account details")
    last_updated: datetime = Field(..., description="Last update timestamp")

    class Config:
        from_attributes = True


class PaymentTransactionRequest(BaseModel):
    """Request schema for payment transactions"""
    payee_id: str = Field(..., description="Payment recipient user ID")
    currency_code: str = Field(..., description="Payment currency")
    amount: str = Field(..., description="Payment amount")
    description: Optional[str] = Field(None, description="Payment description")
    project_id: Optional[str] = Field(None, description="Related project ID")
    auto_convert_currency: Optional[str] = Field(None, description="Auto-convert to this currency")

    @validator('amount')
    def validate_amount(cls, v):
        try:
            decimal_amount = Decimal(v)
            if decimal_amount <= 0:
                raise ValueError('Amount must be positive')
            return v
        except:
            raise ValueError('Invalid amount format')

    @validator('payee_id', 'project_id')
    def validate_uuids(cls, v):
        if v is None:
            return v
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError('Invalid UUID format')

    class Config:
        from_attributes = True


class PaymentTransactionResponse(BaseModel):
    """Response schema for payment transactions"""
    id: str
    payer_id: str
    payee_id: str
    currency: CurrencyResponse
    gross_amount: str
    fee_amount: str
    net_amount: str
    original_currency: Optional[CurrencyResponse] = None
    original_amount: Optional[str] = None
    conversion_fee: Optional[str] = None
    transaction_type: str
    status: str
    reference_id: Optional[str] = None
    description: Optional[str] = None
    tx_hash: Optional[str] = None
    gas_fee: Optional[str] = None
    project_id: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EscrowCreateRequest(BaseModel):
    """Request schema for creating escrow accounts"""
    project_id: str = Field(..., description="Project ID")
    freelancer_id: str = Field(..., description="Freelancer user ID")
    currency_code: str = Field(..., description="Escrow currency")
    total_amount: str = Field(..., description="Total escrow amount")
    auto_release_days: int = Field(7, description="Auto-release after X days")
    requires_both_signatures: bool = Field(False, description="Require both signatures")
    allow_partial_release: bool = Field(True, description="Allow partial releases")
    milestones: Optional[List[Dict[str, Any]]] = Field(None, description="Milestone definitions")

    @validator('total_amount')
    def validate_amount(cls, v):
        try:
            decimal_amount = Decimal(v)
            if decimal_amount <= 0:
                raise ValueError('Amount must be positive')
            return v
        except:
            raise ValueError('Invalid amount format')

    @validator('project_id', 'freelancer_id')
    def validate_uuids(cls, v):
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError('Invalid UUID format')

    @validator('auto_release_days')
    def validate_auto_release_days(cls, v):
        if v < 1 or v > 365:
            raise ValueError('Auto release days must be between 1 and 365')
        return v

    class Config:
        from_attributes = True


class EscrowResponse(BaseModel):
    """Response schema for escrow accounts"""
    id: str
    project_id: str
    client_id: str
    freelancer_id: str
    currency: CurrencyResponse
    total_amount: str
    released_amount: str
    held_amount: str
    auto_release_days: int
    requires_both_signatures: bool
    allow_partial_release: bool
    status: str
    current_milestone: int
    is_disputed: bool
    dispute_reason: Optional[str] = None
    dispute_created_at: Optional[datetime] = None
    arbitrator_id: Optional[str] = None
    contract_address: Optional[str] = None
    milestones: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    expires_at: Optional[datetime] = None
    released_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EscrowReleaseRequest(BaseModel):
    """Request schema for escrow releases"""
    amount: str = Field(..., description="Amount to release")
    milestone: Optional[int] = Field(None, description="Milestone number")
    reason: Optional[str] = Field(None, description="Release reason")

    @validator('amount')
    def validate_amount(cls, v):
        try:
            decimal_amount = Decimal(v)
            if decimal_amount <= 0:
                raise ValueError('Amount must be positive')
            return v
        except:
            raise ValueError('Invalid amount format')

    class Config:
        from_attributes = True


class EscrowDisputeRequest(BaseModel):
    """Request schema for escrow disputes"""
    reason: str = Field(..., description="Dispute reason")
    evidence: Optional[str] = Field(None, description="Supporting evidence")
    requested_action: Optional[str] = Field(None, description="Requested resolution")

    @validator('reason')
    def validate_reason(cls, v):
        if len(v.strip()) < 10:
            raise ValueError('Dispute reason must be at least 10 characters')
        return v.strip()

    class Config:
        from_attributes = True


class TransactionHistoryResponse(BaseModel):
    """Response schema for transaction history"""
    transactions: List[PaymentTransactionResponse]
    total_count: int
    page: int
    page_size: int
    has_next: bool
    has_previous: bool

    class Config:
        from_attributes = True


class CurrencyBalanceResponse(BaseModel):
    """Response schema for currency balance"""
    currency_code: str
    available_balance: str
    held_balance: str
    total_balance: str
    last_updated: datetime

    class Config:
        from_attributes = True


class FinancialStatsResponse(BaseModel):
    """Response schema for financial statistics"""
    total_portfolio_value_usd: str
    total_earned: str
    total_spent: str
    total_conversions: int
    active_escrows: int
    pending_payments: int
    currency_distribution: List[Dict[str, str]]
    monthly_volume: List[Dict[str, str]]

    class Config:
        from_attributes = True
