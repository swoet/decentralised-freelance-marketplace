from __future__ import annotations
import hmac
import hashlib
import base64
import time
import os
import requests
from urllib.parse import urlencode
from fastapi import APIRouter, Depends, HTTPException, Header, Request, Response, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user, get_current_user_optional, get_db
from app.models.user import User
from typing import Optional, List
from app.models.integration import Integration, Webhook, IntegrationRequest
from app.core.config import settings
from app.schemas.integration import (
    IntegrationRequestCreate,
    IntegrationRequestUpdate,
    IntegrationRequestResponse
)

router = APIRouter(prefix="/integrations", tags=["integrations"]) 


@router.get("")
def list_integrations(
    response: Response,
    preview: bool = Query(False, description="Preview mode for anonymous users - shows available integrations"),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    # Add caching headers
    cache_time = 600 if user is None else 120  # 10 min for anonymous, 2 min for authenticated
    response.headers["Cache-Control"] = f"public, max-age={cache_time}, stale-while-revalidate=60"
    response.headers["Vary"] = "Authorization"
    
    # For anonymous users, just return available providers
    if user is None:
        providers = ["slack", "github", "jira", "discord"]
        if preview:
            # In preview mode, add description for each provider
            return {
                "providers": [
                    {"name": "slack", "description": "Team communication and project notifications", "category": "communication"},
                    {"name": "github", "description": "Code repositories and version control", "category": "development"},
                    {"name": "jira", "description": "Issue tracking and project management", "category": "project-management"},
                    {"name": "discord", "description": "Community and voice chat", "category": "communication"}
                ],
                "connected": [],
                "preview": True
            }
        return {"providers": providers, "connected": []}
    
    # For authenticated users, return their connected integrations
    rows = db.query(Integration).filter(Integration.owner_id == user.id).all()
    return {"providers": ["slack", "github", "jira", "discord"], "connected": [
        {"id": str(r.id), "provider": r.provider, "status": r.status} for r in rows
    ]}


@router.post("")
def connect_integration(provider: str, db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    integ = Integration(owner_id=user.id, provider=provider, status="connected")
    db.add(integ)
    db.commit()
    db.refresh(integ)
    return {"id": str(integ.id), "provider": integ.provider}


def _verify_hmac(secret: str | None, body: bytes, signature: str | None) -> bool:
    if not secret:
        return False
    if not signature:
        return False
    try:
        mac = hmac.new(secret.encode('utf-8'), msg=body, digestmod=hashlib.sha256).hexdigest()
        # allow both raw hex or prefixed
        signature = signature.split('=')[-1]
        return hmac.compare_digest(mac, signature)
    except Exception:
        return False


@router.post("/webhooks/{provider}")
async def receive_webhook(provider: str, request: Request, x_signature: str | None = Header(default=None), db: Session = Depends(get_db)):
    body = await request.body()
    # Find a webhook for provider (in a real system, you'd route by ID or secret key id)
    wh = db.query(Webhook).join(Integration, Integration.id == Webhook.integration_id).filter(Integration.provider == provider).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook not found")
    if not _verify_hmac(wh.secret, body, x_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    # TODO: enqueue or process event
    return {"ok": True}

# --- OAuth Integration URLs ---

_FRONTEND_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")
_GITHUB_REDIRECT = os.getenv("GITHUB_REDIRECT_URI", f"http://localhost:8000{settings.API_V1_STR}/integrations/github/callback")
_SLACK_REDIRECT = os.getenv("SLACK_REDIRECT_URI", f"http://localhost:8000{settings.API_V1_STR}/integrations/slack/callback")
_JIRA_REDIRECT = os.getenv("JIRA_REDIRECT_URI", f"http://localhost:8000{settings.API_V1_STR}/integrations/jira/callback")


def _sign_state(user_id: str) -> str:
    payload = f"{user_id}:{int(time.time())}"
    sig = hmac.new(settings.SECRET_KEY.encode('utf-8'), payload.encode('utf-8'), hashlib.sha256).hexdigest()
    raw = f"{payload}:{sig}".encode('utf-8')
    return base64.urlsafe_b64encode(raw).decode('utf-8')


def _verify_state(state: str, max_age_sec: int = 600) -> str | None:
    try:
        raw = base64.urlsafe_b64decode(state.encode('utf-8')).decode('utf-8')
        user_id, ts, sig = raw.split(":")
        expected = hmac.new(settings.SECRET_KEY.encode('utf-8'), f"{user_id}:{ts}".encode('utf-8'), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, sig):
            return None
        if (time.time() - int(ts)) > max_age_sec:
            return None
        return user_id
    except Exception:
        return None


@router.get("/github/connect")
def github_connect(db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    client_id = os.getenv("GITHUB_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="GITHUB_CLIENT_ID not set")
    state = _sign_state(str(user.id))
    params = {
        "client_id": client_id,
        "redirect_uri": _GITHUB_REDIRECT,
        "scope": "read:user",
        "state": state,
    }
    url = f"https://github.com/login/oauth/authorize?{urlencode(params)}"
    return {"url": url}


@router.get("/github/callback")
def github_callback(code: str | None = None, state: str | None = None, db: Session = Depends(get_db)):
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")
    user_id = _verify_state(state)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid state")
    client_id = os.getenv("GITHUB_CLIENT_ID")
    client_secret = os.getenv("GITHUB_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")
    token_res = requests.post(
        "https://github.com/login/oauth/access_token",
        headers={"Accept": "application/json"},
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": _GITHUB_REDIRECT,
        },
        timeout=10,
    )
    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Token exchange failed")
    token_json = token_res.json()
    access_token = token_json.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token returned")

    user_res = requests.get("https://api.github.com/user", headers={"Authorization": f"token {access_token}", "Accept": "application/json"}, timeout=10)
    if user_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch user")
    gh_user = user_res.json()

    # Upsert integration for this user
    integ = db.query(Integration).filter(Integration.owner_id == user_id, Integration.provider == "github").first()
    if not integ:
        integ = Integration(owner_id=user_id, provider="github", status="connected", config_json={})
    integ.config_json = {"access_token": access_token, "github_user": gh_user}
    db.add(integ)
    db.commit()

    return RedirectResponse(url=f"{_FRONTEND_URL}/integrations")


@router.delete("/github")
def github_disconnect(db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    integ = db.query(Integration).filter(Integration.owner_id == user.id, Integration.provider == "github").first()
    if not integ:
        raise HTTPException(status_code=404, detail="Not connected")
    db.delete(integ)
    db.commit()
    return {"ok": True}


# --- Slack OAuth ---

@router.get("/slack/connect")
def slack_connect(db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    client_id = os.getenv("SLACK_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="SLACK_CLIENT_ID not set")
    state = _sign_state(str(user.id))
    params = {
        "client_id": client_id,
        "scope": "channels:read,chat:write,users:read,users:read.email",
        "redirect_uri": _SLACK_REDIRECT,
        "state": state,
        "response_type": "code"
    }
    url = f"https://slack.com/oauth/v2/authorize?{urlencode(params)}"
    return {"url": url}


@router.get("/slack/callback")
def slack_callback(code: str | None = None, state: str | None = None, error: str | None = None, db: Session = Depends(get_db)):
    if error:
        raise HTTPException(status_code=400, detail=f"Slack OAuth error: {error}")
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")
    user_id = _verify_state(state)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid state")
    
    client_id = os.getenv("SLACK_CLIENT_ID")
    client_secret = os.getenv("SLACK_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="Slack OAuth not configured")
    
    # Exchange code for token
    token_res = requests.post(
        "https://slack.com/api/oauth.v2.access",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": _SLACK_REDIRECT,
        },
        timeout=10,
    )
    
    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Token exchange failed")
    
    token_json = token_res.json()
    if not token_json.get("ok"):
        raise HTTPException(status_code=400, detail=f"Slack error: {token_json.get('error', 'Unknown error')}")
    
    access_token = token_json.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token returned")
    
    # Get user info
    user_res = requests.get(
        "https://slack.com/api/users.identity",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10
    )
    
    if user_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch user info")
    
    user_info = user_res.json()
    if not user_info.get("ok"):
        raise HTTPException(status_code=400, detail="Failed to get Slack user info")
    
    slack_user = user_info.get("user", {})
    team_info = token_json.get("team", {})
    
    # Upsert integration
    integ = db.query(Integration).filter(Integration.owner_id == user_id, Integration.provider == "slack").first()
    if not integ:
        integ = Integration(owner_id=user_id, provider="slack", status="connected", config_json={})
    
    integ.config_json = {
        "access_token": access_token,
        "scope": token_json.get("scope"),
        "bot_user_id": token_json.get("bot_user_id"),
        "team": {
            "id": team_info.get("id"),
            "name": team_info.get("name")
        },
        "user": {
            "id": slack_user.get("id"),
            "name": slack_user.get("name"),
            "email": slack_user.get("email")
        }
    }
    
    db.add(integ)
    db.commit()
    
    return RedirectResponse(url=f"{_FRONTEND_URL}/integrations")


@router.delete("/slack")
def slack_disconnect(db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    integ = db.query(Integration).filter(Integration.owner_id == user.id, Integration.provider == "slack").first()
    if not integ:
        raise HTTPException(status_code=404, detail="Not connected")
    
    # Revoke token with Slack
    try:
        config = integ.config_json or {}
        access_token = config.get("access_token")
        if access_token:
            requests.post(
                "https://slack.com/api/auth.revoke",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=5
            )
    except:
        pass  # Continue even if revocation fails
    
    db.delete(integ)
    db.commit()
    return {"ok": True}


# --- Jira OAuth ---

@router.get("/jira/connect")
def jira_connect(db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    client_id = os.getenv("JIRA_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="JIRA_CLIENT_ID not set")
    state = _sign_state(str(user.id))
    params = {
        "audience": "api.atlassian.com",
        "client_id": client_id,
        "scope": "read:jira-work write:jira-work read:jira-user offline_access",
        "redirect_uri": _JIRA_REDIRECT,
        "state": state,
        "response_type": "code",
        "prompt": "consent"
    }
    url = f"https://auth.atlassian.com/authorize?{urlencode(params)}"
    return {"url": url}


@router.get("/jira/callback")
def jira_callback(code: str | None = None, state: str | None = None, error: str | None = None, db: Session = Depends(get_db)):
    if error:
        raise HTTPException(status_code=400, detail=f"Jira OAuth error: {error}")
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")
    user_id = _verify_state(state)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid state")
    
    client_id = os.getenv("JIRA_CLIENT_ID")
    client_secret = os.getenv("JIRA_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="Jira OAuth not configured")
    
    # Exchange code for token
    token_res = requests.post(
        "https://auth.atlassian.com/oauth/token",
        headers={"Content-Type": "application/json"},
        json={
            "grant_type": "authorization_code",
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": _JIRA_REDIRECT,
        },
        timeout=10,
    )
    
    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Token exchange failed: {token_res.text}")
    
    token_json = token_res.json()
    access_token = token_json.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token returned")
    
    # Get user info and accessible resources
    try:
        # Get user profile
        user_res = requests.get(
            "https://api.atlassian.com/me",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10
        )
        
        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch user info")
        
        user_info = user_res.json()
        
        # Get accessible resources (Jira sites)
        resources_res = requests.get(
            "https://api.atlassian.com/oauth/token/accessible-resources",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10
        )
        
        accessible_resources = []
        if resources_res.status_code == 200:
            accessible_resources = resources_res.json()
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch Jira info: {str(e)}")
    
    # Upsert integration
    integ = db.query(Integration).filter(Integration.owner_id == user_id, Integration.provider == "jira").first()
    if not integ:
        integ = Integration(owner_id=user_id, provider="jira", status="connected", config_json={})
    
    integ.config_json = {
        "access_token": access_token,
        "refresh_token": token_json.get("refresh_token"),
        "expires_in": token_json.get("expires_in"),
        "scope": token_json.get("scope"),
        "user": {
            "account_id": user_info.get("account_id"),
            "name": user_info.get("name"),
            "email": user_info.get("email"),
            "picture": user_info.get("picture")
        },
        "accessible_resources": accessible_resources
    }
    
    db.add(integ)
    db.commit()
    
    return RedirectResponse(url=f"{_FRONTEND_URL}/integrations")


@router.delete("/jira")
def jira_disconnect(db: Session = Depends(get_db), user=Depends(get_current_active_user)):
    integ = db.query(Integration).filter(Integration.owner_id == user.id, Integration.provider == "jira").first()
    if not integ:
        raise HTTPException(status_code=404, detail="Not connected")
    
    # Note: Atlassian doesn't provide a token revocation endpoint
    # The token will expire naturally based on its TTL
    
    db.delete(integ)
    db.commit()
    return {"ok": True}


# --- Integration Requests ---

@router.post("/requests", response_model=IntegrationRequestResponse, status_code=201)
def create_integration_request(
    request_data: IntegrationRequestCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user)
):
    """
    Submit a request for a new integration.
    Users can request integrations they'd like to see added to the platform.
    """
    # Check if user already requested this integration
    existing = db.query(IntegrationRequest).filter(
        IntegrationRequest.user_id == user.id,
        IntegrationRequest.integration_name == request_data.integration_name,
        IntegrationRequest.status.in_(["pending", "reviewing", "approved"])
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"You've already requested '{request_data.integration_name}'. Status: {existing.status}"
        )
    
    # Create new request
    new_request = IntegrationRequest(
        user_id=user.id,
        integration_name=request_data.integration_name,
        description=request_data.description,
        use_case=request_data.use_case,
        priority=request_data.priority,
        status="pending",
        upvotes=1  # Auto-upvote by creator
    )
    
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    
    return new_request


@router.get("/requests", response_model=List[IntegrationRequestResponse])
def list_integration_requests(
    status: Optional[str] = Query(None, pattern="^(pending|reviewing|approved|rejected|implemented)$"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    """
    List all integration requests. Anyone can view requests.
    """
    query = db.query(IntegrationRequest)
    
    if status:
        query = query.filter(IntegrationRequest.status == status)
    
    # Order by upvotes (most popular first), then by creation date
    query = query.order_by(
        IntegrationRequest.upvotes.desc(),
        IntegrationRequest.created_at.desc()
    )
    
    requests = query.limit(limit).all()
    return requests


@router.post("/requests/{request_id}/upvote")
def upvote_integration_request(
    request_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user)
):
    """
    Upvote an integration request to show interest.
    Note: In a production system, you'd track individual upvotes to prevent duplicates.
    """
    request_obj = db.query(IntegrationRequest).filter(
        IntegrationRequest.id == request_id
    ).first()
    
    if not request_obj:
        raise HTTPException(status_code=404, detail="Integration request not found")
    
    # Simple increment (in production, track user upvotes separately)
    request_obj.upvotes += 1
    db.commit()
    db.refresh(request_obj)
    
    return {"ok": True, "upvotes": request_obj.upvotes}


@router.get("/requests/{request_id}", response_model=IntegrationRequestResponse)
def get_integration_request(
    request_id: str,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Get details of a specific integration request.
    """
    request_obj = db.query(IntegrationRequest).filter(
        IntegrationRequest.id == request_id
    ).first()
    
    if not request_obj:
        raise HTTPException(status_code=404, detail="Integration request not found")
    
    return request_obj


@router.delete("/requests/{request_id}")
def delete_integration_request(
    request_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_active_user)
):
    """
    Delete an integration request (only creator can delete their own requests).
    """
    request_obj = db.query(IntegrationRequest).filter(
        IntegrationRequest.id == request_id,
        IntegrationRequest.user_id == user.id
    ).first()
    
    if not request_obj:
        raise HTTPException(
            status_code=404, 
            detail="Integration request not found or you don't have permission to delete it"
        )
    
    db.delete(request_obj)
    db.commit()
    
    return {"ok": True}
