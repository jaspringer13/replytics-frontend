"""
Analytics endpoints - redirects to domain controller

This module now serves as a bridge to the domain-driven analytics implementation.
All business logic has been moved to the analytics domain.
"""

from domains.analytics.controllers import router as analytics_router

# Re-export the domain router to maintain API compatibility
router = analytics_router