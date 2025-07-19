"""
Voice bot notification service for real-time settings updates
"""

import httpx
import logging
from typing import Dict, Any
from os import getenv
from datetime import datetime

logger = logging.getLogger(__name__)


class VoiceBotService:
    """Service for notifying voice bot of settings changes"""
    
    def __init__(self):
        self.voice_bot_url = getenv("VOICE_BOT_URL", "https://replytics-dhhf.onrender.com")
        self.timeout = 10.0
    
    async def _send_notification(
        self, 
        endpoint: str, 
        business_id: str, 
        data: Dict[str, Any],
        data_type: str
    ) -> bool:
        """Common notification logic"""
        if not self.voice_bot_url:
            logger.warning("Voice bot URL not configured, skipping notification")
            return False
            
        webhook_url = f"{self.voice_bot_url}{endpoint}"
        payload = {
            "business_id": business_id,
            data_type: data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    logger.info(f"Successfully notified voice bot of {data_type} change for business {business_id}")
                    return True
                else:
                    logger.warning(
                        f"Voice bot {data_type} notification failed with status {response.status_code}: {response.text}"
                    )
                    return False
                    
        except httpx.TimeoutException:
            logger.error(f"Timeout while notifying voice bot of {data_type} change for business {business_id}")
            return False
        except Exception as e:
            logger.error(f"Error notifying voice bot of {data_type} change for business {business_id}: {str(e)}")
            return False
    
    async def notify_settings_change(self, business_id: str, settings: Dict[str, Any]) -> bool:
        """
        Notify voice bot service of settings changes via webhook
        
        Args:
            business_id: ID of the business whose settings changed
            settings: Updated voice settings
            
        Returns:
            bool: True if notification was successful, False otherwise
        """
        return await self._send_notification(
            "/api/v1/webhooks/settings-update",
            business_id,
            settings,
            "settings"
        )
    
    async def notify_conversation_rules_change(
        self, 
        business_id: str, 
        rules: Dict[str, Any]
    ) -> bool:
        """
        Notify voice bot service of conversation rules changes
        
        Args:
            business_id: ID of the business whose rules changed
            rules: Updated conversation rules
            
        Returns:
            bool: True if notification was successful, False otherwise
        """
        return await self._send_notification(
            "/api/v1/webhooks/rules-update",
            business_id,
            rules,
            "rules"
        )