"""
Phone Numbers Repository
Handles database operations and Twilio integration
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from abc import ABC, abstractmethod

from twilio.rest import Client as TwilioClient
from twilio.base.exceptions import TwilioRestException

from backend.shared.infrastructure.database import SupabaseClient
from backend.shared.errors import NotFoundError, BusinessLogicError
from .entities import (
    PhoneNumber, PhoneNumberStatus, TwilioMetadata, 
    Address, VoiceSettings, ConversationRules, OperatingHours,
    PhoneNumberCapability, PhoneNumberProvisioningRequest
)


class IPhoneNumberRepository(ABC):
    """Phone number repository interface"""
    
    @abstractmethod
    async def get_by_id(self, phone_id: str) -> Optional[PhoneNumber]:
        """Get phone number by ID"""
        pass
    
    @abstractmethod
    async def get_by_phone_number(self, phone_number: str) -> Optional[PhoneNumber]:
        """Get by actual phone number"""
        pass
    
    @abstractmethod
    async def get_by_business_id(self, business_id: str) -> List[PhoneNumber]:
        """Get all phone numbers for a business"""
        pass
    
    @abstractmethod
    async def create(self, phone_number: PhoneNumber) -> PhoneNumber:
        """Create a new phone number record"""
        pass
    
    @abstractmethod
    async def update(self, phone_number: PhoneNumber) -> PhoneNumber:
        """Update phone number"""
        pass
    
    @abstractmethod
    async def delete(self, phone_id: str) -> None:
        """Delete phone number"""
        pass
    
    @abstractmethod
    async def provision_from_twilio(self, request: PhoneNumberProvisioningRequest) -> PhoneNumber:
        """Provision a new phone number from Twilio"""
        pass
    
    @abstractmethod
    async def release_to_twilio(self, phone_id: str) -> None:
        """Release phone number back to Twilio"""
        pass
    
    @abstractmethod
    async def search_available_numbers(
        self, 
        area_code: Optional[str] = None,
        contains: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Search for available phone numbers in Twilio"""
        pass


