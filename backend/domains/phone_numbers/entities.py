"""
Phone Numbers Domain Entities
Handles Twilio phone numbers and their configurations
"""

from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

from backend.shared.domain.entities import Entity, ValueObject


class PhoneNumberStatus(Enum):
    """Phone number status in our system"""
    PENDING = "pending"  # Selected but not yet provisioned
    ACTIVE = "active"    # Provisioned and ready
    SUSPENDED = "suspended"  # Temporarily disabled
    RELEASED = "released"   # Released back to Twilio


class PhoneNumberCapability(Enum):
    """Twilio phone number capabilities"""
    VOICE = "voice"
    SMS = "sms"
    MMS = "mms"
    FAX = "fax"


@dataclass(frozen=True)
class TwilioMetadata(ValueObject):
    """Twilio-specific phone number metadata"""
    sid: str  # Twilio Phone Number SID
    account_sid: str  # Twilio Account SID
    friendly_name: str
    capabilities: List[PhoneNumberCapability]
    voice_url: Optional[str] = None
    voice_method: str = "POST"
    sms_url: Optional[str] = None
    sms_method: str = "POST"
    voice_fallback_url: Optional[str] = None
    sms_fallback_url: Optional[str] = None


@dataclass(frozen=True)
class Address(ValueObject):
    """Location address"""
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: str = "US"
    
    def to_display_string(self) -> str:
        parts = [self.street, self.city, self.state, self.zip_code]
        return ", ".join(filter(None, parts))


@dataclass(frozen=True)
class VoiceSettings(ValueObject):
    """Voice agent settings for this phone number"""
    voice_id: str = "kdmDKE6EkgrWrrykO9Qt"  # Default voice


@dataclass(frozen=True)
class ConversationRules(ValueObject):
    """Conversation rules for this phone number"""
    allow_multiple_services: bool = True
    allow_cancellations: bool = True
    allow_rescheduling: bool = True
    no_show_block_enabled: bool = False
    no_show_threshold: int = 3
    
    def __post_init__(self):
        if not 1 <= self.no_show_threshold <= 10:
            raise ValueError("No-show threshold must be between 1 and 10")


@dataclass(frozen=True)
class OperatingHours(ValueObject):
    """Operating hours for a specific day"""
    day_of_week: int  # 0-6 (Sunday-Saturday)
    open_time: str    # HH:MM format
    close_time: str   # HH:MM format
    is_closed: bool = False


@dataclass
class PhoneNumber(Entity):
    """Phone number entity with Twilio integration"""
    # Identity
    id: str
    business_id: str
    
    # Twilio data
    phone_number: str  # E.164 format
    twilio_metadata: TwilioMetadata
    
    # Business data
    display_name: str  # e.g., "Downtown Location"
    description: Optional[str] = None
    address: Optional[Address] = None
    timezone: str = "America/New_York"
    
    # Configuration
    voice_settings: VoiceSettings = field(default_factory=VoiceSettings)
    conversation_rules: ConversationRules = field(default_factory=ConversationRules)
    operating_hours: List[OperatingHours] = field(default_factory=list)
    
    # Status
    status: PhoneNumberStatus = PhoneNumberStatus.ACTIVE
    is_primary: bool = False
    
    # Staff assignment
    assigned_staff_ids: List[str] = field(default_factory=list)
    
    # SMS settings
    sms_enabled: bool = True
    sms_reminder_hours: int = 24
    
    # Timestamps
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    activated_at: Optional[datetime] = None
    
    def update_voice_settings(self, settings: VoiceSettings) -> None:
        """Update voice configuration"""
        self.voice_settings = settings
        self.updated_at = datetime.utcnow()
    
    def update_conversation_rules(self, rules: ConversationRules) -> None:
        """Update conversation rules"""
        self.conversation_rules = rules
        self.updated_at = datetime.utcnow()
    
    def set_operating_hours(self, hours: List[OperatingHours]) -> None:
        """Set operating hours"""
        # Validate we have 7 days
        days = {h.day_of_week for h in hours}
        if len(days) != 7:
            raise ValueError("Must provide operating hours for all 7 days")
        
        self.operating_hours = hours
        self.updated_at = datetime.utcnow()
    
    def assign_staff(self, staff_ids: List[str]) -> None:
        """Assign staff members to this location"""
        self.assigned_staff_ids = staff_ids
        self.updated_at = datetime.utcnow()
    
    def activate(self) -> None:
        """Activate the phone number"""
        if self.status != PhoneNumberStatus.PENDING:
            raise ValueError(f"Cannot activate phone number in {self.status} status")
        
        self.status = PhoneNumberStatus.ACTIVE
        self.activated_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def suspend(self) -> None:
        """Suspend the phone number"""
        if self.status != PhoneNumberStatus.ACTIVE:
            raise ValueError(f"Cannot suspend phone number in {self.status} status")
        
        self.status = PhoneNumberStatus.SUSPENDED
        self.updated_at = datetime.utcnow()
    
    def release(self) -> None:
        """Release the phone number back to Twilio"""
        self.status = PhoneNumberStatus.RELEASED
        self.updated_at = datetime.utcnow()
    
    def set_as_primary(self) -> None:
        """Mark this phone number as primary for the business"""
        self.is_primary = True
        self.updated_at = datetime.utcnow()
    
    def to_voice_agent_config(self) -> Dict[str, Any]:
        """Convert to voice agent configuration format"""
        return {
            "phone_number": self.phone_number,
            "business_id": self.business_id,
            "twilio_sid": self.twilio_metadata.sid,
            "voice_config": {
                "voice_id": self.voice_settings.voice_id,
                "speaking_style": self.voice_settings.speaking_style,
                "speed": self.voice_settings.speed,
                "pitch": self.voice_settings.pitch,
            },
            "conversation_rules": {
                "allow_multiple_services": self.conversation_rules.allow_multiple_services,
                "allow_cancellations": self.conversation_rules.allow_cancellations,
                "allow_rescheduling": self.conversation_rules.allow_rescheduling,
                "no_show_block_enabled": self.conversation_rules.no_show_block_enabled,
                "no_show_threshold": self.conversation_rules.no_show_threshold,
            },
            "operating_hours": [
                {
                    "day_of_week": h.day_of_week,
                    "open_time": h.open_time,
                    "close_time": h.close_time,
                    "is_closed": h.is_closed,
                }
                for h in self.operating_hours
            ],
            "timezone": self.timezone,
            "location_name": self.display_name,
        }


@dataclass
class PhoneNumberProvisioningRequest(ValueObject):
    """Request to provision a new phone number from Twilio"""
    business_id: str
    area_code: Optional[str] = None
    contains: Optional[str] = None  # Pattern to search for
    capabilities: List[PhoneNumberCapability] = field(
        default_factory=lambda: [PhoneNumberCapability.VOICE, PhoneNumberCapability.SMS]
    )
    display_name: str = "Main Location"
    address: Optional[Address] = None
    timezone: str = "America/New_York"