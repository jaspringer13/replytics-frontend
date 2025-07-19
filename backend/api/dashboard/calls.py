"""
Call history and management endpoints
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Request, Depends, Query, HTTPException

from api.dashboard.auth import get_current_user
from services.supabase_service import SupabaseService

router = APIRouter()


@router.get("/")
async def get_calls(
    request: Request,
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    current_user: dict = Depends(get_current_user)  # noqa: B008
):
    """Get call history with filtering"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        return {"calls": [], "total": 0}
    
    # Build query
    query = supabase.client.table('calls').select('*', count='exact').eq('business_id', profile["id"])
    
    # Apply filters
    if startDate:
        query = query.gte('created_at', startDate)
    if endDate:
        query = query.lte('created_at', endDate)
    if status:
        query = query.eq('status', status)
    
    # Apply pagination
    query = query.order('created_at', desc=True).range(offset, offset + limit - 1)
    
    result = query.execute()
    
    return {
        "calls": result.data or [],
        "total": result.count or 0
    }


@router.get("/recordings/{call_id}")
async def get_call_recording(
    request: Request,
    call_id: str,
    current_user: dict = Depends(get_current_user)  # noqa: B008
):
    """Get recording URL for a call"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    
    # Get call details
    result = supabase.client.table('calls')\
        .select('recording_url')\
        .eq('id', call_id)\
        .eq('business_id', profile["id"])\
        .single()\
        .execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Call not found")
    
    recording_url = result.data.get('recording_url')
    if not recording_url:
        raise HTTPException(status_code=404, detail="No recording available for this call")
    
    return {"url": recording_url}


@router.get("/stats")
async def get_call_stats(
    request: Request,
    current_user: dict = Depends(get_current_user)  # noqa: B008
):
    """Get call statistics for current period"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        return {
            "todayTotal": 0,
            "todayAnswered": 0,
            "todayMissed": 0,
            "weekTotal": 0,
            "weekAnswered": 0,
            "weekMissed": 0
        }
    
    # Calculate date ranges
    today = datetime.now().date()
    week_ago = today - timedelta(days=7)
    
    # Use database aggregation for better performance
    # Get today's total calls
    today_total = supabase.client.table('calls')\
        .select('*', count='exact')\
        .eq('business_id', profile["id"])\
        .gte('created_at', today.isoformat())\
        .execute()
    
    # Get today's answered calls
    today_answered = supabase.client.table('calls')\
        .select('*', count='exact')\
        .eq('business_id', profile["id"])\
        .eq('status', 'completed')\
        .gte('created_at', today.isoformat())\
        .execute()
    
    # Get today's missed calls
    today_missed = supabase.client.table('calls')\
        .select('*', count='exact')\
        .eq('business_id', profile["id"])\
        .eq('status', 'missed')\
        .gte('created_at', today.isoformat())\
        .execute()
    
    # Get week's total calls
    week_total = supabase.client.table('calls')\
        .select('*', count='exact')\
        .eq('business_id', profile["id"])\
        .gte('created_at', week_ago.isoformat())\
        .execute()
    
    # Get week's answered calls
    week_answered = supabase.client.table('calls')\
        .select('*', count='exact')\
        .eq('business_id', profile["id"])\
        .eq('status', 'completed')\
        .gte('created_at', week_ago.isoformat())\
        .execute()
    
    # Get week's missed calls
    week_missed = supabase.client.table('calls')\
        .select('*', count='exact')\
        .eq('business_id', profile["id"])\
        .eq('status', 'missed')\
        .gte('created_at', week_ago.isoformat())\
        .execute()
    
    return {
        "todayTotal": today_total.count or 0,
        "todayAnswered": today_answered.count or 0,
        "todayMissed": today_missed.count or 0,
        "weekTotal": week_total.count or 0,
        "weekAnswered": week_answered.count or 0,
        "weekMissed": week_missed.count or 0
    }