class PhoneNumberRepository(IPhoneNumberRepository):
    """Concrete implementation with Supabase and Twilio"""
    
    def __init__(self, db: SupabaseClient, twilio_client: TwilioClient):
        self.db = db
        self.twilio = twilio_client
        self.table = "phone_numbers"
    
    async def get_by_id(self, phone_id: str) -> Optional[PhoneNumber]:
        """Get phone number by ID"""
        result = await self.db.client.table(self.table).select("*").eq("id", phone_id).single().execute()
        
        if not result.data:
            return None
        
        return self._to_entity(result.data)
    
    async def get_by_phone_number(self, phone_number: str) -> Optional[PhoneNumber]:
        """Get by actual phone number"""
        result = await self.db.client.table(self.table).select("*").eq("phone_number", phone_number).single().execute()
        
        if not result.data:
            return None
        
        return self._to_entity(result.data)
    
    async def get_by_business_id(self, business_id: str) -> List[PhoneNumber]:
        """Get all phone numbers for a business"""
        result = await self.db.client.table(self.table)\
            .select("*")\
            .eq("business_id", business_id)\
            .order("is_primary", desc=True)\
            .order("created_at")\
            .execute()
        
        return [self._to_entity(data) for data in result.data]
    
    async def create(self, phone_number: PhoneNumber) -> PhoneNumber:
        """Create a new phone number record"""
        # If this is marked as primary, unset other primary numbers
        if phone_number.is_primary:
            await self._unset_primary_for_business(phone_number.business_id)
        
        data = self._to_dict(phone_number)
        result = await self.db.client.table(self.table).insert(data).execute()
        
        return self._to_entity(result.data[0])
    
    async def update(self, phone_number: PhoneNumber) -> PhoneNumber:
        """Update phone number"""
        # If setting as primary, unset others
        if phone_number.is_primary:
            await self._unset_primary_for_business(phone_number.business_id, exclude_id=phone_number.id)
        
        data = self._to_dict(phone_number)
        result = await self.db.client.table(self.table)\
            .update(data)\
            .eq("id", phone_number.id)\
            .execute()
        
        return self._to_entity(result.data[0])
    
    async def delete(self, phone_id: str) -> None:
        """Delete phone number (soft delete by marking as released)"""
        phone = await self.get_by_id(phone_id)
        if not phone:
            raise NotFoundError(f"Phone number {phone_id} not found")
        
        # Release from Twilio if active
        if phone.status == PhoneNumberStatus.ACTIVE:
            await self.release_to_twilio(phone_id)
        
        # Mark as released in our database
        await self.db.client.table(self.table)\
            .update({"status": PhoneNumberStatus.RELEASED.value, "updated_at": datetime.utcnow().isoformat()})\
            .eq("id", phone_id)\
            .execute()
    
    async def provision_from_twilio(self, request: PhoneNumberProvisioningRequest) -> PhoneNumber:
        """Provision a new phone number from Twilio"""
        try:
            # Search for available numbers
            available_numbers = self.twilio.available_phone_numbers('US').local.list(
                area_code=request.area_code,
                contains=request.contains,
                voice_enabled=PhoneNumberCapability.VOICE in request.capabilities,
                sms_enabled=PhoneNumberCapability.SMS in request.capabilities,
                limit=1
            )
            
            if not available_numbers:
                raise BusinessLogicError("No available phone numbers found with the specified criteria")
            
            available = available_numbers[0]
            
            # Purchase the number
            voice_url = f"{self._get_webhook_base_url()}/voice/incoming"
            sms_url = f"{self._get_webhook_base_url()}/sms/incoming"
            
            purchased = self.twilio.incoming_phone_numbers.create(
                phone_number=available.phone_number,
                voice_url=voice_url,
                voice_method="POST",
                sms_url=sms_url,
                sms_method="POST",
                friendly_name=f"{request.display_name} - {request.business_id}"
            )
            
            # Create our phone number entity
            twilio_metadata = TwilioMetadata(
                sid=purchased.sid,
                account_sid=purchased.account_sid,
                friendly_name=purchased.friendly_name,
                capabilities=request.capabilities,
                voice_url=voice_url,
                voice_method="POST",
                sms_url=sms_url,
                sms_method="POST"
            )
            
            phone_number = PhoneNumber(
                id=self._generate_id(),
                business_id=request.business_id,
                phone_number=purchased.phone_number,
                twilio_metadata=twilio_metadata,
                display_name=request.display_name,
                address=request.address,
                timezone=request.timezone,
                status=PhoneNumberStatus.ACTIVE,
                activated_at=datetime.utcnow()
            )
            
            # Set default operating hours (9 AM - 5 PM)
            default_hours = []
            for day in range(7):
                default_hours.append(OperatingHours(
                    day_of_week=day,
                    open_time="09:00",
                    close_time="17:00",
                    is_closed=day in [0, 6]  # Closed on weekends by default
                ))
            phone_number.set_operating_hours(default_hours)
            
            # Save to database
            return await self.create(phone_number)
            
        except TwilioRestException as e:
            raise BusinessLogicError(f"Failed to provision phone number from Twilio: {str(e)}")
    
    async def release_to_twilio(self, phone_id: str) -> None:
        """Release phone number back to Twilio"""
        phone = await self.get_by_id(phone_id)
        if not phone:
            raise NotFoundError(f"Phone number {phone_id} not found")
        
        try:
            # Delete from Twilio
            self.twilio.incoming_phone_numbers(phone.twilio_metadata.sid).delete()
            
            # Update our record
            phone.release()
            await self.update(phone)
            
        except TwilioRestException as e:
            raise BusinessLogicError(f"Failed to release phone number from Twilio: {str(e)}")
    
    async def search_available_numbers(
        self, 
        area_code: Optional[str] = None,
        contains: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Search for available phone numbers in Twilio"""
        try:
            available = self.twilio.available_phone_numbers('US').local.list(
                area_code=area_code,
                contains=contains,
                voice_enabled=True,
                sms_enabled=True,
                limit=limit
            )
            
            return [
                {
                    "phone_number": num.phone_number,
                    "friendly_name": num.friendly_name,
                    "locality": num.locality,
                    "region": num.region,
                    "postal_code": num.postal_code,
                    "capabilities": {
                        "voice": num.capabilities.get('voice', False),
                        "sms": num.capabilities.get('sms', False),
                        "mms": num.capabilities.get('mms', False),
                    }
                }
                for num in available
            ]
        except TwilioRestException as e:
            raise BusinessLogicError(f"Failed to search available numbers: {str(e)}")
    
    async def _unset_primary_for_business(self, business_id: str, exclude_id: Optional[str] = None):
        """Unset primary flag for all other phone numbers of a business"""
        query = self.db.client.table(self.table)\
            .update({"is_primary": False})\
            .eq("business_id", business_id)
        
        if exclude_id:
            query = query.neq("id", exclude_id)
        
        await query.execute()
    
    def _to_entity(self, data: Dict[str, Any]) -> PhoneNumber:
        """Convert database record to entity"""
        # Parse nested objects
        twilio_metadata = TwilioMetadata(**data["twilio_metadata"])
        
        address = None
        if data.get("address"):
            address = Address(**data["address"])
        
        voice_settings = VoiceSettings(**data.get("voice_settings", {}))
        conversation_rules = ConversationRules(**data.get("conversation_rules", {}))
        
        operating_hours = []
        for h in data.get("operating_hours", []):
            operating_hours.append(OperatingHours(**h))
        
        return PhoneNumber(
            id=data["id"],
            business_id=data["business_id"],
            phone_number=data["phone_number"],
            twilio_metadata=twilio_metadata,
            display_name=data["display_name"],
            description=data.get("description"),
            address=address,
            timezone=data["timezone"],
            voice_settings=voice_settings,
            conversation_rules=conversation_rules,
            operating_hours=operating_hours,
            status=PhoneNumberStatus(data["status"]),
            is_primary=data["is_primary"],
            assigned_staff_ids=data.get("assigned_staff_ids", []),
            sms_enabled=data.get("sms_enabled", True),
            sms_reminder_hours=data.get("sms_reminder_hours", 24),
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
            activated_at=datetime.fromisoformat(data["activated_at"]) if data.get("activated_at") else None
        )
    
    def _to_dict(self, phone_number: PhoneNumber) -> Dict[str, Any]:
        """Convert entity to database record"""
        return {
            "id": phone_number.id,
            "business_id": phone_number.business_id,
            "phone_number": phone_number.phone_number,
            "twilio_metadata": {
                "sid": phone_number.twilio_metadata.sid,
                "account_sid": phone_number.twilio_metadata.account_sid,
                "friendly_name": phone_number.twilio_metadata.friendly_name,
                "capabilities": [c.value for c in phone_number.twilio_metadata.capabilities],
                "voice_url": phone_number.twilio_metadata.voice_url,
                "voice_method": phone_number.twilio_metadata.voice_method,
                "sms_url": phone_number.twilio_metadata.sms_url,
                "sms_method": phone_number.twilio_metadata.sms_method,
            },
            "display_name": phone_number.display_name,
            "description": phone_number.description,
            "address": {
                "street": phone_number.address.street,
                "city": phone_number.address.city,
                "state": phone_number.address.state,
                "zip_code": phone_number.address.zip_code,
                "country": phone_number.address.country,
            } if phone_number.address else None,
            "timezone": phone_number.timezone,
            "voice_settings": {
                "voice_id": phone_number.voice_settings.voice_id,
                "speaking_style": phone_number.voice_settings.speaking_style,
                "speed": phone_number.voice_settings.speed,
                "pitch": phone_number.voice_settings.pitch,
            },
            "conversation_rules": {
                "allow_multiple_services": phone_number.conversation_rules.allow_multiple_services,
                "allow_cancellations": phone_number.conversation_rules.allow_cancellations,
                "allow_rescheduling": phone_number.conversation_rules.allow_rescheduling,
                "no_show_block_enabled": phone_number.conversation_rules.no_show_block_enabled,
                "no_show_threshold": phone_number.conversation_rules.no_show_threshold,
            },
            "operating_hours": [
                {
                    "day_of_week": h.day_of_week,
                    "open_time": h.open_time,
                    "close_time": h.close_time,
                    "is_closed": h.is_closed,
                }
                for h in phone_number.operating_hours
            ],
            "status": phone_number.status.value,
            "is_primary": phone_number.is_primary,
            "assigned_staff_ids": phone_number.assigned_staff_ids,
            "sms_enabled": phone_number.sms_enabled,
            "sms_reminder_hours": phone_number.sms_reminder_hours,
            "created_at": phone_number.created_at.isoformat(),
            "updated_at": phone_number.updated_at.isoformat(),
            "activated_at": phone_number.activated_at.isoformat() if phone_number.activated_at else None,
        }
    
    def _generate_id(self) -> str:
        """Generate unique ID"""
        import uuid
        return str(uuid.uuid4())
    
    def _get_webhook_base_url(self) -> str:
        """Get webhook base URL for Twilio callbacks"""
        # This should come from environment config
        import os
        return os.environ.get("WEBHOOK_BASE_URL", "https://api.replytics.com/webhooks/twilio")