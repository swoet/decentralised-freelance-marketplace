"""
Stripe payment service for handling payments and webhooks.
"""

import stripe
from typing import Dict, Any
import os

# Initialize Stripe with API key from environment
stripe.api_key = os.getenv('STRIPE_SECRET_KEY', '')

def create_payment_intent(amount: int, currency: str = 'usd', metadata: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Create a Stripe payment intent.
    
    Args:
        amount: Amount in cents
        currency: Currency code (default: 'usd')
        metadata: Additional metadata for the payment
        
    Returns:
        Payment intent data
    """
    try:
        if not stripe.api_key:
            raise ValueError("Stripe API key not configured")
            
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency=currency,
            metadata=metadata or {}
        )
        
        return {
            'client_secret': intent.client_secret,
            'payment_intent_id': intent.id,
            'amount': intent.amount,
            'currency': intent.currency,
            'status': intent.status
        }
    except stripe.error.StripeError as e:
        raise RuntimeError(f"Stripe error: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Failed to create payment intent: {str(e)}")

def handle_webhook(payload: str, sig_header: str) -> Dict[str, Any]:
    """
    Handle Stripe webhook events.
    
    Args:
        payload: Raw webhook payload
        sig_header: Stripe signature header
        
    Returns:
        Webhook event data
    """
    try:
        webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET', '')
        if not webhook_secret:
            raise ValueError("Stripe webhook secret not configured")
            
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
        
        # Handle different event types
        if event['type'] == 'payment_intent.succeeded':
            return handle_payment_success(event['data']['object'])
        elif event['type'] == 'payment_intent.payment_failed':
            return handle_payment_failure(event['data']['object'])
        else:
            return {'status': 'ignored', 'event_type': event['type']}
            
    except ValueError as e:
        raise ValueError(f"Invalid payload: {str(e)}")
    except stripe.error.SignatureVerificationError as e:
        raise ValueError(f"Invalid signature: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Webhook handling failed: {str(e)}")

def handle_payment_success(payment_intent: Dict[str, Any]) -> Dict[str, Any]:
    """Handle successful payment."""
    return {
        'status': 'success',
        'payment_intent_id': payment_intent['id'],
        'amount': payment_intent['amount'],
        'currency': payment_intent['currency']
    }

def handle_payment_failure(payment_intent: Dict[str, Any]) -> Dict[str, Any]:
    """Handle failed payment."""
    return {
        'status': 'failed',
        'payment_intent_id': payment_intent['id'],
        'error': payment_intent.get('last_payment_error', {}).get('message', 'Unknown error')
    }
