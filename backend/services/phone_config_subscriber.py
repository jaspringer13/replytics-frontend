"""
Phone Configuration Subscriber Service
Allows voice agents to subscribe to real-time configuration updates for specific phone numbers
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Any, Callable, Optional, Set
from dataclasses import dataclass, field

from supabase import AsyncClient
from backend.core.config import settings
from backend.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)


@dataclass
class PhoneConfigSubscription:
    """Represents a subscription to phone configuration updates"""
    phone_id: str
    business_id: str
    callbacks: Dict[str, Callable[[Dict[str, Any]], None]] = field(default_factory=dict)
    active: bool = True
    last_update: Optional[datetime] = None


class PhoneConfigSubscriber:
    """
    Service for subscribing to phone-specific configuration updates
    Used by voice agents to receive real-time configuration changes
    """
    
    def __init__(self, supabase_service: SupabaseService):
        self.supabase = supabase_service
        self.subscriptions: Dict[str, PhoneConfigSubscription] = {}
        self.channels: Dict[str, Any] = {}
        self._running = False
        self._tasks: Set[asyncio.Task] = set()
    
    async def subscribe_to_phone(
        self,
        phone_id: str,
        business_id: str,
        callbacks: Dict[str, Callable[[Dict[str, Any]], None]]
    ) -> PhoneConfigSubscription:
        """
        Subscribe to configuration updates for a specific phone number
        
        Args:
            phone_id: The phone number ID to subscribe to
            business_id: The business ID that owns the phone
            callbacks: Dictionary of event names to callback functions
                - voice_settings_updated: Called when voice settings change
                - conversation_rules_updated: Called when conversation rules change
                - operating_hours_updated: Called when operating hours change
                - settings_updated: Called for any settings update
        
        Returns:
            PhoneConfigSubscription object
        """
        subscription_key = f"{business_id}:{phone_id}"
        
        # Create subscription
        subscription = PhoneConfigSubscription(
            phone_id=phone_id,
            business_id=business_id,
            callbacks=callbacks
        )
        self.subscriptions[subscription_key] = subscription
        
        # Set up real-time channel
        await self._setup_phone_channel(phone_id, subscription)
        
        # Also subscribe to business-wide updates
        await self._setup_business_channel(business_id)
        
        logger.info(f"✅ Subscribed to phone config updates: {phone_id}")
        return subscription
    
    async def _setup_phone_channel(
        self,
        phone_id: str,
        subscription: PhoneConfigSubscription
    ):
        """Set up real-time channel for phone-specific updates"""
        channel_key = f"phone:{phone_id}"
        
        # Create channel if not exists
        if channel_key not in self.channels:
            channel = self.supabase.client.channel(channel_key)
            
            # Voice settings handler
            async def on_voice_settings(payload: Dict[str, Any]):
                logger.info(f"📡 Voice settings update for phone {phone_id}: {payload}")
                if 'voice_settings_updated' in subscription.callbacks:
                    subscription.callbacks['voice_settings_updated'](payload)
                subscription.last_update = datetime.utcnow()
            
            # Conversation rules handler
            async def on_conversation_rules(payload: Dict[str, Any]):
                logger.info(f"📡 Conversation rules update for phone {phone_id}: {payload}")
                if 'conversation_rules_updated' in subscription.callbacks:
                    subscription.callbacks['conversation_rules_updated'](payload)
                subscription.last_update = datetime.utcnow()
            
            # Operating hours handler
            async def on_operating_hours(payload: Dict[str, Any]):
                logger.info(f"📡 Operating hours update for phone {phone_id}: {payload}")
                if 'operating_hours_updated' in subscription.callbacks:
                    subscription.callbacks['operating_hours_updated'](payload)
                subscription.last_update = datetime.utcnow()
            
            # Generic settings handler
            async def on_settings_update(payload: Dict[str, Any]):
                logger.info(f"📡 Settings update for phone {phone_id}: {payload}")
                if 'settings_updated' in subscription.callbacks:
                    subscription.callbacks['settings_updated'](payload)
                subscription.last_update = datetime.utcnow()
            
            # Subscribe to events
            channel.on('phone_voice_settings_updated', on_voice_settings)
            channel.on('phone_conversation_rules_updated', on_conversation_rules)
            channel.on('phone_operating_hours_updated', on_operating_hours)
            channel.on('phone_settings_updated', on_settings_update)
            
            # Subscribe to channel
            await channel.subscribe()
            self.channels[channel_key] = channel
    
    async def _setup_business_channel(self, business_id: str):
        """Set up real-time channel for business-wide updates"""
        channel_key = f"business:{business_id}"
        
        if channel_key not in self.channels:
            channel = self.supabase.client.channel(channel_key)
            
            # Primary phone change handler
            async def on_primary_changed(payload: Dict[str, Any]):
                logger.info(f"📡 Primary phone changed for business {business_id}: {payload}")
                # Notify all phone subscriptions for this business
                for key, sub in self.subscriptions.items():
                    if sub.business_id == business_id and 'primary_phone_changed' in sub.callbacks:
                        sub.callbacks['primary_phone_changed'](payload)
            
            channel.on('primary_phone_changed', on_primary_changed)
            await channel.subscribe()
            self.channels[channel_key] = channel
    
    async def unsubscribe_from_phone(self, phone_id: str, business_id: str):
        """Unsubscribe from phone configuration updates"""
        subscription_key = f"{business_id}:{phone_id}"
        
        if subscription_key in self.subscriptions:
            del self.subscriptions[subscription_key]
            
            # Check if we need to remove the channel
            channel_key = f"phone:{phone_id}"
            phone_still_subscribed = any(
                sub.phone_id == phone_id 
                for sub in self.subscriptions.values()
            )
            
            if not phone_still_subscribed and channel_key in self.channels:
                await self.supabase.client.remove_channel(self.channels[channel_key])
                del self.channels[channel_key]
                logger.info(f"🔌 Unsubscribed from phone channel: {phone_id}")
    
    async def get_current_config(self, phone_id: str) -> Dict[str, Any]:
        """
        Fetch the current configuration for a phone number
        
        Returns:
            Dictionary containing all phone settings
        """
        result = await self.supabase.client.table('phone_numbers')\
            .select('*')\
            .eq('id', phone_id)\
            .single()\
            .execute()
        
        if result.data:
            return {
                'voice_settings': result.data.get('voice_settings', {}),
                'conversation_rules': result.data.get('conversation_rules', {}),
                'operating_hours': result.data.get('operating_hours', []),
                'sms_settings': {
                    'enabled': result.data.get('sms_enabled', True),
                    'reminder_hours': result.data.get('sms_reminder_hours', 24)
                },
                'timezone': result.data.get('timezone', 'America/New_York'),
                'is_active': result.data.get('status') == 'active',
                'is_primary': result.data.get('is_primary', False)
            }
        
        return {}
    
    async def broadcast_config_received(self, phone_id: str, config_type: str):
        """
        Broadcast confirmation that configuration was received and applied
        This helps with monitoring and debugging
        """
        channel = self.supabase.client.channel(f"phone:{phone_id}")
        await channel.subscribe()
        
        try:
            await channel.send({
                'type': 'broadcast',
                'event': 'config_applied_confirmation',
                'payload': {
                    'phone_id': phone_id,
                    'config_type': config_type,
                    'applied_at': datetime.utcnow().isoformat(),
                    'agent_id': settings.AGENT_ID  # Identify which agent applied the config
                }
            })
        finally:
            await self.supabase.client.remove_channel(channel)
    
    async def cleanup(self):
        """Clean up all subscriptions and channels"""
        logger.info("🧹 Cleaning up phone config subscriptions...")
        
        # Cancel all tasks
        for task in self._tasks:
            if not task.done():
                task.cancel()
        
        # Remove all channels
        for channel in self.channels.values():
            await self.supabase.client.remove_channel(channel)
        
        self.channels.clear()
        self.subscriptions.clear()
        self._running = False


# Example usage in voice agent
async def example_voice_agent_usage():
    """Example of how a voice agent would use this service"""
    
    # Initialize services
    supabase_service = SupabaseService()
    config_subscriber = PhoneConfigSubscriber(supabase_service)
    
    # Define callbacks for configuration updates
    async def on_voice_settings_update(payload: Dict[str, Any]):
        """Handle voice settings update"""
        new_voice_id = payload.get('settings', {}).get('voiceId')
        if new_voice_id:
            logger.info(f"🎤 Switching to voice: {new_voice_id}")
            # Update voice synthesis engine with new voice
            # voice_engine.set_voice(new_voice_id)
    
    async def on_conversation_rules_update(payload: Dict[str, Any]):
        """Handle conversation rules update"""
        new_rules = payload.get('rules', {})
        logger.info(f"📋 Updating conversation rules: {new_rules}")
        # Update conversation handler with new rules
        # conversation_handler.update_rules(new_rules)
    
    async def on_operating_hours_update(payload: Dict[str, Any]):
        """Handle operating hours update"""
        new_hours = payload.get('operatingHours', [])
        timezone = payload.get('timezone', 'America/New_York')
        logger.info(f"🕐 Updating operating hours for timezone {timezone}")
        # Update scheduling logic
        # scheduler.update_hours(new_hours, timezone)
    
    # Subscribe to phone configuration updates
    phone_id = "test-phone-123"
    business_id = "test-business-456"
    
    subscription = await config_subscriber.subscribe_to_phone(
        phone_id=phone_id,
        business_id=business_id,
        callbacks={
            'voice_settings_updated': on_voice_settings_update,
            'conversation_rules_updated': on_conversation_rules_update,
            'operating_hours_updated': on_operating_hours_update
        }
    )
    
    # Get initial configuration
    initial_config = await config_subscriber.get_current_config(phone_id)
    logger.info(f"📱 Initial phone config: {initial_config}")
    
    # Simulate agent running
    try:
        logger.info("🤖 Voice agent running with real-time config updates...")
        # Keep the agent running
        await asyncio.sleep(3600)  # Run for 1 hour
    finally:
        # Clean up when shutting down
        await config_subscriber.cleanup()