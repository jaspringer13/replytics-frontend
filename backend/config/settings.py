"""
Application settings and configuration
"""

from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "Replytics Dashboard API"
    DEBUG: bool = False
    PORT: int = 8000
    
    # Security
    SECRET_KEY: str = Field(..., description="Secret key for JWT tokens - must be set via environment variable")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://replytics-frontend.vercel.app"
    ]
    
    # Database
    SUPABASE_URL: str = Field(..., description="Supabase project URL")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(..., description="Supabase service role key")
    
    # Voice Bot Integration
    VOICE_BOT_URL: str = "https://replytics-dhhf.onrender.com"
    VOICE_BOT_JWT_SECRET: str = Field(..., description="JWT secret for voice bot integration")
    VOICE_BOT_JWT_ALGORITHM: str = "HS256"
    VOICE_BOT_JWT_EXPIRE_MINUTES: int = 30
    VOICE_BOT_INTERNAL_TOKEN: str = Field(..., description="Internal token for voice bot authentication")
    VOICE_BOT_TIMEOUT: int = 30
    VOICE_BOT_MAX_RETRIES: int = 3
    VOICE_BOT_CACHE_TTL: int = 300  # 5 minutes
    VOICE_BOT_WEBHOOK_SECRET: Optional[str] = None  # Secret for webhook signature verification
    
    # Deprecated - keeping for backward compatibility
    VOICE_BOT_API_KEY: Optional[str] = None
    
    # Redis (for caching)
    REDIS_URL: Optional[str] = None
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = Field(..., description="Google OAuth client ID")
    GOOGLE_CLIENT_SECRET: str = Field(..., description="Google OAuth client secret")
    
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