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

    class Config:
        env_file = ".env"


settings = Settings() 