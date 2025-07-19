"""
Business profile and settings endpoints
"""

from typing import Optional
from fastapi import APIRouter, Request, Depends, HTTPException
from pydantic import BaseModel

from api.dashboard.auth import get_current_user
from services.supabase_service import SupabaseService

router = APIRouter()


class BusinessProfileUpdate(BaseModel):
    businessName: Optional[str] = None
    industry: Optional[str] = None
    phoneNumber: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipCode: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    description: Optional[str] = None


class VoiceSettingsUpdate(BaseModel):
    voiceId: Optional[str] = None
    voiceSpeed: Optional[float] = None
    voicePitch: Optional[float] = None
    greetingMessage: Optional[str] = None
    voiceGender: Optional[str] = None
    language: Optional[str] = None
    transferNumber: Optional[str] = None
    enableTransfer: Optional[bool] = None
    maxCallDuration: Optional[int] = None
    recordCalls: Optional[bool] = None
    transcribeCalls: Optional[bool] = None


class ConversationRulesUpdate(BaseModel):
    bookingEnabled: Optional[bool] = None
    collectCustomerInfo: Optional[bool] = None
    sendConfirmationSMS: Optional[bool] = None
    businessHoursOnly: Optional[bool] = None
    afterHoursMessage: Optional[str] = None
    bookingInstructions: Optional[str] = None
    faqResponses: Optional[dict] = None
    customResponses: Optional[list] = None


@router.get("/profile")
async def get_business_profile(request: Request, current_user: dict = Depends(get_current_user)):
    """Get business profile for current user"""
    supabase: SupabaseService = request.app.state.supabase
    
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        # Create default profile if it doesn't exist
        profile = {
            "user_id": current_user["id"],
            "businessName": f"{current_user.get('name', 'My')} Business",
            "industry": "general",
            "timezone": "America/New_York"
        }
        supabase.client.table('business_profiles').insert(profile).execute()
    
    return profile


@router.patch("/profile")
async def update_business_profile(
    request: Request,
    updates: BusinessProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update business profile"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Convert to dict and remove None values
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    
    if not update_data:
        return {"message": "No updates provided"}
    
    updated_profile = await supabase.update_business_profile(current_user["id"], update_data)
    if not updated_profile:
        raise HTTPException(status_code=500, detail="Failed to update business profile")
    
    return updated_profile


@router.get("/voice-settings")
async def get_voice_settings(request: Request, current_user: dict = Depends(get_current_user)):
    """Get voice settings for business"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile first
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    
    settings = await supabase.get_voice_settings(profile["id"])
    if not settings:
        # Return default settings
        settings = {
            "business_id": profile["id"],
            "voiceId": "emma",
            "voiceSpeed": 1.0,
            "voicePitch": 1.0,
            "greetingMessage": "Thank you for calling. How can I help you today?",
            "voiceGender": "female",
            "language": "en-US",
            "enableTransfer": False,
            "maxCallDuration": 300,
            "recordCalls": True,
            "transcribeCalls": True
        }
    
    return settings


@router.patch("/voice-settings")
async def update_voice_settings(
    request: Request,
    settings: VoiceSettingsUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update voice settings"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    
    # Convert to dict and remove None values
    update_data = {k: v for k, v in settings.dict().items() if v is not None}
    
    if not update_data:
        return {"message": "No updates provided"}
    
    updated_settings = await supabase.update_voice_settings(profile["id"], update_data)
    if not updated_settings:
        raise HTTPException(status_code=500, detail="Failed to update voice settings")
    
    # TODO: Notify voice bot service of settings change
    
    return updated_settings


@router.get("/conversation-rules")
async def get_conversation_rules(request: Request, current_user: dict = Depends(get_current_user)):
    """Get conversation rules for business"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    
    # Get from business profile settings
    rules = profile.get("conversation_rules", {
        "bookingEnabled": True,
        "collectCustomerInfo": True,
        "sendConfirmationSMS": True,
        "businessHoursOnly": True,
        "afterHoursMessage": "We're currently closed. Please call back during business hours.",
        "bookingInstructions": "I can help you schedule an appointment. What service would you like to book?",
        "faqResponses": {},
        "customResponses": []
    })
    
    return rules


@router.patch("/conversation-rules")
async def update_conversation_rules(
    request: Request,
    rules: ConversationRulesUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update conversation rules"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    
    # Convert to dict and remove None values
    update_data = {k: v for k, v in rules.dict().items() if v is not None}
    
    if not update_data:
        return {"message": "No updates provided"}
    
    # Update conversation rules in business profile
    current_rules = profile.get("conversation_rules", {})
    current_rules.update(update_data)
    
    updated_profile = await supabase.update_business_profile(
        current_user["id"],
        {"conversation_rules": current_rules}
    )
    
    if not updated_profile:
        raise HTTPException(status_code=500, detail="Failed to update conversation rules")
    
    return current_rules