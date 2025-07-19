"""
Dashboard API Package
Handles all dashboard-related API endpoints
"""

from fastapi import APIRouter

# Import all routers
from .analytics import router as analytics_router
from .customers import router as customers_router
from .overview import router as overview_router
from .conversations import router as conversations_router
from .appointments import router as appointments_router

# Create main dashboard router
dashboard_router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# Include sub-routers
dashboard_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
dashboard_router.include_router(customers_router, prefix="/customers", tags=["customers"])
dashboard_router.include_router(overview_router, prefix="/overview", tags=["overview"])
dashboard_router.include_router(conversations_router, prefix="/conversations", tags=["conversations"])
dashboard_router.include_router(appointments_router, prefix="/appointments", tags=["appointments"])

__all__ = ["dashboard_router"]