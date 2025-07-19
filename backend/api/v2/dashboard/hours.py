"""
Business hours management endpoints
"""

from typing import List
from fastapi import APIRouter, Request, Depends, HTTPException
from pydantic import BaseModel

from api.dashboard.auth import get_current_user
from services.supabase_service import SupabaseService

router = APIRouter()


class TimeSlot(BaseModel):
    openTime: str  # Format: "HH:MM"
    closeTime: str  # Format: "HH:MM"


class DayHours(BaseModel):
    dayOfWeek: int  # 0 = Sunday, 6 = Saturday
    isClosed: bool
    timeSlots: List[TimeSlot]


@router.get("/")
async def get_business_hours(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get business hours"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    
    # Get hours from database
    result = await supabase.client.table('business_hours')\
        .select('*')\
        .eq('business_id', profile["id"])\
        .order('day_of_week')\
        .execute()
    
    if result.data:
        return result.data
    
    # Return default hours if none exist
    default_hours = []
    for day in range(7):
        is_closed = day == 0  # Closed on Sunday by default
        default_hours.append({
            "dayOfWeek": day,
            "isClosed": is_closed,
            "timeSlots": [] if is_closed else [{
                "openTime": "09:00",
                "closeTime": "17:00"
            }]
        })
    
    return default_hours


@router.patch("/")
async def update_business_hours(
    request: Request,
    hours: List[DayHours],
    current_user: dict = Depends(get_current_user)
):
    """Update business hours"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    
    # Delete existing hours
    await supabase.client.table('business_hours')\
        .delete()\
        .eq('business_id', profile["id"])\
        .execute()
    
    # Insert new hours
    hours_data = []
    for day_hours in hours:
        hours_data.append({
            "business_id": profile["id"],
            "day_of_week": day_hours.dayOfWeek,
            "is_closed": day_hours.isClosed,
            "time_slots": [slot.dict() for slot in day_hours.timeSlots]
        })
    
    if hours_data:
        result = await supabase.client.table('business_hours')\
            .insert(hours_data)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update business hours")
    
    return {"success": True, "message": "Business hours updated"}