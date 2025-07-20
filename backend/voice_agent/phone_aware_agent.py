"""
Phone-Aware Voice Agent
Enhanced voice agent that handles phone-specific configurations and real-time updates
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime

from backend.services.phone_config_subscriber import PhoneConfigSubscriber
from backend.services.supabase_service import SupabaseService
from backend.domains.voice_agent.services import VoiceAgentService
from backend.domains.phone_numbers.entities import PhoneNumber, VoiceSettings
from backend.core.config import settings

logger = logging.getLogger(__name__)


class PhoneAwareVoiceAgent:
    """
    Voice agent that maintains phone-specific configurations
    and responds to real-time configuration updates
    """
    
    def __init__(
        self,
        phone_id: str,
        business_id: str,
        phone_number: str,
        supabase_service: SupabaseService
    ):
        self.phone_id = phone_id
        self.business_id = business_id
        self.phone_number = phone_number
        self.supabase = supabase_service
        
        # Core services
        self.config_subscriber = PhoneConfigSubscriber(supabase_service)
        self.voice_agent = VoiceAgentService()
        
        # Current configuration cache
        self.current_config: Dict[str, Any] = {}
        self.voice_settings: Optional[VoiceSettings] = None
        self.conversation_rules: Dict[str, Any] = {}
        self.operating_hours: list = []
        self.timezone: str = "America/New_York"
        
        # State tracking
        self.is_active = True
        self.config_version = 0
        self.last_config_update: Optional[datetime] = None
    
    async def initialize(self):
        """Initialize the agent with current configuration"""
        logger.info(f"🚀 Initializing phone-aware agent for {self.phone_number}")
        
        # Load initial configuration
        await self._load_configuration()
        
        # Subscribe to real-time updates
        await self._setup_subscriptions()
        
        # Apply initial configuration
        await self._apply_configuration()
        
        logger.info(f"✅ Phone-aware agent initialized for {self.phone_number}")
    
    async def _load_configuration(self):
        """Load current configuration from database"""
        try:
            config = await self.config_subscriber.get_current_config(self.phone_id)
            
            self.current_config = config
            self.voice_settings = VoiceSettings(**config.get('voice_settings', {'voice_id': 'kdmDKE6EkgrWrrykO9Qt'}))
            self.conversation_rules = config.get('conversation_rules', {})
            self.operating_hours = config.get('operating_hours', [])
            self.timezone = config.get('timezone', 'America/New_York')
            self.is_active = config.get('is_active', True)
            
            logger.info(f"📱 Loaded configuration for phone {self.phone_id}:")
            logger.info(f"  - Voice: {self.voice_settings.voice_id}")
            logger.info(f"  - Rules: {self.conversation_rules}")
            logger.info(f"  - Hours: {len(self.operating_hours)} days configured")
            logger.info(f"  - Timezone: {self.timezone}")
            
        except Exception as e:
            logger.error(f"Failed to load phone configuration: {e}")
            raise
    
    async def _setup_subscriptions(self):
        """Set up real-time configuration update subscriptions"""
        
        async def on_voice_settings_update(payload: Dict[str, Any]):
            """Handle voice settings update"""
            logger.info(f"🎤 Voice settings update received for phone {self.phone_id}")
            
            new_settings = payload.get('settings', {})
            if new_settings:
                self.voice_settings = VoiceSettings(**new_settings)
                self.config_version += 1
                self.last_config_update = datetime.utcnow()
                
                # Apply new voice settings
                await self.voice_agent.update_voice(self.voice_settings.voice_id)
                
                # Confirm configuration applied
                await self.config_subscriber.broadcast_config_received(
                    self.phone_id, 
                    'voice_settings'
                )
                
                logger.info(f"✅ Applied new voice: {self.voice_settings.voice_id}")
        
        async def on_conversation_rules_update(payload: Dict[str, Any]):
            """Handle conversation rules update"""
            logger.info(f"📋 Conversation rules update received for phone {self.phone_id}")
            
            new_rules = payload.get('rules', {})
            if new_rules:
                self.conversation_rules = new_rules
                self.config_version += 1
                self.last_config_update = datetime.utcnow()
                
                # Apply new conversation rules
                await self._apply_conversation_rules()
                
                # Confirm configuration applied
                await self.config_subscriber.broadcast_config_received(
                    self.phone_id,
                    'conversation_rules'
                )
                
                logger.info(f"✅ Applied new conversation rules")
        
        async def on_operating_hours_update(payload: Dict[str, Any]):
            """Handle operating hours update"""
            logger.info(f"🕐 Operating hours update received for phone {self.phone_id}")
            
            new_hours = payload.get('operatingHours', [])
            new_timezone = payload.get('timezone')
            
            if new_hours is not None:
                self.operating_hours = new_hours
                self.config_version += 1
                self.last_config_update = datetime.utcnow()
            
            if new_timezone:
                self.timezone = new_timezone
            
            # Apply new operating hours
            await self._apply_operating_hours()
            
            # Confirm configuration applied
            await self.config_subscriber.broadcast_config_received(
                self.phone_id,
                'operating_hours'
            )
            
            logger.info(f"✅ Applied new operating hours for timezone {self.timezone}")
        
        async def on_settings_update(payload: Dict[str, Any]):
            """Handle generic settings update"""
            logger.info(f"⚙️ Settings update received for phone {self.phone_id}")
            
            update_type = payload.get('type')
            if update_type == 'phone_status':
                self.is_active = payload.get('is_active', True)
                logger.info(f"📱 Phone status changed to: {'active' if self.is_active else 'inactive'}")
        
        # Subscribe to updates
        await self.config_subscriber.subscribe_to_phone(
            phone_id=self.phone_id,
            business_id=self.business_id,
            callbacks={
                'voice_settings_updated': on_voice_settings_update,
                'conversation_rules_updated': on_conversation_rules_update,
                'operating_hours_updated': on_operating_hours_update,
                'settings_updated': on_settings_update
            }
        )
    
    async def _apply_configuration(self):
        """Apply all current configuration settings"""
        # Set voice
        if self.voice_settings:
            await self.voice_agent.update_voice(self.voice_settings.voice_id)
        
        # Apply conversation rules
        await self._apply_conversation_rules()
        
        # Apply operating hours
        await self._apply_operating_hours()
    
    async def _apply_conversation_rules(self):
        """Apply conversation rules to the voice agent"""
        self.voice_agent.update_conversation_rules({
            'allow_multiple_services': self.conversation_rules.get('allowMultipleServices', True),
            'allow_cancellations': self.conversation_rules.get('allowCancellations', True),
            'allow_rescheduling': self.conversation_rules.get('allowRescheduling', True),
            'no_show_block_enabled': self.conversation_rules.get('noShowBlockEnabled', False),
            'no_show_threshold': self.conversation_rules.get('noShowThreshold', 3)
        })
    
    async def _apply_operating_hours(self):
        """Apply operating hours to the voice agent"""
        self.voice_agent.update_operating_hours(
            hours=self.operating_hours,
            timezone=self.timezone
        )
    
    async def handle_incoming_call(self, call_data: Dict[str, Any]):
        """Handle an incoming call with phone-specific configuration"""
        if not self.is_active:
            logger.warning(f"📵 Phone {self.phone_id} is inactive, rejecting call")
            return {"action": "reject", "reason": "phone_inactive"}
        
        logger.info(f"📞 Handling call for phone {self.phone_id} with config v{self.config_version}")
        
        # Process call with current configuration
        result = await self.voice_agent.handle_call(
            call_data=call_data,
            phone_id=self.phone_id,
            business_id=self.business_id,
            voice_settings=self.voice_settings,
            conversation_rules=self.conversation_rules,
            operating_hours=self.operating_hours,
            timezone=self.timezone
        )
        
        return result
    
    async def get_status(self) -> Dict[str, Any]:
        """Get current agent status and configuration"""
        return {
            'phone_id': self.phone_id,
            'phone_number': self.phone_number,
            'business_id': self.business_id,
            'is_active': self.is_active,
            'config_version': self.config_version,
            'last_config_update': self.last_config_update.isoformat() if self.last_config_update else None,
            'current_voice': self.voice_settings.voice_id if self.voice_settings else None,
            'conversation_rules': self.conversation_rules,
            'timezone': self.timezone,
            'operating_hours_configured': len(self.operating_hours) > 0
        }
    
    async def cleanup(self):
        """Clean up agent resources"""
        logger.info(f"🧹 Cleaning up phone-aware agent for {self.phone_number}")
        
        # Unsubscribe from updates
        await self.config_subscriber.unsubscribe_from_phone(
            self.phone_id,
            self.business_id
        )
        
        # Clean up voice agent
        await self.voice_agent.cleanup()
        
        logger.info(f"✅ Phone-aware agent cleaned up for {self.phone_number}")


class PhoneAgentManager:
    """
    Manages multiple phone-aware voice agents for a business
    """
    
    def __init__(self, business_id: str, supabase_service: SupabaseService):
        self.business_id = business_id
        self.supabase = supabase_service
        self.agents: Dict[str, PhoneAwareVoiceAgent] = {}
        self.primary_phone_id: Optional[str] = None
    
    async def initialize(self):
        """Initialize all phone agents for the business"""
        logger.info(f"🏢 Initializing phone agents for business {self.business_id}")
        
        # Load all active phone numbers
        phones = await self._load_business_phones()
        
        # Create agent for each phone
        for phone in phones:
            if phone['status'] == 'active':
                agent = PhoneAwareVoiceAgent(
                    phone_id=phone['id'],
                    business_id=self.business_id,
                    phone_number=phone['phone_number'],
                    supabase_service=self.supabase
                )
                
                await agent.initialize()
                self.agents[phone['id']] = agent
                
                if phone.get('is_primary'):
                    self.primary_phone_id = phone['id']
        
        logger.info(f"✅ Initialized {len(self.agents)} phone agents")
    
    async def _load_business_phones(self) -> list:
        """Load all phone numbers for the business"""
        result = await self.supabase.client.table('phone_numbers')\
            .select('*')\
            .eq('business_id', self.business_id)\
            .execute()
        
        return result.data or []
    
    async def route_incoming_call(
        self, 
        phone_number: str, 
        call_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Route incoming call to the appropriate phone agent"""
        # Find agent for phone number
        for agent in self.agents.values():
            if agent.phone_number == phone_number:
                return await agent.handle_incoming_call(call_data)
        
        logger.error(f"❌ No agent found for phone number: {phone_number}")
        return {"action": "reject", "reason": "phone_not_found"}
    
    async def get_all_statuses(self) -> Dict[str, Any]:
        """Get status of all phone agents"""
        statuses = {}
        for phone_id, agent in self.agents.items():
            statuses[phone_id] = await agent.get_status()
        
        return {
            'business_id': self.business_id,
            'primary_phone_id': self.primary_phone_id,
            'total_phones': len(self.agents),
            'active_phones': sum(1 for a in self.agents.values() if a.is_active),
            'phone_statuses': statuses
        }
    
    async def cleanup(self):
        """Clean up all phone agents"""
        logger.info(f"🧹 Cleaning up all phone agents for business {self.business_id}")
        
        cleanup_tasks = [
            agent.cleanup() for agent in self.agents.values()
        ]
        await asyncio.gather(*cleanup_tasks)
        
        self.agents.clear()
        logger.info(f"✅ All phone agents cleaned up")