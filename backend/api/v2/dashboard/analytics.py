"""
Analytics endpoints
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Request, Depends, Query, HTTPException

from api.dashboard.auth import get_current_user
from services.supabase_service import SupabaseService

router = APIRouter()


def validate_date(date_string: Optional[str]) -> Optional[str]:
    """Validate date format and return the validated date string"""
    if date_string:
        try:
            # Try to parse ISO format dates, handling both with and without timezone
            datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid date format: {date_string}. Use ISO format (YYYY-MM-DDTHH:MM:SS)")
    return date_string


@router.get("/overview")
async def get_analytics_overview(
    request: Request,
    startDate: Optional[str] = Query(None, description="ISO format date (YYYY-MM-DDTHH:MM:SS)"),
    endDate: Optional[str] = Query(None, description="ISO format date (YYYY-MM-DDTHH:MM:SS)"),
    current_user: dict = Depends(get_current_user)
):
    """Get analytics overview for date range"""
    # Validate date parameters
    startDate = validate_date(startDate)
    endDate = validate_date(endDate)
    
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        return {
            "stats": {
                "totalCalls": 0,
                "answeredCalls": 0,
                "missedCalls": 0,
                "avgCallDuration": 0,
                "totalSMS": 0,
                "bookingsToday": 0,
                "callsToday": 0,
                "smsToday": 0
            },
            "charts": {
                "callVolume": [],
                "callOutcomes": {
                    "answered": 0,
                    "missed": 0,
                    "voicemail": 0
                },
                "peakHours": [],
                "topServices": []
            }
        }
    
    # Default date range (last 30 days)
    if not endDate:
        endDate = datetime.now(timezone.utc).isoformat()
    if not startDate:
        startDate = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    
    # Get analytics data
    stats = await supabase.get_analytics_overview(profile["id"], startDate, endDate)
    
    # Mock chart data for now
    # TODO: Implement actual chart data aggregation
    charts = {
        "callVolume": [
            {"date": "2024-01-01", "calls": 45},
            {"date": "2024-01-02", "calls": 52},
            {"date": "2024-01-03", "calls": 38},
            {"date": "2024-01-04", "calls": 65},
            {"date": "2024-01-05", "calls": 48}
        ],
        "callOutcomes": {
            "answered": stats.get("answeredCalls", 0),
            "missed": stats.get("missedCalls", 0),
            "voicemail": 0
        },
        "peakHours": [
            {"hour": 9, "calls": 25},
            {"hour": 10, "calls": 35},
            {"hour": 11, "calls": 40},
            {"hour": 14, "calls": 38},
            {"hour": 15, "calls": 42}
        ],
        "topServices": [
            {"service": "Haircut", "bookings": 45},
            {"service": "Color", "bookings": 32},
            {"service": "Styling", "bookings": 28}
        ]
    }
    
    return {
        "stats": stats,
        "charts": charts
    }