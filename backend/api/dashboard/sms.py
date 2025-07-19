"""
SMS messaging endpoints
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Request, Depends, Query, HTTPException
from pydantic import BaseModel

from api.dashboard.auth import get_current_user
from services.supabase_service import SupabaseService

router = APIRouter()


class SendSMSRequest(BaseModel):
    conversationId: str
    message: str
    direction: str = "outbound"


@router.get("/")
async def get_sms_messages(
    request: Request,
    conversationId: Optional[str] = Query(None),
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    current_user: dict = Depends(get_current_user)
):
    """Get SMS messages with filtering"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        return {"messages": [], "total": 0}
    
    # Build query
    query = supabase.client.table('sms_messages').select('*', count='exact').eq('business_id', profile["id"])
    
    # Apply filters
    if conversationId:
        query = query.eq('conversation_id', conversationId)
    if startDate:
        query = query.gte('created_at', startDate)
    if endDate:
        query = query.lte('created_at', endDate)
    
    # Apply pagination
    query = query.order('created_at', desc=True).range(offset, offset + limit - 1)
    
    result = await query.execute()
    
    return {
        "messages": result.data or [],
        "total": result.count or 0
    }


@router.post("/send")
async def send_sms(
    request: Request,
    sms_data: SendSMSRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send an SMS message"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    
    # Get conversation details
    conversation_result = await supabase.client.table('sms_conversations')\
        .select('*')\
        .eq('id', sms_data.conversationId)\
        .single()\
        .execute()
    
    if not conversation_result.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation = conversation_result.data
    
    # Create SMS record
    sms_record = {
        "business_id": profile["id"],
        "conversation_id": sms_data.conversationId,
        "phone_number": conversation.get("customer_phone"),
        "message": sms_data.message,
        "direction": sms_data.direction,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    }
    
    result = await supabase.client.table('sms_messages').insert(sms_record).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to send SMS")
    
    # TODO: Integrate with voice bot service to actually send SMS via Twilio
    
    return result.data[0]


@router.get("/conversations")
async def get_conversations(
    request: Request,
    limit: int = Query(20, le=50),
    offset: int = Query(0),
    current_user: dict = Depends(get_current_user)
):
    """Get SMS conversations"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        return {"conversations": [], "total": 0}
    
    # Get conversations with last message
    result = await supabase.client.table('sms_conversations')\
        .select('*, last_message:sms_messages!conversation_id(*)', count='exact')\
        .eq('business_id', profile["id"])\
        .order('last_message_at', desc=True)\
        .range(offset, offset + limit - 1)\
        .execute()
    
    return {
        "conversations": result.data or [],
        "total": result.count or 0
    }