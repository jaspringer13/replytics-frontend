"""
Customer management endpoints
"""

from typing import Optional
from fastapi import APIRouter, Request, Depends, Query
from pydantic import BaseModel

from api.dashboard.auth import get_current_user
from services.supabase_service import SupabaseService

router = APIRouter()


class CustomerFilters(BaseModel):
    search: Optional[str] = None
    segment: Optional[str] = None
    sortBy: Optional[str] = "lastInteraction"
    sortOrder: Optional[str] = "desc"
    page: int = 1
    pageSize: int = 10


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
    
    # For now, return mock data
    # TODO: Implement actual segment counting logic
    return {
        "all": 150,
        "vip": 20,
        "regular": 80,
        "at_risk": 15,
        "new": 25,
        "dormant": 10
    }