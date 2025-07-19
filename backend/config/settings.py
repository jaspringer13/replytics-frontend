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
    
    # Voice Bot Integration
    VOICE_BOT_URL: str = "https://replytics-dhhf.onrender.com"
    VOICE_BOT_JWT_SECRET: str = "b26a442d04ee6198e74663f97bd5e9e64aa82a518d918974da2107678df1d694"
    VOICE_BOT_JWT_ALGORITHM: str = "HS256"
    VOICE_BOT_JWT_EXPIRE_MINUTES: int = 30
    VOICE_BOT_INTERNAL_TOKEN: str = "9cdd5b1bd1d15577cd12611617fe31abcbdf64e652cb4ce9d79a3f8a9c5885ce"
    VOICE_BOT_TIMEOUT: int = 30
    VOICE_BOT_MAX_RETRIES: int = 3
    VOICE_BOT_CACHE_TTL: int = 300  # 5 minutes
    VOICE_BOT_WEBHOOK_SECRET: Optional[str] = None  # Secret for webhook signature verification
    
    # Deprecated - keeping for backward compatibility
    VOICE_BOT_API_KEY: Optional[str] = None
    
    # Redis (for caching)
    REDIS_URL: Optional[str] = None
    
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