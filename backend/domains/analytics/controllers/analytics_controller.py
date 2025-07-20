"""
Analytics HTTP controller.

This module handles HTTP requests and responses for analytics endpoints,
delegating all business logic to the analytics service.
"""

from typing import Optional
from fastapi import APIRouter, Request, Depends, Query, HTTPException
import logging

from api.dashboard.auth import get_current_user
from ..services.analytics_service import AnalyticsService
from ..repositories.supabase_repository import SupabaseAnalyticsRepository
from ..schemas import (
    AnalyticsOverviewResponse,
    ErrorResponse
)
from shared.errors import DomainError, ErrorContext


router = APIRouter(tags=["analytics"])
logger = logging.getLogger(__name__)


def get_analytics_service(request: Request) -> AnalyticsService:
    """Dependency to get analytics service instance."""
    supabase_client = request.app.state.supabase.client
    repository = SupabaseAnalyticsRepository(supabase_client)
    return AnalyticsService(repository)


@router.get(
    "/overview",
    response_model=AnalyticsOverviewResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request"},
        403: {"model": ErrorResponse, "description": "Forbidden"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
async def get_analytics_overview(
    request: Request,
    startDate: Optional[str] = Query(
        None,
        description="Start date in ISO format (YYYY-MM-DDTHH:MM:SS)"
    ),
    endDate: Optional[str] = Query(
        None,
        description="End date in ISO format (YYYY-MM-DDTHH:MM:SS)"
    ),
    current_user: dict = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Get analytics overview for a business.
    
    Returns comprehensive analytics data including statistics and charts
    for the specified date range. If no date range is provided, defaults
    to the last 30 days.
    
    **Date Range Limits:**
    - Maximum range: 365 days
    - Start date must be before end date
    - Dates should be in ISO format with timezone
    
    **Response includes:**
    - Overall statistics (calls, SMS, bookings)
    - Call volume trend chart
    - Call outcomes distribution
    - Peak hours analysis
    - Top services by bookings
    """
    # Get business profile
    supabase = request.app.state.supabase
    profile = await supabase.get_business_profile(current_user["id"])
    
    if not profile:
        # Return empty analytics for users without business profile
        return AnalyticsOverviewResponse(
            stats={
                "totalCalls": 0,
                "answeredCalls": 0,
                "missedCalls": 0,
                "avgCallDuration": 0,
                "totalSMS": 0,
                "bookingsToday": 0,
                "callsToday": 0,
                "smsToday": 0
            },
            charts={
                "callVolume": [],
                "callOutcomes": {
                    "answered": 0,
                    "missed": 0,
                    "voicemail": 0
                },
                "peakHours": [],
                "topServices": []
            }
        )
    
    try:
        # Validate dates if provided
        start_datetime, end_datetime = await service.validate_date_range(
            startDate,
            endDate
        )
        
        # Get analytics overview
        overview = await service.get_analytics_overview(
            business_id=profile["id"],
            start_date=start_datetime,
            end_date=end_datetime
        )
        
        # Convert to response model
        return AnalyticsOverviewResponse.from_entity(overview)
        
    except DomainError:
        # Domain errors are already properly formatted
        raise
    except Exception as e:
        # Log unexpected errors
        logger.error(f"Unexpected error in analytics overview: {e}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred"
        )