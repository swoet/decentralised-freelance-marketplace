"""
Multi-Currency API Endpoints

Provides endpoints for:
- Currency management
- Exchange rates
- Multi-currency accounts
- Currency conversion
- Portfolio overview
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
import uuid
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.financial import Currency, MultiCurrencyAccount, CurrencyConversion, PaymentTransaction
from app.services.financial.multi_currency_service import multi_currency_service
from app.schemas.financial import (
    CurrencyResponse, MultiCurrencyAccountResponse, ConversionQuoteResponse,
    ConversionRequest, PortfolioResponse, ExchangeRateResponse
)

router = APIRouter()


@router.get("/currencies", response_model=List[CurrencyResponse])
async def get_supported_currencies(
    currency_type: Optional[str] = Query(None, description="Filter by currency type: fiat, crypto, stablecoin"),
    db: Session = Depends(get_db)
):
    """Get all supported currencies"""
    try:
        currencies = await multi_currency_service.get_active_currencies(db)
        
        # Filter by type if specified
        if currency_type:
            currencies = [c for c in currencies if c.currency_type == currency_type.lower()]
        
        return [
            CurrencyResponse(
                id=str(c.id),
                code=c.code,
                name=c.name,
                symbol=c.symbol,
                currency_type=c.currency_type,
                decimals=c.decimals,
                min_amount=str(c.min_amount),
                max_amount=str(c.max_amount) if c.max_amount else None,
                is_active=c.is_active,
                chain_id=c.chain_id,
                contract_address=c.contract_address,
                icon_url=c.icon_url,
                description=c.description
            ) for c in currencies
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving currencies: {str(e)}"
        )


@router.post("/initialize", status_code=status.HTTP_201_CREATED)
async def initialize_currency_system(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Initialize the multi-currency system (admin only)"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can initialize the currency system"
        )
    
    try:
        await multi_currency_service.initialize_currencies(db)
        await multi_currency_service.update_exchange_rates(db)
        return {"message": "Currency system initialized successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error initializing currency system: {str(e)}"
        )


@router.post("/rates/update", status_code=status.HTTP_200_OK)
async def update_exchange_rates(
    base_currency: str = Query("USD", description="Base currency for rates"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update exchange rates (admin or automated process)"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can manually update exchange rates"
        )
    
    try:
        success = await multi_currency_service.update_exchange_rates(db, base_currency)
        if success:
            return {"message": f"Exchange rates updated with base currency {base_currency}"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update exchange rates"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating exchange rates: {str(e)}"
        )


@router.get("/rates/{from_currency}/{to_currency}", response_model=ExchangeRateResponse)
async def get_exchange_rate(
    from_currency: str,
    to_currency: str,
    db: Session = Depends(get_db)
):
    """Get current exchange rate between two currencies"""
    try:
        rate = await multi_currency_service.get_exchange_rate(db, from_currency, to_currency)
        
        if not rate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Exchange rate not found for {from_currency} to {to_currency}"
            )
        
        return ExchangeRateResponse(
            id=str(rate.id),
            from_currency=rate.from_currency.code,
            to_currency=rate.to_currency.code,
            rate=str(rate.rate),
            inverse_rate=str(rate.inverse_rate),
            source=rate.source,
            confidence_score=str(rate.confidence_score),
            rate_timestamp=rate.rate_timestamp,
            expires_at=rate.expires_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving exchange rate: {str(e)}"
        )


@router.get("/accounts", response_model=List[MultiCurrencyAccountResponse])
async def get_user_currency_accounts(
    include_zero_balance: bool = Query(False, description="Include accounts with zero balance"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all currency accounts for the current user"""
    try:
        accounts = await multi_currency_service.get_user_accounts(
            db, str(current_user.id), include_zero_balance
        )
        
        return [
            MultiCurrencyAccountResponse(
                id=str(account.id),
                currency=CurrencyResponse(
                    id=str(account.currency.id),
                    code=account.currency.code,
                    name=account.currency.name,
                    symbol=account.currency.symbol,
                    currency_type=account.currency.currency_type,
                    decimals=account.currency.decimals,
                    min_amount=str(account.currency.min_amount),
                    max_amount=str(account.currency.max_amount) if account.currency.max_amount else None,
                    is_active=account.currency.is_active
                ),
                available_balance=str(account.available_balance),
                held_balance=str(account.held_balance),
                total_balance=str(account.total_balance),
                is_primary=account.is_primary,
                is_active=account.is_active,
                created_at=account.created_at,
                last_activity=account.last_activity
            ) for account in accounts
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving currency accounts: {str(e)}"
        )


