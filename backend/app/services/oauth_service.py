"""OAuth service for managing third-party integrations."""

import secrets
import hashlib
import hmac
import base64
import json
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from urllib.parse import urlencode, parse_qs
import requests
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.oauth import OAuthToken, OAuthState, WebhookSignature
from app.models.user import User
from app.core.security import encrypt_data, decrypt_data


class OAuthService:
    """Service for managing OAuth flows and token operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_oauth_url(
        self, 
        provider: str, 
        user_id: str, 
        scopes: Optional[list] = None,
        redirect_uri: Optional[str] = None
    ) -> Tuple[str, str]:
        """
        Generate OAuth authorization URL with state parameter for CSRF protection.
        
        Returns:
            Tuple of (auth_url, state)
        """
        if not settings.OAUTH_ENABLED:
            raise ValueError("OAuth is disabled")
        
        # Generate secure state parameter
        state = secrets.token_urlsafe(32)
        
        # Store state in database
        oauth_state = OAuthState(
            state=state,
            provider=provider,
            user_id=user_id,
            redirect_uri=redirect_uri,
            scopes=scopes,
            expires_at=datetime.utcnow() + timedelta(minutes=10)  # 10 minute expiry
        )
        self.db.add(oauth_state)
        self.db.commit()
        
        # Build authorization URL based on provider
        if provider == "slack":
            client_id = settings.SLACK_CLIENT_ID
            redirect_uri = redirect_uri or settings.SLACK_REDIRECT_URI
            base_url = "https://slack.com/oauth/v2/authorize"
            default_scopes = ["channels:read", "chat:write", "users:read"]
        elif provider == "jira":
            client_id = settings.JIRA_CLIENT_ID
            redirect_uri = redirect_uri or settings.JIRA_REDIRECT_URI
            base_url = "https://auth.atlassian.com/authorize"
            default_scopes = ["read:jira-work", "write:jira-work"]
        elif provider == "trello":
            client_id = settings.TRELLO_CLIENT_ID
            redirect_uri = redirect_uri or settings.TRELLO_REDIRECT_URI
            base_url = "https://trello.com/1/authorize"
            default_scopes = ["read", "write"]
        else:
            raise ValueError(f"Unsupported OAuth provider: {provider}")
        
        if not client_id:
            raise ValueError(f"OAuth client ID not configured for {provider}")
        
        # Use provided scopes or defaults
        scope_list = scopes or default_scopes
        
        # Build query parameters
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "state": state,
            "response_type": "code"
        }
        
        if provider != "trello":  # Trello uses different scope format
            params["scope"] = " ".join(scope_list)
        else:
            params["scope"] = ",".join(scope_list)
        
        # Additional provider-specific parameters
        if provider == "jira":
            params["audience"] = "api.atlassian.com"
            params["prompt"] = "consent"
        
        auth_url = f"{base_url}?{urlencode(params)}"
        return auth_url, state
    
    def handle_oauth_callback(
        self, 
        provider: str, 
        code: str, 
        state: str,
        error: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Handle OAuth callback and exchange code for tokens.
        
        Returns:
            Dict with success status and token info or error details
        """
        if error:
            return {"success": False, "error": f"OAuth error: {error}"}
        
        # Verify state parameter
        oauth_state = self.db.query(OAuthState).filter(
            OAuthState.state == state,
            OAuthState.provider == provider,
            OAuthState.used == False,
            OAuthState.expires_at > datetime.utcnow()
        ).first()
        
        if not oauth_state:
            return {"success": False, "error": "Invalid or expired state parameter"}
        
        # Mark state as used
        oauth_state.used = True
        self.db.commit()
        
        try:
            # Exchange code for tokens
            token_data = self._exchange_code_for_tokens(provider, code, oauth_state.redirect_uri)
            
            if not token_data.get("access_token"):
                return {"success": False, "error": "Failed to obtain access token"}
            
            # Get user info from provider
            user_info = self._get_user_info(provider, token_data["access_token"])
            
            # Store or update OAuth token
            existing_token = self.db.query(OAuthToken).filter(
                OAuthToken.user_id == oauth_state.user_id,
                OAuthToken.provider == provider
            ).first()
            
            if existing_token:
                # Update existing token
                existing_token.access_token = encrypt_data(token_data["access_token"])
                existing_token.refresh_token = encrypt_data(token_data.get("refresh_token")) if token_data.get("refresh_token") else None
                existing_token.expires_at = self._calculate_expiry(token_data.get("expires_in"))
                existing_token.scopes = token_data.get("scope", "").split() if token_data.get("scope") else oauth_state.scopes
                existing_token.provider_user_id = user_info.get("id")
                existing_token.provider_username = user_info.get("username") or user_info.get("name")
                existing_token.provider_email = user_info.get("email")
                existing_token.metadata = user_info
                existing_token.is_active = True
                existing_token.updated_at = datetime.utcnow()
                token_record = existing_token
            else:
                # Create new token record
                token_record = OAuthToken(
                    user_id=oauth_state.user_id,
                    provider=provider,
                    access_token=encrypt_data(token_data["access_token"]),
                    refresh_token=encrypt_data(token_data.get("refresh_token")) if token_data.get("refresh_token") else None,
                    expires_at=self._calculate_expiry(token_data.get("expires_in")),
                    scopes=token_data.get("scope", "").split() if token_data.get("scope") else oauth_state.scopes,
                    provider_user_id=user_info.get("id"),
                    provider_username=user_info.get("username") or user_info.get("name"),
                    provider_email=user_info.get("email"),
                    metadata=user_info
                )
                self.db.add(token_record)
            
            self.db.commit()
            
            return {
                "success": True,
                "provider": provider,
                "user_info": {
                    "id": user_info.get("id"),
                    "username": user_info.get("username") or user_info.get("name"),
                    "email": user_info.get("email")
                }
            }
            
        except Exception as e:
            self.db.rollback()
            return {"success": False, "error": f"OAuth callback error: {str(e)}"}
    
    def disconnect_provider(self, user_id: str, provider: str) -> bool:
        """Disconnect a user's OAuth integration."""
        token = self.db.query(OAuthToken).filter(
            OAuthToken.user_id == user_id,
            OAuthToken.provider == provider
        ).first()
        
        if token:
            token.is_active = False
            token.updated_at = datetime.utcnow()
            self.db.commit()
            return True
        
        return False
    
    def get_user_tokens(self, user_id: str) -> Dict[str, Dict[str, Any]]:
        """Get all active OAuth tokens for a user."""
        tokens = self.db.query(OAuthToken).filter(
            OAuthToken.user_id == user_id,
            OAuthToken.is_active == True
        ).all()
        
        result = {}
        for token in tokens:
            result[token.provider] = {
                "provider_username": token.provider_username,
                "provider_email": token.provider_email,
                "scopes": token.scopes,
                "connected_at": token.created_at.isoformat(),
                "last_used": token.last_used_at.isoformat() if token.last_used_at else None,
                "expires_at": token.expires_at.isoformat() if token.expires_at else None
            }
        
        return result
    
    def get_access_token(self, user_id: str, provider: str) -> Optional[str]:
        """Get decrypted access token for API calls."""
        token = self.db.query(OAuthToken).filter(
            OAuthToken.user_id == user_id,
            OAuthToken.provider == provider,
            OAuthToken.is_active == True
        ).first()
        
        if not token:
            return None
        
        # Check if token is expired
        if token.expires_at and token.expires_at < datetime.utcnow():
            # Try to refresh token
            if token.refresh_token:
                refreshed = self._refresh_token(token)
                if not refreshed:
                    return None
            else:
                return None
        
        # Update last used timestamp
        token.last_used_at = datetime.utcnow()
        self.db.commit()
        
        return decrypt_data(token.access_token)
    
    def _exchange_code_for_tokens(self, provider: str, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for access tokens."""
        if provider == "slack":
            url = "https://slack.com/api/oauth.v2.access"
            data = {
                "client_id": settings.SLACK_CLIENT_ID,
                "client_secret": settings.SLACK_CLIENT_SECRET,
                "code": code,
                "redirect_uri": redirect_uri
            }
        elif provider == "jira":
            url = "https://auth.atlassian.com/oauth/token"
            data = {
                "grant_type": "authorization_code",
                "client_id": settings.JIRA_CLIENT_ID,
                "client_secret": settings.JIRA_CLIENT_SECRET,
                "code": code,
                "redirect_uri": redirect_uri
            }
        elif provider == "trello":
            url = "https://trello.com/1/OAuthGetAccessToken"
            data = {
                "key": settings.TRELLO_CLIENT_ID,
                "secret": settings.TRELLO_CLIENT_SECRET,
                "token": code
            }
        else:
            raise ValueError(f"Unsupported provider: {provider}")
        
        response = requests.post(url, data=data)
        response.raise_for_status()
        
        if provider == "trello":
            # Trello returns URL-encoded response
            return dict(parse_qs(response.text))
        else:
            return response.json()
    
    def _get_user_info(self, provider: str, access_token: str) -> Dict[str, Any]:
        """Get user information from OAuth provider."""
        headers = {"Authorization": f"Bearer {access_token}"}
        
        if provider == "slack":
            response = requests.get("https://slack.com/api/users.identity", headers=headers)
        elif provider == "jira":
            response = requests.get("https://api.atlassian.com/me", headers=headers)
        elif provider == "trello":
            response = requests.get(f"https://api.trello.com/1/members/me?token={access_token}")
        else:
            raise ValueError(f"Unsupported provider: {provider}")
        
        response.raise_for_status()
        return response.json()
    
    def _calculate_expiry(self, expires_in: Optional[int]) -> Optional[datetime]:
        """Calculate token expiry datetime."""
        if expires_in:
            return datetime.utcnow() + timedelta(seconds=int(expires_in))
        return None
    
    def _refresh_token(self, token: OAuthToken) -> bool:
        """Refresh an expired OAuth token."""
        if not token.refresh_token:
            return False
        
        try:
            refresh_token = decrypt_data(token.refresh_token)
            
            if token.provider == "slack":
                url = "https://slack.com/api/oauth.v2.access"
                data = {
                    "client_id": settings.SLACK_CLIENT_ID,
                    "client_secret": settings.SLACK_CLIENT_SECRET,
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token
                }
            elif token.provider == "jira":
                url = "https://auth.atlassian.com/oauth/token"
                data = {
                    "grant_type": "refresh_token",
                    "client_id": settings.JIRA_CLIENT_ID,
                    "client_secret": settings.JIRA_CLIENT_SECRET,
                    "refresh_token": refresh_token
                }
            else:
                return False  # Provider doesn't support refresh tokens
            
            response = requests.post(url, data=data)
            response.raise_for_status()
            token_data = response.json()
            
            # Update token record
            token.access_token = encrypt_data(token_data["access_token"])
            if token_data.get("refresh_token"):
                token.refresh_token = encrypt_data(token_data["refresh_token"])
            token.expires_at = self._calculate_expiry(token_data.get("expires_in"))
            token.updated_at = datetime.utcnow()
            
            self.db.commit()
            return True
            
        except Exception as e:
            # Mark token as inactive if refresh fails
            token.is_active = False
            self.db.commit()
            return False
