"""
Supabase service for database operations
"""

from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from config.settings import get_settings
import logging

logger = logging.getLogger(__name__)


class SupabaseService:
    """Service for interacting with Supabase"""
    
    def __init__(self):
        self.settings = get_settings()
        self.client: Optional[Client] = None
    
    async def initialize(self):
        """Initialize Supabase client"""
        try:
            self.client = create_client(
                self.settings.SUPABASE_URL,
                self.settings.SUPABASE_SERVICE_ROLE_KEY
            )
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise
    
    async def close(self):
        """Close Supabase connection"""
        # Supabase client doesn't require explicit closing
        pass
    
    async def health_check(self) -> bool:
        """Check if Supabase is accessible"""
        try:
            # Try a simple query
            result = self.client.table('users').select('id').limit(1).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase health check failed: {e}")
            return False
    
    # User operations
    async def create_user(self, email: str, password_hash: str, name: str) -> Dict[str, Any]:
        """Create a new user"""
        try:
            result = self.client.table('users').insert({
                'email': email,
                'password_hash': password_hash,
                'name': name
            }).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to create user: {e}")
            raise
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        try:
            result = self.client.table('users').select('*').eq('email', email).single().execute()
            return result.data
        except Exception as e:
            logger.error(f"Failed to get user by email: {e}")
            return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            result = self.client.table('users').select('*').eq('id', user_id).single().execute()
            return result.data
        except Exception as e:
            logger.error(f"Failed to get user by ID: {e}")
            return None
    
    # Business profile operations
    async def get_business_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get business profile for user"""
        try:
            result = self.client.table('business_profiles').select('*').eq('user_id', user_id).single().execute()
            return result.data
        except Exception as e:
            logger.error(f"Failed to get business profile: {e}")
            return None
    
    async def update_business_profile(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update business profile"""
        try:
            result = self.client.table('business_profiles').update(updates).eq('user_id', user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to update business profile: {e}")
            raise
    
    # Voice settings operations
    async def get_voice_settings(self, business_id: str) -> Optional[Dict[str, Any]]:
        """Get voice settings for business"""
        try:
            result = self.client.table('voice_settings').select('*').eq('business_id', business_id).single().execute()
            return result.data
        except Exception as e:
            logger.error(f"Failed to get voice settings: {e}")
            return None
    
    async def update_voice_settings(self, business_id: str, settings: Dict[str, Any]) -> Dict[str, Any]:
        """Update voice settings"""
        try:
            result = self.client.table('voice_settings').upsert({
                'business_id': business_id,
                **settings
            }).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to update voice settings: {e}")
            raise
    
    # Services operations
    async def get_services(self, business_id: str, include_inactive: bool = False) -> List[Dict[str, Any]]:
        """Get services for business"""
        try:
            query = self.client.table('services').select('*').eq('business_id', business_id)
            if not include_inactive:
                query = query.eq('is_active', True)
            result = query.order('display_order').execute()
            return result.data
        except Exception as e:
            logger.error(f"Failed to get services: {e}")
            return []
    
    async def create_service(self, business_id: str, service_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new service"""
        try:
            result = self.client.table('services').insert({
                'business_id': business_id,
                **service_data
            }).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to create service: {e}")
            raise
    
    # Analytics operations
    async def get_analytics_overview(self, business_id: str, start_date: str, end_date: str) -> Dict[str, Any]:
        """Get analytics overview for date range"""
        try:
            # Get call stats
            calls_result = self.client.table('calls').select('*').eq('business_id', business_id)\
                .gte('created_at', start_date).lte('created_at', end_date).execute()
            
            # Get SMS stats
            sms_result = self.client.table('sms_messages').select('*').eq('business_id', business_id)\
                .gte('created_at', start_date).lte('created_at', end_date).execute()
            
            # Calculate metrics
            total_calls = len(calls_result.data) if calls_result.data else 0
            answered_calls = len([c for c in (calls_result.data or []) if c.get('status') == 'completed'])
            total_sms = len(sms_result.data) if sms_result.data else 0
            
            return {
                'totalCalls': total_calls,
                'answeredCalls': answered_calls,
                'missedCalls': total_calls - answered_calls,
                'totalSMS': total_sms,
                'avgCallDuration': 0,  # Calculate from data
                'bookingsToday': 0,    # Calculate from data
                'callsToday': 0,       # Calculate from data
                'smsToday': 0          # Calculate from data
            }
        except Exception as e:
            logger.error(f"Failed to get analytics: {e}")
            raise
    
    # Customer operations
    async def get_customers(self, business_id: str, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Get customers with filtering and pagination"""
        try:
            query = self.client.table('customers').select('*').eq('business_id', business_id)
            
            # Apply filters
            if filters.get('search'):
                search_term = f"%{filters['search']}%"
                query = query.or_(f"first_name.ilike.{search_term},last_name.ilike.{search_term},phone.ilike.{search_term}")
            
            if filters.get('segment'):
                query = query.eq('segment', filters['segment'])
            
            # Pagination
            page = filters.get('page', 1)
            page_size = filters.get('pageSize', 10)
            offset = (page - 1) * page_size
            
            # Get total count
            count_result = self.client.table('customers').select('id', count='exact').eq('business_id', business_id).execute()
            total = count_result.count if count_result else 0
            
            # Get paginated results
            result = query.range(offset, offset + page_size - 1).execute()
            
            return {
                'customers': result.data or [],
                'total': total
            }
        except Exception as e:
            logger.error(f"Failed to get customers: {e}")
            raise