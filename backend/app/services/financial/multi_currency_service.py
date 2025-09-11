"""
Multi-Currency Payment Service

Handles multi-currency operations including:
- Real-time exchange rate fetching
- Currency conversion
- Multi-currency account management
- Payment processing with automatic conversion
"""

import asyncio
import aiohttp
import logging
from decimal import Decimal, ROUND_DOWN, ROUND_UP
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Union
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc

from app.models.financial import (
    Currency, ExchangeRate, MultiCurrencyAccount, PaymentTransaction, 
    CurrencyConversion, PaymentStatus, CurrencyType
)
from app.core.database import get_db
from app.core.config import settings

logger = logging.getLogger(__name__)


class ExchangeRateProvider:
    """Base class for exchange rate providers"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key
        
    async def get_rates(self, base_currency: str, target_currencies: List[str]) -> Dict[str, Decimal]:
        """Get exchange rates from base currency to target currencies"""
        raise NotImplementedError


class CoinGeckoProvider(ExchangeRateProvider):
    """CoinGecko exchange rate provider"""
    
    BASE_URL = "https://api.coingecko.com/api/v3"
    
    # Currency code mappings
    CURRENCY_MAP = {
        'USD': 'usd', 'EUR': 'eur', 'GBP': 'gbp',
        'BTC': 'bitcoin', 'ETH': 'ethereum',
        'USDC': 'usd-coin', 'USDT': 'tether'
    }
    
    async def get_rates(self, base_currency: str, target_currencies: List[str]) -> Dict[str, Decimal]:
        """Fetch rates from CoinGecko API"""
        try:
            base_id = self.CURRENCY_MAP.get(base_currency, base_currency.lower())
            target_ids = [self.CURRENCY_MAP.get(curr, curr.lower()) for curr in target_currencies]
            
            async with aiohttp.ClientSession() as session:
                url = f"{self.BASE_URL}/simple/price"
                params = {
                    'ids': base_id,
                    'vs_currencies': ','.join(target_ids)
                }
                
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        base_data = data.get(base_id, {})
                        
                        rates = {}
                        for target_curr in target_currencies:
                            target_id = self.CURRENCY_MAP.get(target_curr, target_curr.lower())
                            if target_id in base_data:
                                rates[target_curr] = Decimal(str(base_data[target_id]))
                        
                        return rates
                    else:
                        logger.error(f"CoinGecko API error: {response.status}")
                        return {}
                        
        except Exception as e:
            logger.error(f"Error fetching rates from CoinGecko: {e}")
            return {}


class CoinbaseProvider(ExchangeRateProvider):
    """Coinbase exchange rate provider"""
    
    BASE_URL = "https://api.coinbase.com/v2"
    
    async def get_rates(self, base_currency: str, target_currencies: List[str]) -> Dict[str, Decimal]:
        """Fetch rates from Coinbase API"""
        try:
            rates = {}
            async with aiohttp.ClientSession() as session:
                for target_currency in target_currencies:
                    url = f"{self.BASE_URL}/exchange-rates"
                    params = {'currency': base_currency}
                    
                    async with session.get(url, params=params) as response:
                        if response.status == 200:
                            data = await response.json()
                            exchange_rates = data.get('data', {}).get('rates', {})
                            
                            if target_currency in exchange_rates:
                                rates[target_currency] = Decimal(exchange_rates[target_currency])
                                
            return rates
            
        except Exception as e:
            logger.error(f"Error fetching rates from Coinbase: {e}")
            return {}


class MultiCurrencyService:
    """Service for multi-currency operations"""
    
    def __init__(self):
        self.rate_providers = [
            CoinGeckoProvider(),
            CoinbaseProvider()
        ]
        self.rate_cache_duration = timedelta(minutes=5)  # Cache rates for 5 minutes
        
    async def initialize_currencies(self, db: Session):
        """Initialize supported currencies in the database"""
        currencies_data = [
            # Fiat currencies
            {
                'code': 'USD', 'name': 'US Dollar', 'symbol': '$',
                'currency_type': CurrencyType.FIAT.value, 'decimals': 2,
                'display_order': 1, 'is_active': True
            },
            {
                'code': 'EUR', 'name': 'Euro', 'symbol': '€',
                'currency_type': CurrencyType.FIAT.value, 'decimals': 2,
                'display_order': 2, 'is_active': True
            },
            {
                'code': 'GBP', 'name': 'British Pound', 'symbol': '£',
                'currency_type': CurrencyType.FIAT.value, 'decimals': 2,
                'display_order': 3, 'is_active': True
            },
            # Cryptocurrencies
            {
                'code': 'BTC', 'name': 'Bitcoin', 'symbol': '₿',
                'currency_type': CurrencyType.CRYPTO.value, 'decimals': 8,
                'display_order': 4, 'is_active': True,
                'min_amount': Decimal('0.00001')
            },
            {
                'code': 'ETH', 'name': 'Ethereum', 'symbol': 'Ξ',
                'currency_type': CurrencyType.CRYPTO.value, 'decimals': 18,
                'display_order': 5, 'is_active': True,
                'min_amount': Decimal('0.001'), 'chain_id': 1
            },
            # Stablecoins
            {
                'code': 'USDC', 'name': 'USD Coin', 'symbol': 'USDC',
                'currency_type': CurrencyType.STABLECOIN.value, 'decimals': 6,
                'display_order': 6, 'is_active': True,
                'chain_id': 1, 'contract_address': '0xA0b86a33E6E5e0b3c1c4BFB7E5e7e8e9a4F4e1a0b86a33'
            },
            {
                'code': 'USDT', 'name': 'Tether', 'symbol': 'USDT',
                'currency_type': CurrencyType.STABLECOIN.value, 'decimals': 6,
                'display_order': 7, 'is_active': True,
                'chain_id': 1, 'contract_address': '0xdAC17F958D2ee523a2206206994597C13D831ec7'
            }
        ]
        
        for curr_data in currencies_data:
            # Check if currency already exists
            existing = db.query(Currency).filter(Currency.code == curr_data['code']).first()
            if not existing:
                currency = Currency(**curr_data)
                db.add(currency)
                
        db.commit()
        logger.info("Initialized supported currencies")
    
    async def get_active_currencies(self, db: Session) -> List[Currency]:
        """Get all active currencies"""
        return db.query(Currency).filter(
            Currency.is_active == True
        ).order_by(Currency.display_order).all()
    
    async def get_currency_by_code(self, db: Session, code: str) -> Optional[Currency]:
        """Get currency by code"""
        return db.query(Currency).filter(
            and_(Currency.code == code.upper(), Currency.is_active == True)
        ).first()
    
    async def update_exchange_rates(self, db: Session, base_currency: str = 'USD'):
        """Update exchange rates for all active currencies"""
        try:
            base_curr = await self.get_currency_by_code(db, base_currency)
            if not base_curr:
                logger.error(f"Base currency {base_currency} not found")
                return False
            
            active_currencies = await self.get_active_currencies(db)
            target_codes = [curr.code for curr in active_currencies if curr.code != base_currency]
            
            # Fetch rates from multiple providers
            all_rates = {}
            for provider in self.rate_providers:
                try:
                    rates = await provider.get_rates(base_currency, target_codes)
                    all_rates[provider.__class__.__name__] = rates
                except Exception as e:
                    logger.error(f"Error from {provider.__class__.__name__}: {e}")
            
            # Average rates from multiple providers
            averaged_rates = self._average_rates(all_rates)
            
            # Store rates in database
            now = datetime.utcnow()
            expires_at = now + self.rate_cache_duration
            
            for target_code, rate in averaged_rates.items():
                target_curr = await self.get_currency_by_code(db, target_code)
                if not target_curr:
                    continue
                
                # Create exchange rate record
                exchange_rate = ExchangeRate(
                    from_currency_id=base_curr.id,
                    to_currency_id=target_curr.id,
                    rate=rate,
                    inverse_rate=Decimal('1') / rate,
                    source='aggregated',
                    confidence_score=Decimal('0.95'),
                    rate_timestamp=now,
                    expires_at=expires_at
                )
                db.add(exchange_rate)
                
                # Also create reverse rate
                reverse_rate = ExchangeRate(
                    from_currency_id=target_curr.id,
                    to_currency_id=base_curr.id,
                    rate=Decimal('1') / rate,
                    inverse_rate=rate,
                    source='aggregated',
                    confidence_score=Decimal('0.95'),
                    rate_timestamp=now,
                    expires_at=expires_at
                )
                db.add(reverse_rate)
            
            db.commit()
            logger.info(f"Updated exchange rates for {len(averaged_rates)} currencies")
            return True
            
        except Exception as e:
            logger.error(f"Error updating exchange rates: {e}")
            db.rollback()
            return False
    
    def _average_rates(self, provider_rates: Dict[str, Dict[str, Decimal]]) -> Dict[str, Decimal]:
        """Average rates from multiple providers"""
        averaged = {}
        
        # Get all currencies that have rates from any provider
        all_currencies = set()
        for rates in provider_rates.values():
            all_currencies.update(rates.keys())
        
        for currency in all_currencies:
            rates = []
            for provider_name, rates_dict in provider_rates.items():
                if currency in rates_dict:
                    rates.append(rates_dict[currency])
            
            if rates:
                # Use median to reduce impact of outliers
                sorted_rates = sorted(rates)
                n = len(sorted_rates)
                if n % 2 == 0:
                    averaged[currency] = (sorted_rates[n//2 - 1] + sorted_rates[n//2]) / 2
                else:
                    averaged[currency] = sorted_rates[n//2]
        
        return averaged
    
    async def get_exchange_rate(
        self, 
        db: Session, 
        from_currency_code: str, 
        to_currency_code: str,
        max_age_minutes: int = 10
    ) -> Optional[ExchangeRate]:
        """Get current exchange rate between two currencies"""
        if from_currency_code == to_currency_code:
            return None  # Same currency
        
        from_curr = await self.get_currency_by_code(db, from_currency_code)
        to_curr = await self.get_currency_by_code(db, to_currency_code)
        
        if not from_curr or not to_curr:
            return None
        
        # Look for recent exchange rate
        cutoff_time = datetime.utcnow() - timedelta(minutes=max_age_minutes)
        
        rate = db.query(ExchangeRate).filter(
            and_(
                ExchangeRate.from_currency_id == from_curr.id,
                ExchangeRate.to_currency_id == to_curr.id,
                ExchangeRate.rate_timestamp >= cutoff_time,
                or_(
                    ExchangeRate.expires_at.is_(None),
                    ExchangeRate.expires_at > datetime.utcnow()
                )
            )
        ).order_by(desc(ExchangeRate.rate_timestamp)).first()
        
        return rate
    
    async def convert_currency(
        self,
        db: Session,
        amount: Decimal,
        from_currency_code: str,
        to_currency_code: str,
        user_id: str = None
    ) -> Optional[Tuple[Decimal, ExchangeRate]]:
        """Convert amount from one currency to another"""
        if from_currency_code == to_currency_code:
            return amount, None
        
        rate = await self.get_exchange_rate(db, from_currency_code, to_currency_code)
        if not rate:
            # Try to get rates and retry
            await self.update_exchange_rates(db)
            rate = await self.get_exchange_rate(db, from_currency_code, to_currency_code)
            
            if not rate:
                logger.error(f"No exchange rate found for {from_currency_code} to {to_currency_code}")
                return None
        
        converted_amount = amount * rate.rate
        
        # Round to appropriate decimal places for target currency
        to_curr = await self.get_currency_by_code(db, to_currency_code)
        if to_curr:
            decimal_places = to_curr.decimals
            converted_amount = converted_amount.quantize(
                Decimal('0.1') ** decimal_places, 
                rounding=ROUND_DOWN
            )
        
        return converted_amount, rate
    
    async def create_currency_account(
        self,
        db: Session,
        user_id: str,
        currency_code: str,
        is_primary: bool = False
    ) -> Optional[MultiCurrencyAccount]:
        """Create a multi-currency account for a user"""
        currency = await self.get_currency_by_code(db, currency_code)
        if not currency:
            return None
        
        # Check if account already exists
        existing = db.query(MultiCurrencyAccount).filter(
            and_(
                MultiCurrencyAccount.user_id == user_id,
                MultiCurrencyAccount.currency_id == currency.id
            )
        ).first()
        
        if existing:
            return existing
        
        account = MultiCurrencyAccount(
            user_id=user_id,
            currency_id=currency.id,
            is_primary=is_primary,
            available_balance=Decimal('0'),
            held_balance=Decimal('0'),
            total_balance=Decimal('0')
        )
        
        db.add(account)
        db.commit()
        db.refresh(account)
        
        return account
    
    async def get_user_accounts(
        self,
        db: Session,
        user_id: str,
        include_zero_balance: bool = False
    ) -> List[MultiCurrencyAccount]:
        """Get all currency accounts for a user"""
        query = db.query(MultiCurrencyAccount).filter(
            and_(
                MultiCurrencyAccount.user_id == user_id,
                MultiCurrencyAccount.is_active == True
            )
        )
        
        if not include_zero_balance:
            query = query.filter(MultiCurrencyAccount.total_balance > 0)
        
        return query.order_by(
            MultiCurrencyAccount.is_primary.desc(),
            MultiCurrencyAccount.total_balance.desc()
        ).all()
    
    async def get_account_balance(
        self,
        db: Session,
        user_id: str,
        currency_code: str
    ) -> Tuple[Decimal, Decimal, Decimal]:
        """Get account balances (available, held, total) for user and currency"""
        currency = await self.get_currency_by_code(db, currency_code)
        if not currency:
            return Decimal('0'), Decimal('0'), Decimal('0')
        
        account = db.query(MultiCurrencyAccount).filter(
            and_(
                MultiCurrencyAccount.user_id == user_id,
                MultiCurrencyAccount.currency_id == currency.id,
                MultiCurrencyAccount.is_active == True
            )
        ).first()
        
        if not account:
            return Decimal('0'), Decimal('0'), Decimal('0')
        
        return account.available_balance, account.held_balance, account.total_balance
    
    async def update_account_balance(
        self,
        db: Session,
        user_id: str,
        currency_code: str,
        available_delta: Decimal = Decimal('0'),
        held_delta: Decimal = Decimal('0'),
        create_if_not_exists: bool = True
    ) -> bool:
        """Update account balance for user"""
        currency = await self.get_currency_by_code(db, currency_code)
        if not currency:
            return False
        
        account = db.query(MultiCurrencyAccount).filter(
            and_(
                MultiCurrencyAccount.user_id == user_id,
                MultiCurrencyAccount.currency_id == currency.id
            )
        ).first()
        
        if not account:
            if create_if_not_exists:
                account = await self.create_currency_account(db, user_id, currency_code)
                if not account:
                    return False
            else:
                return False
        
        # Update balances
        account.available_balance += available_delta
        account.held_balance += held_delta
        account.total_balance = account.available_balance + account.held_balance
        account.last_activity = datetime.utcnow()
        
        # Ensure no negative balances
        if account.available_balance < 0 or account.held_balance < 0:
            logger.error(f"Negative balance attempted for user {user_id}, currency {currency_code}")
            db.rollback()
            return False
        
        db.commit()
        return True
    
    async def process_currency_conversion(
        self,
        db: Session,
        user_id: str,
        from_currency_code: str,
        to_currency_code: str,
        amount: Decimal,
        conversion_fee_percentage: Decimal = Decimal('0.005')
    ) -> Optional[CurrencyConversion]:
        """Process currency conversion between user's accounts"""
        try:
            # Get conversion rate
            converted_amount, exchange_rate = await self.convert_currency(
                db, amount, from_currency_code, to_currency_code
            )
            
            if converted_amount is None:
                return None
            
            # Calculate fees
            conversion_fee = converted_amount * conversion_fee_percentage
            final_amount = converted_amount - conversion_fee
            
            # Check sufficient balance in from_currency
            available_balance, _, _ = await self.get_account_balance(db, user_id, from_currency_code)
            if available_balance < amount:
                logger.error(f"Insufficient balance for conversion: {available_balance} < {amount}")
                return None
            
            # Create conversion record
            conversion = CurrencyConversion(
                user_id=user_id,
                from_currency_id=exchange_rate.from_currency_id,
                to_currency_id=exchange_rate.to_currency_id,
                from_amount=amount,
                to_amount=final_amount,
                exchange_rate=exchange_rate.rate,
                conversion_fee=conversion_fee,
                platform_fee_percentage=conversion_fee_percentage,
                status=PaymentStatus.PROCESSING.value
            )
            
            db.add(conversion)
            db.flush()  # Get the ID
            
            # Update account balances
            # Debit from source currency
            await self.update_account_balance(
                db, user_id, from_currency_code, 
                available_delta=-amount, create_if_not_exists=False
            )
            
            # Credit to target currency
            await self.update_account_balance(
                db, user_id, to_currency_code,
                available_delta=final_amount, create_if_not_exists=True
            )
            
            # Mark conversion as completed
            conversion.status = PaymentStatus.COMPLETED.value
            conversion.completed_at = datetime.utcnow()
            
            db.commit()
            return conversion
            
        except Exception as e:
            logger.error(f"Error processing currency conversion: {e}")
            db.rollback()
            return None
    
    async def get_portfolio_value_in_currency(
        self,
        db: Session,
        user_id: str,
        target_currency_code: str = 'USD'
    ) -> Decimal:
        """Get total portfolio value in specified currency"""
        accounts = await self.get_user_accounts(db, user_id, include_zero_balance=True)
        total_value = Decimal('0')
        
        for account in accounts:
            if account.total_balance <= 0:
                continue
            
            currency = account.currency
            if currency.code == target_currency_code:
                total_value += account.total_balance
            else:
                converted_amount, _ = await self.convert_currency(
                    db, account.total_balance, currency.code, target_currency_code
                )
                if converted_amount:
                    total_value += converted_amount
        
        return total_value
    
    async def get_conversion_quote(
        self,
        db: Session,
        from_currency_code: str,
        to_currency_code: str,
        amount: Decimal,
        fee_percentage: Decimal = Decimal('0.005')
    ) -> Optional[Dict]:
        """Get a conversion quote showing rates and fees"""
        converted_amount, exchange_rate = await self.convert_currency(
            db, amount, from_currency_code, to_currency_code
        )
        
        if converted_amount is None or not exchange_rate:
            return None
        
        conversion_fee = converted_amount * fee_percentage
        final_amount = converted_amount - conversion_fee
        
        return {
            'from_currency': from_currency_code,
            'to_currency': to_currency_code,
            'from_amount': str(amount),
            'exchange_rate': str(exchange_rate.rate),
            'gross_amount': str(converted_amount),
            'conversion_fee': str(conversion_fee),
            'fee_percentage': str(fee_percentage * 100),  # As percentage
            'final_amount': str(final_amount),
            'rate_timestamp': exchange_rate.rate_timestamp.isoformat(),
            'expires_at': exchange_rate.expires_at.isoformat() if exchange_rate.expires_at else None
        }


# Global service instance
multi_currency_service = MultiCurrencyService()
