"""
Call history and management endpoints
"""

import asyncio
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
    
    # Use single query with conditional aggregation for better performance
    try:
        # Use RPC call for efficient aggregation
        result = supabase.client.rpc('get_call_stats', {
            'business_id_param': profile["id"],
            'today_param': today.isoformat(),
            'week_ago_param': week_ago.isoformat()
        }).execute()
        
        if result.data and len(result.data) > 0:
            stats = result.data[0]
            return {
                "todayTotal": stats.get('today_total', 0),
                "todayAnswered": stats.get('today_answered', 0),
                "todayMissed": stats.get('today_missed', 0),
                "weekTotal": stats.get('week_total', 0),
                "weekAnswered": stats.get('week_answered', 0),
                "weekMissed": stats.get('week_missed', 0)
            }
    except Exception as e:
        # Fallback to individual queries if RPC not available
        print(f"RPC call failed, falling back to individual queries: {e}")
    
    # Fallback: Use optimized individual queries with parallel execution
    
    async def get_count(query_params):
        query = supabase.client.table('calls').select('*', count='exact')
        for key, value in query_params.items():
            if key == 'business_id':
                query = query.eq('business_id', value)
            elif key == 'status':
                query = query.eq('status', value)
            elif key == 'created_at_gte':
                query = query.gte('created_at', value)
        return query.execute().count or 0
    
    # Execute queries in parallel for better performance
    counts = await asyncio.gather(
        get_count({'business_id': profile["id"], 'created_at_gte': today.isoformat()}),
        get_count({'business_id': profile["id"], 'status': 'completed', 'created_at_gte': today.isoformat()}),
        get_count({'business_id': profile["id"], 'status': 'missed', 'created_at_gte': today.isoformat()}),
        get_count({'business_id': profile["id"], 'created_at_gte': week_ago.isoformat()}),
        get_count({'business_id': profile["id"], 'status': 'completed', 'created_at_gte': week_ago.isoformat()}),
        get_count({'business_id': profile["id"], 'status': 'missed', 'created_at_gte': week_ago.isoformat()})
    )
    
    return {
        "todayTotal": counts[0],
        "todayAnswered": counts[1],
        "todayMissed": counts[2],
        "weekTotal": counts[3],
        "weekAnswered": counts[4],
        "weekMissed": counts[5]
    }