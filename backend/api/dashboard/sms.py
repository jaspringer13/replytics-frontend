"""
SMS messaging endpoints
"""

from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Request, Depends, Query, HTTPException
from pydantic import BaseModel, validator
import re

from api.dashboard.auth import get_current_user
from services.supabase_service import SupabaseService

router = APIRouter()


class SendSMSRequest(BaseModel):
    conversationId: str
    message: str
    direction: str = "outbound"
    
    @validator('message')
    def validate_message(cls, v):
        if not v or not v.strip():
            raise ValueError('Message cannot be empty')
        
        # SMS length limit (160 chars for single SMS, 1600 for concatenated)
        if len(v) > 1600:
            raise ValueError('Message too long (max 1600 characters)')
        
        # Basic content filtering
        spam_patterns = [
            r'\b(viagra|cialis|buy now|click here|free money|win now)\b',
            r'\b(urgent|limited time|act now|call now)\b',
            r'(http://|https://)[^\s]+',  # Suspicious links
        ]
        
        message_lower = v.lower()
        for pattern in spam_patterns:
            if re.search(pattern, message_lower, re.IGNORECASE):
                raise ValueError('Message contains prohibited content')
        
        return v.strip()


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
    
    result = query.execute()
    
    return {
        "messages": result.data or [],
        "total": result.count or 0
    }


async def _check_rate_limit(supabase: SupabaseService, business_id: str) -> None:
    """Check SMS rate limits for business"""
    # Check last 1 hour for rate limiting
    one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    
    recent_sms = supabase.client.table('sms_messages')\
        .select('id', count='exact')\
        .eq('business_id', business_id)\
        .eq('direction', 'outbound')\
        .gte('created_at', one_hour_ago)\
        .execute()
    
    # Rate limit: 100 SMS per hour per business
    if recent_sms.count and recent_sms.count >= 100:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Maximum 100 SMS per hour.")
    
    # Check last 5 minutes for burst protection
    five_minutes_ago = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
    
    recent_burst = supabase.client.table('sms_messages')\
        .select('id', count='exact')\
        .eq('business_id', business_id)\
        .eq('direction', 'outbound')\
        .gte('created_at', five_minutes_ago)\
        .execute()
    
    # Burst limit: 10 SMS per 5 minutes
    if recent_burst.count and recent_burst.count >= 10:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Maximum 10 SMS per 5 minutes.")


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
    
    # Check rate limits
    await _check_rate_limit(supabase, profile["id"])
    
    # Get conversation details
    conversation_result = supabase.client.table('sms_conversations')\
        .select('*')\
        .eq('id', sms_data.conversationId)\
        .single()\
        .execute()
    
    if not conversation_result.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation = conversation_result.data
    
    # Create SMS record with validated message
    sms_record = {
        "business_id": profile["id"],
        "conversation_id": sms_data.conversationId,
        "phone_number": conversation.get("customer_phone"),
        "message": sms_data.message,  # Already validated by pydantic
        "direction": sms_data.direction,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = supabase.client.table('sms_messages').insert(sms_record).execute()
    
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
    result = supabase.client.table('sms_conversations')\
        .select('*, last_message:sms_messages!conversation_id(*)', count='exact')\
        .eq('business_id', profile["id"])\
        .order('last_message_at', desc=True)\
        .range(offset, offset + limit - 1)\
        .execute()
    
    return {
        "conversations": result.data or [],
        "total": result.count or 0
    }