from fastapi import APIRouter, Request, HTTPException, status
from app.services.stripe import create_payment_intent, handle_webhook

router = APIRouter(prefix="/stripe", tags=["stripe"])

@router.post("/payment-intent")
def create_payment_intent_view(data: dict):
    return create_payment_intent(data)

@router.post("/webhook")
def stripe_webhook(request: Request):
    return handle_webhook(request) 