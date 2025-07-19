"""
Voice bot notification service for real-time settings updates
"""

import httpx
import json
import logging
from typing import Dict, Any, Optional
from os import getenv

logger = logging.getLogger(__name__)


class VoiceBotService:
    """Service for notifying voice bot of settings changes"""
    
    def __init__(self):
        self.voice_bot_url = getenv("VOICE_BOT_URL", "https://replytics-dhhf.onrender.com")
        self.timeout = 10.0
    
    async def notify_settings_change(self, business_id: str, settings: Dict[str, Any]) -> bool:
        """
        Notify voice bot service of settings changes via webhook
        
        Args:
            business_id: ID of the business whose settings changed
            settings: Updated voice settings
            
        Returns:
            bool: True if notification was successful, False otherwise
        """
        if not self.voice_bot_url:
            logger.warning("Voice bot URL not configured, skipping notification")
            return False
            
        webhook_url = f"{self.voice_bot_url}/api/v1/webhooks/settings-update"
        
        payload = {
            "business_id": business_id,
            "settings": settings,
            "timestamp": None  # Could add datetime.utcnow().isoformat()
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    logger.info(f"Successfully notified voice bot of settings change for business {business_id}")
                    return True
                else:
                    logger.warning(
                        f"Voice bot notification failed with status {response.status_code}: {response.text}"
                    )
                    return False
                    
        except httpx.TimeoutException:
            logger.error(f"Timeout while notifying voice bot for business {business_id}")
            return False
        except Exception as e:
            logger.error(f"Error notifying voice bot for business {business_id}: {str(e)}")
            return False
    
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
        if not self.voice_bot_url:
            logger.warning("Voice bot URL not configured, skipping notification")
            return False
            
        webhook_url = f"{self.voice_bot_url}/api/v1/webhooks/rules-update"
        
        payload = {
            "business_id": business_id,
            "rules": rules,
            "timestamp": None  # Could add datetime.utcnow().isoformat()
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    logger.info(f"Successfully notified voice bot of rules change for business {business_id}")
                    return True
                else:
                    logger.warning(
                        f"Voice bot rules notification failed with status {response.status_code}: {response.text}"
                    )
                    return False
                    
        except httpx.TimeoutException:
            logger.error(f"Timeout while notifying voice bot of rules change for business {business_id}")
            return False
        except Exception as e:
            logger.error(f"Error notifying voice bot of rules change for business {business_id}: {str(e)}")
            return False