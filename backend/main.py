"""
Replytics Dashboard API Backend
Production-ready FastAPI application for managing AI voice receptionist
"""

import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from dotenv import load_dotenv

# Add backend to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Import routers
from api.dashboard.auth import router as auth_router
from api.v2.dashboard.business import router as business_router
from api.v2.dashboard.customers import router as customers_router
from api.v2.dashboard.analytics import router as analytics_router
from api.v2.dashboard.services import router as services_router
from api.v2.dashboard.hours import router as hours_router
from api.v2.dashboard.voice_bot_proxy import router as voice_bot_proxy_router
from api.dashboard.calls import router as calls_router
from api.dashboard.sms import router as sms_router
from api.dashboard.billing import router as billing_router
from api.v1.webhooks import router as webhooks_router

# Import middleware
from middleware.auth import AuthMiddleware
from middleware.logging import LoggingMiddleware
from middleware.rate_limit import RateLimitMiddleware

# Import services
from services.supabase_service import SupabaseService
from config.settings import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    print("Starting Replytics Dashboard API...")
    
    # Initialize Supabase connection
    supabase_service = SupabaseService()
    await supabase_service.initialize()
    
    # Add to app state
    app.state.supabase = supabase_service
    
    yield
    
    # Shutdown
    print("Shutting down Replytics Dashboard API...")
    await supabase_service.close()


# Create FastAPI app
app = FastAPI(
    title="Replytics Dashboard API",
    description="Backend API for Replytics AI Voice Receptionist Dashboard",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    redirect_slashes=True  # This ensures both /path and /path/ work
)

# Register error handlers
from shared.errors import register_error_handlers
register_error_handlers(app)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware
app.add_middleware(RateLimitMiddleware)  # Execute after auth
app.add_middleware(AuthMiddleware)       # Execute after logging
app.add_middleware(LoggingMiddleware)    # Execute first (after CORS)

# Include routers
app.include_router(auth_router, prefix="/api/dashboard/auth", tags=["Authentication"])
app.include_router(business_router, prefix="/api/v2/dashboard/business", tags=["Business"])
app.include_router(customers_router, prefix="/api/v2/dashboard/customers", tags=["Customers"])
app.include_router(analytics_router, prefix="/api/v2/dashboard/analytics", tags=["Analytics"])
app.include_router(services_router, prefix="/api/v2/dashboard/services", tags=["Services"])
app.include_router(hours_router, prefix="/api/v2/dashboard/hours", tags=["Hours"])
app.include_router(voice_bot_proxy_router, prefix="/api/v2/dashboard/voice-bot", tags=["Voice Bot"])
app.include_router(calls_router, prefix="/api/dashboard/calls", tags=["Calls"])
app.include_router(sms_router, prefix="/api/dashboard/sms", tags=["SMS"])
app.include_router(billing_router, prefix="/api/dashboard/billing", tags=["Billing"])
app.include_router(webhooks_router, prefix="/api/v1/webhooks", tags=["Webhooks"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Replytics Dashboard API",
        "version": "1.0.0",
        "status": "healthy",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check(request: Request):
    """Health check endpoint"""
    try:
        # Check Supabase connection
        supabase_healthy = await request.app.state.supabase.health_check()
        
        return {
            "status": "healthy" if supabase_healthy else "degraded",
            "services": {
                "api": "healthy",
                "supabase": "healthy" if supabase_healthy else "unhealthy"
            }
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "error": str(e)}
        )


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if settings.DEBUG else "An error occurred"
        }
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=settings.DEBUG
    )