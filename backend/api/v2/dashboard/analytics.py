"""
Analytics endpoints
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Request, Depends, Query, HTTPException
import logging

from api.dashboard.auth import get_current_user
from services.supabase_service import SupabaseService

router = APIRouter()
logger = logging.getLogger(__name__)


def validate_date(date_string: Optional[str]) -> Optional[str]:
    """Validate date format and return the validated date string"""
    if date_string:
        try:
            # Try to parse ISO format dates, handling both with and without timezone
            parsed_date = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
            # Return normalized ISO format with timezone
            return parsed_date.isoformat()
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid date format: {date_string}. Use ISO format (YYYY-MM-DDTHH:MM:SS)") from e
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
    
    # Get actual chart data
    call_volume_data = get_call_volume_data(supabase, profile["id"], startDate, endDate)
    call_outcomes_data = get_call_outcomes_data(supabase, profile["id"], startDate, endDate)
    peak_hours_data = get_peak_hours_data(supabase, profile["id"], startDate, endDate)
    top_services_data = get_top_services_data(supabase, profile["id"], startDate, endDate)
    
    charts = {
        "callVolume": call_volume_data,
        "callOutcomes": call_outcomes_data,
        "peakHours": peak_hours_data,
        "topServices": top_services_data
    }
    
    return {
        "stats": stats,
        "charts": charts
    }


def get_call_volume_data(supabase: SupabaseService, business_id: str, start_date: str, end_date: str) -> list:
    """Get daily call volume data for the date range"""
    try:
        # Parse dates to work with them
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        # Fetch calls data from the database
        result = supabase.client.table('calls').select('created_at, status').eq('business_id', business_id).gte('created_at', start_date).lte('created_at', end_date).execute()
        
        if not result.data:
            return []
        
        # Group calls by date
        daily_counts = {}
        current_date = start.date()
        end_date_obj = end.date()
        
        # Initialize all dates in range with 0
        while current_date <= end_date_obj:
            daily_counts[current_date.isoformat()] = 0
            current_date += timedelta(days=1)
        
        # Count actual calls per day
        for call in result.data:
            call_date = datetime.fromisoformat(call['created_at'].replace('Z', '+00:00')).date()
            date_key = call_date.isoformat()
            if date_key in daily_counts:
                daily_counts[date_key] += 1
        
        # Convert to chart format
        return [{"date": date, "calls": count} for date, count in sorted(daily_counts.items())]
        
    except Exception as e:
        logger.error(f"Failed to get call volume data: {e}")
        return []


def get_call_outcomes_data(supabase: SupabaseService, business_id: str, start_date: str, end_date: str) -> dict:
    """Get call outcomes distribution"""
    try:
        # Fetch calls with status information
        result = supabase.client.table('calls').select('status, outcome').eq('business_id', business_id).gte('created_at', start_date).lte('created_at', end_date).execute()
        
        outcomes = {"answered": 0, "missed": 0, "voicemail": 0}
        
        if result.data:
            for call in result.data:
                status = call.get('status', '').lower()
                outcome = call.get('outcome', '').lower()
                
                if status == 'completed' or outcome == 'answered':
                    outcomes["answered"] += 1
                elif status == 'missed' or outcome == 'missed':
                    outcomes["missed"] += 1
                elif outcome == 'voicemail':
                    outcomes["voicemail"] += 1
                else:
                    # Default missed for incomplete calls
                    outcomes["missed"] += 1
        
        return outcomes
        
    except Exception as e:
        logger.error(f"Failed to get call outcomes data: {e}")
        return {"answered": 0, "missed": 0, "voicemail": 0}


def get_peak_hours_data(supabase: SupabaseService, business_id: str, start_date: str, end_date: str) -> list:
    """Get peak hours data showing call distribution by hour of day"""
    try:
        # Fetch calls data
        result = supabase.client.table('calls').select('created_at').eq('business_id', business_id).gte('created_at', start_date).lte('created_at', end_date).execute()
        
        if not result.data:
            return []
        
        # Count calls by hour (0-23)
        hourly_counts = {hour: 0 for hour in range(24)}
        
        for call in result.data:
            call_time = datetime.fromisoformat(call['created_at'].replace('Z', '+00:00'))
            hour = call_time.hour
            hourly_counts[hour] += 1
        
        # Convert to chart format, only include hours with calls or business hours (7-20)
        peak_hours = []
        for hour in range(24):
            count = hourly_counts[hour]
            if count > 0 or (7 <= hour <= 20):  # Show business hours even if no calls
                peak_hours.append({"hour": hour, "calls": count})
        
        return peak_hours
        
    except Exception as e:
        logger.error(f"Failed to get peak hours data: {e}")
        return []


def get_top_services_data(supabase: SupabaseService, business_id: str, start_date: str, end_date: str) -> list:
    """Get top services by booking count"""
    try:
        # First get services for this business
        services_result = supabase.client.table('services').select('id, name').eq('business_id', business_id).eq('is_active', True).execute()
        
        if not services_result.data:
            return []
        
        # Get appointments/bookings for these services
        appointments_result = supabase.client.table('appointments').select('service_id').eq('business_id', business_id).gte('created_at', start_date).lte('created_at', end_date).neq('status', 'cancelled').execute()
        
        if not appointments_result.data:
            return []
        
        # Count bookings per service
        service_counts = {}
        services_map = {service['id']: service['name'] for service in services_result.data}
        
        for appointment in appointments_result.data:
            service_id = appointment.get('service_id')
            if service_id and service_id in services_map:
                service_name = services_map[service_id]
                service_counts[service_name] = service_counts.get(service_name, 0) + 1
        
        # Convert to chart format and sort by bookings (top services first)
        top_services = [{"service": name, "bookings": count} for name, count in service_counts.items()]
        return sorted(top_services, key=lambda x: x["bookings"], reverse=True)[:10]  # Top 10
        
    except Exception as e:
        logger.error(f"Failed to get top services data: {e}")
        return []