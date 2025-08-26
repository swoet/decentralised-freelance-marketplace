"""OAuth endpoints for third-party integrations."""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from app.api import deps
from app.services.oauth_service import OAuthService
from app.services.webhook_service import WebhookService
from app.core.config import settings

router = APIRouter(prefix="/oauth", tags=["oauth"])


@router.get("/connect/{provider}")
def initiate_oauth_flow(
    provider: str,
    scopes: Optional[str] = Query(None, description="Comma-separated list of scopes"),
    redirect_uri: Optional[str] = Query(None, description="Custom redirect URI"),
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Initiate OAuth flow for a provider."""
    if not settings.OAUTH_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OAuth integrations are disabled"
        )
    
    supported_providers = ["slack", "jira", "trello", "github"]
    if provider not in supported_providers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported provider. Supported: {', '.join(supported_providers)}"
        )
    
    oauth_service = OAuthService(db)
    
    try:
        scope_list = scopes.split(',') if scopes else None
        auth_url, state = oauth_service.generate_oauth_url(
            provider=provider,
            user_id=str(current_user.id),
            scopes=scope_list,
            redirect_uri=redirect_uri
        )
        
        return {
            "auth_url": auth_url,
            "state": state,
            "provider": provider
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate OAuth flow: {str(e)}"
        )


@router.post("/callback/{provider}")
def handle_oauth_callback(
    provider: str,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
    db: Session = Depends(deps.get_db)
):
    """Handle OAuth callback from provider."""
    if not settings.OAUTH_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OAuth integrations are disabled"
        )
    
    if error:
        error_msg = error_description or error
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth error: {error_msg}"
        )
    
    if not code or not state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required parameters: code and state"
        )
    
    oauth_service = OAuthService(db)
    
    try:
        result = oauth_service.handle_oauth_callback(
            provider=provider,
            code=code,
            state=state
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return {
            "success": True,
            "provider": provider,
            "user_info": result["user_info"],
            "message": f"Successfully connected {provider} account"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth callback error: {str(e)}"
        )


@router.delete("/disconnect/{provider}")
def disconnect_oauth_provider(
    provider: str,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Disconnect OAuth integration for a provider."""
    oauth_service = OAuthService(db)
    
    success = oauth_service.disconnect_provider(
        user_id=str(current_user.id),
        provider=provider
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active {provider} integration found"
        )
    
    return {
        "success": True,
        "message": f"Successfully disconnected {provider} integration"
    }


@router.get("/connections")
def get_user_oauth_connections(
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user)
):
    """Get all OAuth connections for the current user."""
    oauth_service = OAuthService(db)
    
    connections = oauth_service.get_user_tokens(str(current_user.id))
    
    return {
        "connections": connections,
        "total_connections": len(connections)
    }


@router.post("/webhook/{provider}")
async def receive_webhook(
    provider: str,
    request: Request,
    db: Session = Depends(deps.get_db)
):
    """Receive and process webhooks from OAuth providers."""
    try:
        # Get request body and headers
        body = await request.body()
        headers = dict(request.headers)
        
        # Parse JSON payload
        try:
            import json
            payload = json.loads(body.decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON payload"
            )
        
        # Extract signature from headers
        signature = None
        if provider == "github":
            signature = headers.get('x-hub-signature-256')
        elif provider == "slack":
            signature = headers.get('x-slack-signature')
        elif provider == "stripe":
            signature = headers.get('stripe-signature')
        elif provider == "jira":
            signature = headers.get('x-atlassian-webhook-identifier')
        elif provider == "trello":
            signature = headers.get('x-trello-webhook')
        
        # Determine event type
        event_type = None
        if provider == "github":
            event_type = headers.get('x-github-event')
        elif provider == "slack":
            event_type = payload.get('type') or payload.get('event', {}).get('type')
        elif provider == "stripe":
            event_type = payload.get('type')
        elif provider == "jira":
            event_type = payload.get('webhookEvent')
        elif provider == "trello":
            event_type = payload.get('action', {}).get('type')
        
        if not event_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not determine event type"
            )
        
        # Process webhook
        webhook_service = WebhookService(db)
        result = webhook_service.process_webhook(
            provider=provider,
            event_type=event_type,
            payload=payload,
            headers=headers,
            signature=signature
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return {
            "success": True,
            "event_id": result["event_id"],
            "job_id": result["job_id"],
            "message": result["message"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webhook processing error: {str(e)}"
        )


@router.get("/webhook/stats")
def get_webhook_stats(
    provider: Optional[str] = Query(None, description="Filter by provider"),
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user)  # Admin only endpoint
):
    """Get webhook processing statistics (admin only)."""
    webhook_service = WebhookService(db)
    stats = webhook_service.get_webhook_stats(provider)
    
    return {
        "provider": provider or "all",
        "stats": stats
    }
