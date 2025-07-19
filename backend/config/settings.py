"""
Application settings and configuration
"""

from typing import List, Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "Replytics Dashboard API"
    DEBUG: bool = False
    PORT: int = 8000
    
    # Security
    SECRET_KEY: str = "CHANGE-THIS-IN-PRODUCTION-565036f21c4432f389b3fdfddd47d4d1"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://replytics-frontend.vercel.app"
    ]
    
    # Database
    SUPABASE_URL: str = "https://placeholder.supabase.co"
    SUPABASE_SERVICE_ROLE_KEY: str = "placeholder-key"
    
    # External Services
    VOICE_BOT_URL: str = "https://replytics-dhhf.onrender.com"
    VOICE_BOT_API_KEY: Optional[str] = None
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = "placeholder-google-client-id"
    GOOGLE_CLIENT_SECRET: str = "placeholder-google-client-secret"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Monitoring
    ENABLE_METRICS: bool = True
    ENABLE_TRACING: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()