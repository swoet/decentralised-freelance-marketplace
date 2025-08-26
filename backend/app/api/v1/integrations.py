from __future__ import annotations
import hmac
import hashlib
import base64
import time
import os
import requests
from urllib.parse import urlencode
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user, get_db
from app.models.integration import Integration, Webhook
from app.core.config import settings

router = APIRouter(prefix="/integrations", tags=["integrations"]) 


@router.get("")
def list_integrations(db: Session = Depends(get_db), user=Depends(get_current_active_user)):
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

# --- GitHub OAuth ---

_DEF_REDIRECT = os.getenv("GITHUB_REDIRECT_URI", f"http://localhost:8000{settings.API_V1_STR}/integrations/github/callback")
_FRONTEND_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")


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
        "redirect_uri": _DEF_REDIRECT,
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
            "redirect_uri": _DEF_REDIRECT,
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
