"""
Phone Numbers Service
Handles business logic for phone number management
"""

from typing import List, Optional, Dict, Any
from datetime import datetime

from backend.shared.errors import BusinessLogicError, NotFoundError
from .entities import (
    PhoneNumber, PhoneNumberProvisioningRequest,
    VoiceSettings, ConversationRules, OperatingHours,
    PhoneNumberStatus
)
from .repositories import IPhoneNumberRepository


class PhoneNumberService:
    """Service for managing phone numbers"""
    
    def __init__(self, repository: IPhoneNumberRepository):
        self.repository = repository
    
    async def get_phone_number(self, phone_id: str) -> PhoneNumber:
        """Get a specific phone number"""
        phone = await self.repository.get_by_id(phone_id)
        if not phone:
            raise NotFoundError(f"Phone number {phone_id} not found")
        return phone
    
    async def get_business_phone_numbers(self, business_id: str) -> List[PhoneNumber]:
        """Get all phone numbers for a business"""
        return await self.repository.get_by_business_id(business_id)
    
    async def search_available_numbers(
        self,
        area_code: Optional[str] = None,
        contains: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Search for available phone numbers"""
        return await self.repository.search_available_numbers(
            area_code=area_code,
            contains=contains,
            limit=20
        )
    
    async def provision_phone_number(
        self,
        business_id: str,
        display_name: str,
        area_code: Optional[str] = None,
        timezone: str = "America/New_York"
    ) -> PhoneNumber:
        """Provision a new phone number for a business"""
        # Check if this is the first phone number
        existing = await self.repository.get_by_business_id(business_id)
        is_first = len(existing) == 0
        
        request = PhoneNumberProvisioningRequest(
            business_id=business_id,
            area_code=area_code,
            display_name=display_name,
            timezone=timezone
        )
        
        phone = await self.repository.provision_from_twilio(request)
        
        # If first phone, make it primary
        if is_first:
            phone.set_as_primary()
            await self.repository.update(phone)
        
        return phone
    
    async def update_voice_settings(
        self,
        phone_id: str,
        settings: VoiceSettings
    ) -> PhoneNumber:
        """Update voice settings for a phone number"""
        phone = await self.get_phone_number(phone_id)
        
        if phone.status != PhoneNumberStatus.ACTIVE:
            raise BusinessLogicError(f"Cannot update settings for {phone.status} phone number")
        
        phone.update_voice_settings(settings)
        return await self.repository.update(phone)
    
    async def update_conversation_rules(
        self,
        phone_id: str,
        rules: ConversationRules
    ) -> PhoneNumber:
        """Update conversation rules for a phone number"""
        phone = await self.get_phone_number(phone_id)
        
        if phone.status != PhoneNumberStatus.ACTIVE:
            raise BusinessLogicError(f"Cannot update rules for {phone.status} phone number")
        
        phone.update_conversation_rules(rules)
        return await self.repository.update(phone)
    
    async def update_operating_hours(
        self,
        phone_id: str,
        hours: List[OperatingHours]
    ) -> PhoneNumber:
        """Update operating hours for a phone number"""
        phone = await self.get_phone_number(phone_id)
        
        if phone.status != PhoneNumberStatus.ACTIVE:
            raise BusinessLogicError(f"Cannot update hours for {phone.status} phone number")
        
        phone.set_operating_hours(hours)
        return await self.repository.update(phone)
    
    async def set_primary_phone(
        self,
        business_id: str,
        phone_id: str
    ) -> PhoneNumber:
        """Set a phone number as primary for the business"""
        phone = await self.get_phone_number(phone_id)
        
        if phone.business_id != business_id:
            raise BusinessLogicError("Phone number does not belong to this business")
        
        if phone.status != PhoneNumberStatus.ACTIVE:
            raise BusinessLogicError("Only active phone numbers can be set as primary")
        
        phone.set_as_primary()
        return await self.repository.update(phone)
    
    async def suspend_phone_number(self, phone_id: str) -> PhoneNumber:
        """Suspend a phone number"""
        phone = await self.get_phone_number(phone_id)
        
        # Check if it's the only active number
        all_numbers = await self.repository.get_by_business_id(phone.business_id)
        active_count = sum(1 for p in all_numbers if p.status == PhoneNumberStatus.ACTIVE)
        
        if active_count <= 1:
            raise BusinessLogicError("Cannot suspend the only active phone number")
        
        phone.suspend()
        
        # If this was primary, make another number primary
        if phone.is_primary:
            for other in all_numbers:
                if other.id != phone.id and other.status == PhoneNumberStatus.ACTIVE:
                    other.set_as_primary()
                    await self.repository.update(other)
                    break
        
        return await self.repository.update(phone)
    
    async def release_phone_number(self, phone_id: str) -> None:
        """Release a phone number back to Twilio"""
        phone = await self.get_phone_number(phone_id)
        
        # Check if it's the only number
        all_numbers = await self.repository.get_by_business_id(phone.business_id)
        if len(all_numbers) <= 1:
            raise BusinessLogicError("Cannot release the only phone number for a business")
        
        await self.repository.release_to_twilio(phone_id)
    
    async def get_voice_agent_config(self, phone_number: str) -> Dict[str, Any]:
        """Get voice agent configuration for a phone number"""
        phone = await self.repository.get_by_phone_number(phone_number)
        if not phone:
            raise NotFoundError(f"Phone number {phone_number} not found")
        
        if phone.status != PhoneNumberStatus.ACTIVE:
            raise BusinessLogicError(f"Phone number {phone_number} is not active")
        
        return phone.to_voice_agent_config()
    
    async def broadcast_settings_update(self, phone_id: str, update_type: str) -> None:
        """Broadcast settings update via real-time channels"""
        phone = await self.get_phone_number(phone_id)
        
        # This would integrate with your real-time broadcasting system
        # For now, we'll just log it
        import logging
        logger = logging.getLogger(__name__)
        logger.info(
            f"Broadcasting {update_type} update for phone {phone.phone_number} "
            f"(ID: {phone_id}, Business: {phone.business_id})"
        )