@router.post("/accounts/{currency_code}", response_model=MultiCurrencyAccountResponse)
async def create_currency_account(
    currency_code: str,
    is_primary: bool = Query(False, description="Set as primary account for this currency"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new currency account for the user"""
    try:
        account = await multi_currency_service.create_currency_account(
            db, str(current_user.id), currency_code, is_primary
        )
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Currency {currency_code} not found or not supported"
            )
        
        return MultiCurrencyAccountResponse(
            id=str(account.id),
            currency=CurrencyResponse(
                id=str(account.currency.id),
                code=account.currency.code,
                name=account.currency.name,
                symbol=account.currency.symbol,
                currency_type=account.currency.currency_type,
                decimals=account.currency.decimals,
                min_amount=str(account.currency.min_amount),
                max_amount=str(account.currency.max_amount) if account.currency.max_amount else None,
                is_active=account.currency.is_active
            ),
            available_balance=str(account.available_balance),
            held_balance=str(account.held_balance),
            total_balance=str(account.total_balance),
            is_primary=account.is_primary,
            is_active=account.is_active,
            created_at=account.created_at,
            last_activity=account.last_activity
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating currency account: {str(e)}"
        )


@router.get("/portfolio", response_model=PortfolioResponse)
async def get_portfolio_overview(
    base_currency: str = Query("USD", description="Currency to show total value in"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's multi-currency portfolio overview"""
    try:
        # Get all accounts
        accounts = await multi_currency_service.get_user_accounts(db, str(current_user.id), True)
        
        # Calculate total value in base currency
        total_value = await multi_currency_service.get_portfolio_value_in_currency(
            db, str(current_user.id), base_currency
        )
        
        # Build account details with converted values
        account_details = []
        for account in accounts:
            # Convert to base currency
            if account.currency.code == base_currency:
                converted_value = account.total_balance
            else:
                converted_value, _ = await multi_currency_service.convert_currency(
                    db, account.total_balance, account.currency.code, base_currency
                )
                if converted_value is None:
                    converted_value = Decimal('0')
            
            account_details.append({
                "currency_code": account.currency.code,
                "currency_name": account.currency.name,
                "currency_symbol": account.currency.symbol,
                "balance": str(account.total_balance),
                "available_balance": str(account.available_balance),
                "held_balance": str(account.held_balance),
                "value_in_base_currency": str(converted_value),
                "percentage_of_total": str((converted_value / total_value * 100).quantize(Decimal('0.01'))) if total_value > 0 else "0.00"
            })
        
        return PortfolioResponse(
            base_currency=base_currency,
            total_value=str(total_value),
            account_count=len([a for a in accounts if a.total_balance > 0]),
            accounts=account_details,
            last_updated=datetime.utcnow()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving portfolio: {str(e)}"
        )


@router.post("/conversion/quote", response_model=ConversionQuoteResponse)
async def get_conversion_quote(
    from_currency: str = Query(..., description="Source currency code"),
    to_currency: str = Query(..., description="Target currency code"),
    amount: str = Query(..., description="Amount to convert"),
    db: Session = Depends(get_db)
):
    """Get a quote for currency conversion"""
    try:
        amount_decimal = Decimal(amount)
        if amount_decimal <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Amount must be positive"
            )
        
        quote = await multi_currency_service.get_conversion_quote(
            db, from_currency, to_currency, amount_decimal
        )
        
        if not quote:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to get conversion quote for {from_currency} to {to_currency}"
            )
        
        return ConversionQuoteResponse(**quote)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid amount format"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting conversion quote: {str(e)}"
        )


@router.post("/conversion", response_model=dict)
async def convert_currency(
    conversion_request: ConversionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Convert currency between user's accounts"""
    try:
        amount = Decimal(conversion_request.amount)
        if amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Amount must be positive"
            )
        
        # Check if user has sufficient balance
        available_balance, _, _ = await multi_currency_service.get_account_balance(
            db, str(current_user.id), conversion_request.from_currency
        )
        
        if available_balance < amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient balance for conversion"
            )
        
        conversion = await multi_currency_service.process_currency_conversion(
            db, 
            str(current_user.id),
            conversion_request.from_currency,
            conversion_request.to_currency,
            amount
        )
        
        if not conversion:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Conversion failed"
            )
        
        return {
            "id": str(conversion.id),
            "from_currency": conversion_request.from_currency,
            "to_currency": conversion_request.to_currency,
            "from_amount": str(conversion.from_amount),
            "to_amount": str(conversion.to_amount),
            "exchange_rate": str(conversion.exchange_rate),
            "conversion_fee": str(conversion.conversion_fee),
            "status": conversion.status,
            "initiated_at": conversion.initiated_at,
            "completed_at": conversion.completed_at
        }
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid amount format"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing conversion: {str(e)}"
        )


@router.get("/conversions", response_model=List[dict])
async def get_conversion_history(
    limit: int = Query(50, ge=1, le=100, description="Number of conversions to return"),
    offset: int = Query(0, ge=0, description="Number of conversions to skip"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's currency conversion history"""
    try:
        conversions = db.query(CurrencyConversion).filter(
            CurrencyConversion.user_id == current_user.id
        ).order_by(CurrencyConversion.initiated_at.desc()).offset(offset).limit(limit).all()
        
        return [
            {
                "id": str(conversion.id),
                "from_currency": conversion.from_currency.code,
                "to_currency": conversion.to_currency.code,
                "from_amount": str(conversion.from_amount),
                "to_amount": str(conversion.to_amount),
                "exchange_rate": str(conversion.exchange_rate),
                "conversion_fee": str(conversion.conversion_fee),
                "status": conversion.status,
                "initiated_at": conversion.initiated_at,
                "completed_at": conversion.completed_at
            } for conversion in conversions
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving conversion history: {str(e)}"
        )


@router.get("/balance/{currency_code}")
async def get_currency_balance(
    currency_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's balance for a specific currency"""
    try:
        available, held, total = await multi_currency_service.get_account_balance(
            db, str(current_user.id), currency_code
        )
        
        return {
            "currency_code": currency_code.upper(),
            "available_balance": str(available),
            "held_balance": str(held),
            "total_balance": str(total)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving balance: {str(e)}"
        )
