"""
Voice Bot API Client with JWT authentication, caching, and retry logic.

This module provides a production-grade client for interacting with the Voice Bot API,
featuring comprehensive error handling, intelligent caching, and robust retry mechanisms.
"""

import asyncio
import hashlib
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, TypeVar, Generic

import httpx
import jwt
from pydantic import BaseModel
from redis import Redis
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from config.settings import get_settings

# Setup logging
logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

settings = get_settings()


class VoiceBotConfig(BaseModel):
    """Voice Bot API configuration with validation."""
    base_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 30
    internal_service_token: Optional[str] = None
    timeout: int = 30
    max_retries: int = 3
    cache_ttl: int = 300  # 5 minutes

    class Config:
        frozen = True  # Make immutable


class CachedResponse(BaseModel, Generic[T]):
    """Cached API response with metadata."""
    data: Dict[str, Any]
    cached_at: datetime
    expires_at: datetime
    etag: Optional[str] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class VoiceBotAPIError(Exception):
    """Custom exception for Voice Bot API errors."""
    
    def __init__(self, message: str, status_code: Optional[int] = None, response_data: Optional[Dict] = None):
        self.message = message
        self.status_code = status_code
        self.response_data = response_data
        super().__init__(self.message)


class VoiceBotClient:
    """
    Production-grade Voice Bot API client.
    
    Features:
    - JWT authentication with automatic token refresh
    - Redis-based response caching with TTL
    - Automatic retry logic with exponential backoff
    - Connection pooling for optimal performance
    - Comprehensive error handling and logging
    - Thread-safe singleton pattern
    """

    def __init__(
        self,
        config: VoiceBotConfig,
        redis_client: Optional[Redis] = None,
        http_client: Optional[httpx.AsyncClient] = None
    ):
        self.config = config
        self.redis = redis_client
        self._http_client = http_client
        self._jwt_token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None
        self._lock = asyncio.Lock()  # For thread-safe token refresh

    @property
    async def http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client with optimized connection pooling."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(
                base_url=self.config.base_url,
                timeout=httpx.Timeout(self.config.timeout),
                limits=httpx.Limits(
                    max_keepalive_connections=10,
                    max_connections=20,
                    keepalive_expiry=30.0
                ),
                headers={
                    "User-Agent": "Replytics-Dashboard/1.0",
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            )
            logger.info("Initialized HTTP client for Voice Bot API")
        return self._http_client

    def _generate_jwt_token(self) -> str:
        """Generate JWT token for Voice Bot authentication with proper claims."""
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=self.config.jwt_expire_minutes)

        payload = {
            "sub": "dashboard-api",
            "iat": int(now.timestamp()),
            "exp": int(expires_at.timestamp()),
            "type": "service",
            "permissions": ["dashboard:read", "dashboard:write"],
            "iss": "replytics-dashboard"
        }

        token = jwt.encode(
            payload,
            self.config.jwt_secret,
            algorithm=self.config.jwt_algorithm
        )

        self._token_expires_at = expires_at
        logger.info(f"Generated new JWT token, expires at {expires_at.isoformat()}")
        return token

    async def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers with automatic token refresh."""
        async with self._lock:  # Thread-safe token refresh
            # Check if token needs refresh (refresh 5 minutes before expiry)
            needs_refresh = (
                self._jwt_token is None or
                self._token_expires_at is None or
                datetime.now(timezone.utc) >= self._token_expires_at - timedelta(minutes=5)
            )
            
            if needs_refresh:
                self._jwt_token = self._generate_jwt_token()
                logger.debug("JWT token refreshed")

        headers = {
            "Authorization": f"Bearer {self._jwt_token}"
        }
        
        # Add internal service token if available
        if self.config.internal_service_token:
            headers["X-Service-Token"] = self.config.internal_service_token
            
        return headers

    def _cache_key(self, endpoint: str, params: Optional[Dict] = None) -> str:
        """Generate deterministic cache key for endpoint and parameters."""
        key_parts = [f"voice_bot:{endpoint.replace('/', ':')}"]
        
        if params:
            # Sort params for consistent cache keys
            sorted_params = json.dumps(params, sort_keys=True, default=str)
            param_hash = hashlib.md5(sorted_params.encode()).hexdigest()[:12]
            key_parts.append(param_hash)
            
        cache_key = ":".join(key_parts)
        logger.debug(f"Generated cache key: {cache_key}")
        return cache_key

    async def _get_cached(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached response if available and not expired."""
        if not self.redis:
            return None

        try:
            cached_data = await asyncio.to_thread(self.redis.get, cache_key)
            if cached_data:
                cached_response = CachedResponse.parse_raw(cached_data)
                
                # Check if cache is still valid
                if datetime.now(timezone.utc) < cached_response.expires_at:
                    logger.debug(f"Cache hit for {cache_key}")
                    return cached_response.data
                else:
                    # Remove expired cache
                    await asyncio.to_thread(self.redis.delete, cache_key)
                    logger.debug(f"Removed expired cache for {cache_key}")
                    
        except Exception as e:
            logger.warning(f"Cache retrieval error for {cache_key}: {e}")

        return None

    async def _set_cached(
        self, 
        cache_key: str, 
        data: Dict[str, Any],
        ttl: Optional[int] = None
    ) -> None:
        """Store response in cache with TTL."""
        if not self.redis:
            return

        try:
            ttl = ttl or self.config.cache_ttl
            now = datetime.now(timezone.utc)
            
            cached_response = CachedResponse(
                data=data,
                cached_at=now,
                expires_at=now + timedelta(seconds=ttl)
            )
            
            await asyncio.to_thread(
                self.redis.setex,
                cache_key,
                ttl,
                cached_response.json()
            )
            logger.debug(f"Cached response for {cache_key} (TTL: {ttl}s)")
            
        except Exception as e:
            logger.warning(f"Cache storage error for {cache_key}: {e}")

    @retry(
        retry=retry_if_exception_type((httpx.HTTPError, httpx.TimeoutException)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        json_data: Optional[Dict] = None,
        use_cache: bool = True,
        cache_ttl: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Make HTTP request with comprehensive error handling, retry logic, and caching.
        
        Args:
            method: HTTP method (GET, POST, PATCH, etc.)
            endpoint: API endpoint path
            params: Query parameters
            json_data: Request body data
            use_cache: Whether to use caching for GET requests
            cache_ttl: Custom cache TTL override
            
        Returns:
            Response data as dictionary
            
        Raises:
            VoiceBotAPIError: On API errors or network failures
        """
        # Check cache for GET requests
        cache_key = None
        if method == "GET" and use_cache:
            cache_key = self._cache_key(endpoint, params)
            cached_data = await self._get_cached(cache_key)
            if cached_data:
                return cached_data

        # Prepare request
        client = await self.http_client
        headers = await self._get_auth_headers()

        # Log request details
        logger.info(f"Voice Bot API: {method} {endpoint}")
        if params:
            logger.debug(f"Request params: {params}")
        if json_data:
            logger.debug(f"Request data keys: {list(json_data.keys()) if json_data else None}")

        try:
            response = await client.request(
                method=method,
                url=endpoint,
                params=params,
                json=json_data,
                headers=headers
            )
            
            # Log response status
            logger.debug(f"Response status: {response.status_code}")
            
            # Handle different response status codes
            if response.status_code == 401:
                # Clear cached token on auth failure
                async with self._lock:
                    self._jwt_token = None
                    self._token_expires_at = None
                logger.warning("Authentication failed, cleared cached token")
                raise VoiceBotAPIError(
                    "Authentication failed", 
                    status_code=401,
                    response_data={"error": "Invalid or expired token"}
                )
            
            elif response.status_code == 404:
                error_data = response.json() if response.content else {}
                raise VoiceBotAPIError(
                    f"Endpoint not found: {endpoint}",
                    status_code=404,
                    response_data=error_data
                )
            
            elif response.status_code >= 400:
                error_data = response.json() if response.content else {}
                error_message = error_data.get('detail', error_data.get('message', 'API request failed'))
                raise VoiceBotAPIError(
                    f"API error: {error_message}",
                    status_code=response.status_code,
                    response_data=error_data
                )

            # Parse successful response
            response.raise_for_status()
            data = response.json()
            
            logger.info(f"Successful API call: {method} {endpoint}")

            # Cache successful GET responses
            if method == "GET" and use_cache and cache_key:
                await self._set_cached(cache_key, data, cache_ttl)

            return data

        except httpx.HTTPStatusError as e:
            error_message = f"HTTP {e.response.status_code} error for {method} {endpoint}"
            logger.error(f"{error_message}: {e.response.text}")
            
            try:
                error_data = e.response.json()
            except (json.JSONDecodeError, AttributeError):
                error_data = {"error": e.response.text}
                
            raise VoiceBotAPIError(
                error_message,
                status_code=e.response.status_code,
                response_data=error_data
            ) from e
            
        except httpx.TimeoutException as e:
            error_message = f"Timeout error for {method} {endpoint}"
            logger.error(error_message)
            raise VoiceBotAPIError(error_message, response_data={"error": "Request timeout"}) from e
            
        except Exception as e:
            error_message = f"Unexpected error for {method} {endpoint}: {str(e)}"
            logger.error(error_message, exc_info=True)
            raise VoiceBotAPIError(error_message, response_data={"error": str(e)}) from e

    # =============================================================================
    # BUSINESS MANAGEMENT ENDPOINTS
    # =============================================================================

    async def get_business_profile(self, business_id: str) -> Dict[str, Any]:
        """
        Get business profile information from Voice Bot.
        
        Args:
            business_id: The business identifier
            
        Returns:
            Business profile data
        """
        return await self._make_request(
            "GET",
            "/api/v2/dashboard/business",
            params={"business_id": business_id},
            cache_ttl=600  # Cache for 10 minutes
        )

    async def update_business_profile(
        self, 
        business_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update business profile in Voice Bot.
        
        Args:
            business_id: The business identifier
            updates: Profile data to update
            
        Returns:
            Updated business profile data
        """
        return await self._make_request(
            "PATCH",
            "/api/v2/dashboard/business",
            params={"business_id": business_id},
            json_data=updates,
            use_cache=False
        )

    # =============================================================================
    # SERVICES MANAGEMENT ENDPOINTS
    # =============================================================================

    async def get_services(
        self, 
        business_id: str,
        include_inactive: bool = False
    ) -> Dict[str, Any]:
        """
        Get all services for a business from Voice Bot.
        
        Args:
            business_id: The business identifier
            include_inactive: Whether to include inactive services
            
        Returns:
            Services data with list and metadata
        """
        return await self._make_request(
            "GET",
            "/api/v2/dashboard/services",
            params={
                "business_id": business_id,
                "include_inactive": include_inactive
            },
            cache_ttl=300  # Cache for 5 minutes
        )

    async def create_service(
        self,
        business_id: str,
        service_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create a new service in Voice Bot.
        
        Args:
            business_id: The business identifier
            service_data: Service creation data
            
        Returns:
            Created service data with service_id
        """
        return await self._make_request(
            "POST",
            "/api/v2/dashboard/services",
            params={"business_id": business_id},
            json_data=service_data,
            use_cache=False
        )

    async def update_service(
        self,
        business_id: str,
        service_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update an existing service in Voice Bot.
        
        Args:
            business_id: The business identifier
            service_id: The service identifier
            updates: Service data to update
            
        Returns:
            Update confirmation
        """
        return await self._make_request(
            "PATCH",
            f"/api/v2/dashboard/services/{service_id}",
            params={"business_id": business_id},
            json_data=updates,
            use_cache=False
        )

    async def delete_service(
        self,
        business_id: str,
        service_id: str
    ) -> Dict[str, Any]:
        """
        Delete a service from Voice Bot.
        
        Args:
            business_id: The business identifier
            service_id: The service identifier
            
        Returns:
            Deletion confirmation
        """
        return await self._make_request(
            "DELETE",
            f"/api/v2/dashboard/services/{service_id}",
            params={"business_id": business_id},
            use_cache=False
        )

    async def reorder_services(
        self,
        business_id: str,
        service_ids: List[str]
    ) -> Dict[str, Any]:
        """
        Reorder services in Voice Bot.
        
        Args:
            business_id: The business identifier
            service_ids: Ordered list of service IDs
            
        Returns:
            Reorder confirmation
        """
        return await self._make_request(
            "POST",
            "/api/v2/dashboard/services/reorder",
            params={"business_id": business_id},
            json_data={"service_ids": service_ids},
            use_cache=False
        )

    async def apply_service_template(
        self,
        business_id: str,
        template_name: str
    ) -> Dict[str, Any]:
        """
        Apply a service template to business.
        
        Args:
            business_id: The business identifier
            template_name: Name of the template to apply
            
        Returns:
            Template application result
        """
        return await self._make_request(
            "POST",
            "/api/v2/dashboard/services/apply-template",
            params={"business_id": business_id},
            json_data={"template_name": template_name},
            use_cache=False
        )

    # =============================================================================
    # BUSINESS HOURS ENDPOINTS
    # =============================================================================

    async def get_business_hours(self, business_id: str) -> Dict[str, Any]:
        """
        Get business operating hours from Voice Bot.
        
        Args:
            business_id: The business identifier
            
        Returns:
            Business hours data
        """
        return await self._make_request(
            "GET",
            "/api/v2/dashboard/hours",
            params={"business_id": business_id},
            cache_ttl=600  # Cache for 10 minutes
        )

    async def update_business_hours(
        self,
        business_id: str,
        hours: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update business operating hours in Voice Bot.
        
        Args:
            business_id: The business identifier
            hours: Hours data to update
            
        Returns:
            Update confirmation
        """
        return await self._make_request(
            "PUT",
            "/api/v2/dashboard/hours",
            params={"business_id": business_id},
            json_data=hours,
            use_cache=False
        )

    async def add_holiday(
        self,
        business_id: str,
        holiday_date: str,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Add a holiday to business hours.
        
        Args:
            business_id: The business identifier
            holiday_date: Date in YYYY-MM-DD format
            description: Optional holiday description
            
        Returns:
            Holiday addition confirmation
        """
        return await self._make_request(
            "POST",
            "/api/v2/dashboard/holidays",
            params={"business_id": business_id},
            json_data={
                "date": holiday_date,
                "description": description
            },
            use_cache=False
        )

    async def remove_holiday(
        self,
        business_id: str,
        holiday_date: str
    ) -> Dict[str, Any]:
        """
        Remove a holiday from business hours.
        
        Args:
            business_id: The business identifier
            holiday_date: Date in YYYY-MM-DD format
            
        Returns:
            Holiday removal confirmation
        """
        return await self._make_request(
            "DELETE",
            f"/api/v2/dashboard/holidays/{holiday_date}",
            params={"business_id": business_id},
            use_cache=False
        )

    # =============================================================================
    # AI PROMPTS ENDPOINTS
    # =============================================================================

    async def get_prompts(self, business_id: str) -> Dict[str, Any]:
        """
        Get AI prompt templates from Voice Bot.
        
        Args:
            business_id: The business identifier
            
        Returns:
            AI prompts data
        """
        return await self._make_request(
            "GET",
            "/api/v2/dashboard/prompts",
            params={"business_id": business_id},
            cache_ttl=300  # Cache for 5 minutes
        )

    async def update_prompts(
        self,
        business_id: str,
        prompts: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update AI prompts in Voice Bot.
        
        Args:
            business_id: The business identifier
            prompts: Prompts data to update
            
        Returns:
            Update confirmation
        """
        return await self._make_request(
            "PATCH",
            "/api/v2/dashboard/prompts",
            params={"business_id": business_id},
            json_data=prompts,
            use_cache=False
        )

    # =============================================================================
    # SMS CONFIGURATION ENDPOINTS
    # =============================================================================

    async def get_sms_config(self, business_id: str) -> Dict[str, Any]:
        """
        Get SMS configuration from Voice Bot.
        
        Args:
            business_id: The business identifier
            
        Returns:
            SMS configuration data
        """
        return await self._make_request(
            "GET",
            "/api/v2/dashboard/sms",
            params={"business_id": business_id},
            cache_ttl=300  # Cache for 5 minutes
        )

    async def update_sms_config(
        self,
        business_id: str,
        sms_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update SMS configuration in Voice Bot.
        
        Args:
            business_id: The business identifier
            sms_config: SMS configuration to update
            
        Returns:
            Update confirmation
        """
        return await self._make_request(
            "PATCH",
            "/api/v2/dashboard/sms",
            params={"business_id": business_id},
            json_data=sms_config,
            use_cache=False
        )

    # =============================================================================
    # INTEGRATIONS ENDPOINTS
    # =============================================================================

    async def get_integrations(self, business_id: str) -> Dict[str, Any]:
        """
        Get integration status from Voice Bot.
        
        Args:
            business_id: The business identifier
            
        Returns:
            Integrations status data
        """
        return await self._make_request(
            "GET",
            "/api/v2/dashboard/integrations",
            params={"business_id": business_id},
            cache_ttl=180  # Cache for 3 minutes
        )

    # =============================================================================
    # STAFF MANAGEMENT ENDPOINTS
    # =============================================================================

    async def get_staff(self, business_id: str) -> Dict[str, Any]:
        """
        Get staff members from Voice Bot.
        
        Args:
            business_id: The business identifier
            
        Returns:
            Staff members data
        """
        return await self._make_request(
            "GET",
            "/api/v2/dashboard/staff",
            params={"business_id": business_id},
            cache_ttl=300  # Cache for 5 minutes
        )

    async def add_staff(
        self,
        business_id: str,
        staff_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Add a staff member in Voice Bot.
        
        Args:
            business_id: The business identifier
            staff_data: Staff member data
            
        Returns:
            Created staff member data
        """
        return await self._make_request(
            "POST",
            "/api/v2/dashboard/staff",
            params={"business_id": business_id},
            json_data=staff_data,
            use_cache=False
        )

    async def update_staff(
        self,
        business_id: str,
        staff_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update a staff member in Voice Bot.
        
        Args:
            business_id: The business identifier
            staff_id: The staff member identifier
            updates: Staff data to update
            
        Returns:
            Update confirmation
        """
        return await self._make_request(
            "PATCH",
            f"/api/v2/dashboard/staff/{staff_id}",
            params={"business_id": business_id},
            json_data=updates,
            use_cache=False
        )

    # =============================================================================
    # ANALYTICS ENDPOINTS
    # =============================================================================

    async def get_analytics(
        self,
        business_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        metrics: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Get analytics data from Voice Bot.
        
        Args:
            business_id: The business identifier
            start_date: Start date for analytics (YYYY-MM-DD)
            end_date: End date for analytics (YYYY-MM-DD)
            metrics: Specific metrics to retrieve
            
        Returns:
            Analytics data
        """
        params = {"business_id": business_id}
        
        if start_date:
            params["start_date"] = start_date
        if end_date:
            params["end_date"] = end_date
        if metrics:
            params["metrics"] = ",".join(metrics)

        return await self._make_request(
            "GET",
            "/api/v2/dashboard/analytics",
            params=params,
            cache_ttl=120  # Short cache for analytics (2 minutes)
        )

    # =============================================================================
    # CONFIGURATION ENDPOINTS
    # =============================================================================

    async def get_full_configuration(self, business_id: str) -> Dict[str, Any]:
        """
        Get full business configuration from Voice Bot.
        
        Args:
            business_id: The business identifier
            
        Returns:
            Complete business configuration
        """
        return await self._make_request(
            "GET",
            f"/api/v2/configuration/{business_id}",
            cache_ttl=300  # Cache for 5 minutes
        )

    # =============================================================================
    # RESOURCE MANAGEMENT
    # =============================================================================

    async def close(self) -> None:
        """Close HTTP client connections and cleanup resources."""
        if self._http_client:
            await self._http_client.aclose()
            logger.info("Closed Voice Bot API client connections")
            
        # Clear authentication state
        async with self._lock:
            self._jwt_token = None
            self._token_expires_at = None

    async def health_check(self) -> Dict[str, Any]:
        """
        Perform health check on Voice Bot API.
        
        Returns:
            Health status information
        """
        try:
            # Simple health check - try to get a minimal endpoint
            response = await self._make_request(
                "GET",
                "/",
                use_cache=False
            )
            return {
                "status": "healthy",
                "voice_bot": response,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"Voice Bot health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }


# =============================================================================
# SINGLETON FACTORY
# =============================================================================

_voice_bot_client: Optional[VoiceBotClient] = None
_client_lock = asyncio.Lock()


async def get_voice_bot_client() -> VoiceBotClient:
    """
    Get or create Voice Bot client singleton with proper configuration.
    
    This function ensures thread-safe singleton creation and proper
    resource management for the Voice Bot client.
    
    Returns:
        Configured VoiceBotClient instance
    """
    global _voice_bot_client

    async with _client_lock:
        if _voice_bot_client is None:
            # Create configuration from settings
            config = VoiceBotConfig(
                base_url=settings.VOICE_BOT_URL,
                jwt_secret=settings.VOICE_BOT_JWT_SECRET,
                jwt_algorithm=settings.VOICE_BOT_JWT_ALGORITHM,
                jwt_expire_minutes=settings.VOICE_BOT_JWT_EXPIRE_MINUTES,
                internal_service_token=settings.VOICE_BOT_INTERNAL_TOKEN,
                timeout=settings.VOICE_BOT_TIMEOUT,
                max_retries=settings.VOICE_BOT_MAX_RETRIES,
                cache_ttl=settings.VOICE_BOT_CACHE_TTL
            )

            # Initialize Redis client if URL is provided
            redis_client = None
            if settings.REDIS_URL:
                try:
                    from redis.asyncio import Redis as AsyncRedis
                    redis_client = AsyncRedis.from_url(
                        settings.REDIS_URL,
                        decode_responses=True,
                        socket_connect_timeout=5,
                        socket_timeout=5
                    )
                    # Test connection
                    await redis_client.ping()
                    logger.info("Redis client initialized and connected")
                except Exception as e:
                    logger.warning(f"Failed to initialize Redis client: {e}")
                    redis_client = None

            _voice_bot_client = VoiceBotClient(config, redis_client)
            logger.info("Voice Bot client singleton created successfully")

    return _voice_bot_client


async def close_voice_bot_client() -> None:
    """Close the Voice Bot client and cleanup resources."""
    global _voice_bot_client
    
    async with _client_lock:
        if _voice_bot_client:
            await _voice_bot_client.close()
            _voice_bot_client = None
            logger.info("Voice Bot client closed and cleaned up")