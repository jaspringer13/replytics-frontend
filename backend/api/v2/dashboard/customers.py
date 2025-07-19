"""
Customer management endpoints
"""

from typing import Optional
from fastapi import APIRouter, Request, Depends, Query

from api.dashboard.auth import get_current_user
from services.supabase_service import SupabaseService

router = APIRouter()


@router.get("/")
async def get_customers(
    request: Request,
    search: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    sortBy: Optional[str] = Query("lastInteraction"),
    sortOrder: Optional[str] = Query("desc"),
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get customers with filtering and pagination"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        return {"customers": [], "total": 0}
    
    filters = {
        "search": search,
        "segment": segment,
        "sortBy": sortBy,
        "sortOrder": sortOrder,
        "page": page,
        "pageSize": pageSize
    }
    
    result = await supabase.get_customers(profile["id"], filters)
    return result


@router.get("/segments/counts")
async def get_segment_counts(
    request: Request,
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get customer counts by segment"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        return {
            "all": 0,
            "vip": 0,
            "regular": 0,
            "at_risk": 0,
            "new": 0,
            "dormant": 0
        }
    
    # Query customer_segments materialized view for actual counts
    query = supabase.client.table('customer_segments').select('segment').eq('tenant_id', profile["id"])
    
    # Apply search filter if provided
    if search:
        search_term = f"%{search.lower()}%"
        query = query.or_(f"first_name.ilike.{search_term},last_name.ilike.{search_term},ani_hash.ilike.{search_term}")
    
    response = query.execute()
    
    if response.data is None:
        return {
            "all": 0,
            "vip": 0,
            "regular": 0,
            "at_risk": 0,
            "new": 0,
            "dormant": 0
        }
    
    # Count segments
    segment_counts = {
        "all": 0,
        "vip": 0,
        "regular": 0,
        "at_risk": 0,
        "new": 0,
        "dormant": 0
    }
    
    for row in response.data:
        segment_counts["all"] += 1
        segment = row.get("segment")
        if segment in segment_counts:
            segment_counts[segment] += 1
    
    return segment_counts