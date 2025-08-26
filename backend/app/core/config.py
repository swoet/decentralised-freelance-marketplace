from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic.networks import AnyHttpUrl
from pydantic import field_validator
import urllib.parse


class Settings(BaseSettings):
    # Application Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Decentralized Freelance Marketplace"
    
    # CORS
    BACKEND_CORS_ORIGINS: Union[List[AnyHttpUrl], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            # Handle comma-separated string format
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Database
    DATABASE_URL: str
    
    @property
    def DATABASE_URL_FIXED(self) -> str:
        """Fix database URL if it contains special characters in password"""
        url = self.DATABASE_URL
        if '@' in url and url.count('@') > 1:
            # Handle the case where password contains @ symbol
            # Format: postgresql://username:password@host/database
            # But password contains @, so we have: postgresql://username:password@part@host/database
            
            # Find the last @ symbol which should be the host separator
            last_at_index = url.rfind('@')
            if last_at_index > 0:
                # Everything before the last @ is credentials
                credentials_part = url[:last_at_index].replace('postgresql://', '')
                # Everything after the last @ is host/database
                host_part = url[last_at_index + 1:]
                
                if ':' in credentials_part:
                    username, password = credentials_part.split(':', 1)
                    # URL encode the password
                    encoded_password = urllib.parse.quote_plus(password)
                    return f"postgresql://{username}:{encoded_password}@{host_part}"
        
        return self.DATABASE_URL
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_HOST: str = "redis://localhost:6379"
    
    # Web3
    WEB3_PROVIDER_URI: str = "http://localhost:8545"
    ESCROW_FACTORY_ADDRESS: str = ""
    ESCROW_FACTORY_ABI: str = ""
    
    # Email
    SMTP_TLS: bool = True
    SMTP_PORT: int = 587
    SMTP_HOST: str = ""
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = ""
    EMAILS_FROM_NAME: str = ""
    
    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    
    # Background Worker Configuration
    WORKER_ENABLED: bool = True
    WORKER_REDIS_URL: str = "redis://localhost:6379/1"
    WORKER_CONCURRENCY: int = 2
    WORKER_RETRY_ATTEMPTS: int = 3
    WORKER_RETRY_DELAY: int = 60
    JOB_TIMEOUT: int = 300
    ESCROW_AUTO_PERSIST: bool = True
    ESCROW_PAGINATION_SIZE: int = 20
    
    # OAuth Configuration
    OAUTH_ENABLED: bool = True
    SLACK_CLIENT_ID: str = ""
    SLACK_CLIENT_SECRET: str = ""
    SLACK_REDIRECT_URI: str = "http://localhost:3000/oauth/slack/callback"
    JIRA_CLIENT_ID: str = ""
    JIRA_CLIENT_SECRET: str = ""
    JIRA_REDIRECT_URI: str = "http://localhost:3000/oauth/jira/callback"
    TRELLO_CLIENT_ID: str = ""
    TRELLO_CLIENT_SECRET: str = ""
    TRELLO_REDIRECT_URI: str = "http://localhost:3000/oauth/trello/callback"
    WEBHOOK_SECRET_KEY: str = "your-webhook-signing-key"
    
    # Session Management Configuration
    SESSION_DEVICE_TRACKING: bool = True
    REFRESH_TOKEN_ENABLED: bool = True
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    SESSION_CLEANUP_ENABLED: bool = True
    MAX_SESSIONS_PER_USER: int = 10
    
    # AI/ML Configuration
    AI_MATCHING_ENABLED: bool = True
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    SKILLS_VERIFICATION_ENABLED: bool = True
    REPUTATION_V2_ENABLED: bool = True
    MATCHING_CACHE_TTL: int = 3600

    class Config:
        env_file = ".env"


settings = Settings() 