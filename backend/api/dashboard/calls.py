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
    current_user: dict = Depends(get_current_user)
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
    
    result = await query.execute()
    
    return {
        "calls": result.data or [],
        "total": result.count or 0
    }


@router.get("/recordings/{call_id}")
async def get_call_recording(
    request: Request,
    call_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get recording URL for a call"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get call details
    result = await supabase.client.table('calls')\
        .select('recording_url')\
        .eq('id', call_id)\
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
    current_user: dict = Depends(get_current_user)
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
    
    # Get today's stats
    today_result = await supabase.client.table('calls')\
        .select('status', count='exact')\
        .eq('business_id', profile["id"])\
        .gte('created_at', today.isoformat())\
        .execute()
    
    # Get week stats
    week_result = await supabase.client.table('calls')\
        .select('status', count='exact')\
        .eq('business_id', profile["id"])\
        .gte('created_at', week_ago.isoformat())\
        .execute()
    
    # Calculate stats
    today_calls = today_result.data or []
    week_calls = week_result.data or []
    
    return {
        "todayTotal": len(today_calls),
        "todayAnswered": len([c for c in today_calls if c.get('status') == 'completed']),
        "todayMissed": len([c for c in today_calls if c.get('status') == 'missed']),
        "weekTotal": len(week_calls),
        "weekAnswered": len([c for c in week_calls if c.get('status') == 'completed']),
        "weekMissed": len([c for c in week_calls if c.get('status') == 'missed'])
    }