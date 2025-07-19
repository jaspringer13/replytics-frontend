"""
Voice Bot proxy endpoints with comprehensive error handling and request validation.

This module provides RESTful API endpoints that proxy requests to the Voice Bot service,
enabling the dashboard to manage business profiles, services, analytics, and configuration
through a unified interface with proper authentication and error handling.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field, validator
import logging

from api.dashboard.auth import get_current_user
from services.voice_bot_client import get_voice_bot_client, VoiceBotClient, VoiceBotAPIError
from services.supabase_service import SupabaseService

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter()


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class BusinessProfileUpdate(BaseModel):
    """Business profile update request model."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, pattern=r'^\+?[\d\s\-\(\)]{10,20}$')
    email: Optional[str] = Field(None, regex=r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
    timezone: Optional[str] = Field(None, description="IANA timezone identifier")
    industry: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=200)
    website: Optional[str] = Field(None, regex=r'^https?://.+')
    description: Optional[str] = Field(None, max_length=500)

    class Config:
        schema_extra = {
            "example": {
                "name": "Acme Hair Salon",
                "phone": "+1-555-123-4567",
                "email": "contact@acmehair.com",
                "timezone": "America/New_York",
                "industry": "Beauty & Wellness"
            }
        }


class ServiceCreate(BaseModel):
    """Service creation request model."""
    name: str = Field(..., min_length=1, max_length=100)
    display_name: str = Field(..., min_length=1, max_length=100)
    duration_minutes: int = Field(..., ge=5, le=480, description="Duration in minutes (5-480)")
    price: float = Field(..., ge=0, description="Price in dollars")
    description: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=50)
    active: bool = Field(True, description="Whether service is active")

    @validator('price')
    def validate_price(cls, v):
        """Validate price format (max 2 decimal places)."""
        if round(v, 2) != v:
            raise ValueError('Price cannot have more than 2 decimal places')
        return v

    class Config:
        schema_extra = {
            "example": {
                "name": "haircut",
                "display_name": "Haircut & Style",
                "duration_minutes": 60,
                "price": 45.00,
                "description": "Professional haircut with styling",
                "category": "Hair Services",
                "active": True
            }
        }


class ServiceUpdate(BaseModel):
    """Service update request model."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    duration_minutes: Optional[int] = Field(None, ge=5, le=480)
    price: Optional[float] = Field(None, ge=0)
    description: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=50)
    active: Optional[bool] = None

    @validator('price', pre=True, always=True)
    def validate_price(cls, v):
        """Validate price format if provided."""
        if v is not None and round(v, 2) != v:
            raise ValueError('Price cannot have more than 2 decimal places')
        return v


class ServiceReorder(BaseModel):
    """Service reorder request model."""
    service_ids: List[str] = Field(..., min_items=1, description="Ordered list of service IDs")

    @validator('service_ids')
    def validate_unique_ids(cls, v):
        """Ensure all service IDs are unique."""
        if len(v) != len(set(v)):
            raise ValueError('Service IDs must be unique')
        return v


class BusinessHours(BaseModel):
    """Business hours update request model."""
    monday: Optional[Dict[str, Any]] = None
    tuesday: Optional[Dict[str, Any]] = None
    wednesday: Optional[Dict[str, Any]] = None
    thursday: Optional[Dict[str, Any]] = None
    friday: Optional[Dict[str, Any]] = None
    saturday: Optional[Dict[str, Any]] = None
    sunday: Optional[Dict[str, Any]] = None
    timezone: Optional[str] = Field(None, description="IANA timezone identifier")
    
    class Config:
        schema_extra = {
            "example": {
                "monday": {"open": "09:00", "close": "17:00", "is_open": True},
                "tuesday": {"open": "09:00", "close": "17:00", "is_open": True},
                "timezone": "America/New_York"
            }
        }


class HolidayCreate(BaseModel):
    """Holiday creation request model."""
    date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$', description="Date in YYYY-MM-DD format")
    description: Optional[str] = Field(None, max_length=100)

    class Config:
        schema_extra = {
            "example": {
                "date": "2024-12-25",
                "description": "Christmas Day"
            }
        }


class AnalyticsQuery(BaseModel):
    """Analytics query parameters."""
    start_date: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    end_date: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    metrics: Optional[List[str]] = Field(None, description="Specific metrics to retrieve")
    granularity: Optional[str] = Field("day", regex=r'^(hour|day|week|month)$')


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

async def get_business_id_for_user(request: Request, user: dict) -> str:
    """
    Get business ID for the current user.
    
    Args:
        request: FastAPI request object
        user: Current authenticated user
        
    Returns:
        Business ID string
        
    Raises:
        HTTPException: If business profile not found
    """
    supabase: SupabaseService = request.app.state.supabase
    profile = await supabase.get_business_profile(user["id"])
    
    if not profile:
        logger.warning(f"Business profile not found for user {user['id']}")
        raise HTTPException(
            status_code=404,
            detail="Business profile not found. Please complete onboarding first."
        )
    
    return profile["id"]


def handle_voice_bot_error(error: Exception, operation: str) -> HTTPException:
    """
    Convert Voice Bot API errors to appropriate HTTP exceptions.
    
    Args:
        error: The caught exception
        operation: Description of the operation that failed
        
    Returns:
        HTTPException with appropriate status code and message
    """
    if isinstance(error, VoiceBotAPIError):
        # Map Voice Bot status codes to HTTP exceptions
        status_code = error.status_code or 500
        
        if status_code == 401:
            logger.error(f"Voice Bot authentication failed for {operation}")
            return HTTPException(
                status_code=502,
                detail="Voice Bot service authentication failed"
            )
        elif status_code == 404:
            logger.warning(f"Voice Bot resource not found for {operation}")
            return HTTPException(
                status_code=404,
                detail="Resource not found in Voice Bot service"
            )
        elif status_code >= 500:
            logger.error(f"Voice Bot service error for {operation}: {error.message}")
            return HTTPException(
                status_code=502,
                detail="Voice Bot service temporarily unavailable"
            )
        else:
            logger.warning(f"Voice Bot client error for {operation}: {error.message}")
            return HTTPException(
                status_code=400,
                detail=error.message
            )
    else:
        logger.error(f"Unexpected error in {operation}: {str(error)}", exc_info=True)
        return HTTPException(
            status_code=500,
            detail=f"Failed to {operation}"
        )


# =============================================================================
# BUSINESS PROFILE ENDPOINTS
# =============================================================================

@router.get("/business")
async def get_business_profile(
    request: Request,
    current_user: dict = Depends(get_current_user),
    voice_bot: VoiceBotClient = Depends(get_voice_bot_client)
):
    """
    Get business profile from Voice Bot service.
    
    Returns the complete business profile including contact information,
    timezone settings, and configuration status.
    """
    try:
        business_id = await get_business_id_for_user(request, current_user)
        logger.info(f"Fetching business profile for business_id: {business_id}")
        
        profile = await voice_bot.get_business_profile(business_id)
        
        # Add metadata
        profile["_metadata"] = {
            "last_updated": datetime.utcnow().isoformat(),
            "source": "voice_bot"
        }
        
        return profile
        
    except Exception as e:
        raise handle_voice_bot_error(e, "fetch business profile")


@router.patch("/business")
async def update_business_profile(
    request: Request,
    updates: BusinessProfileUpdate,
    current_user: dict = Depends(get_current_user),
    voice_bot: VoiceBotClient = Depends(get_voice_bot_client)
):
    """
    Update business profile in Voice Bot service.
    
    Updates the business profile with provided data. Only specified fields
    will be updated; omitted fields will remain unchanged.
    """
    try:
        business_id = await get_business_id_for_user(request, current_user)
        logger.info(f"Updating business profile for business_id: {business_id}")
        
        # Convert to dict and remove None values
        update_data = updates.dict(exclude_unset=True, exclude_none=True)
        
        if not update_data:
            return {"success": True, "message": "No updates provided"}
        
        logger.debug(f"Updating business profile with data: {list(update_data.keys())}")
        
        result = await voice_bot.update_business_profile(business_id, update_data)
        
        logger.info(f"Successfully updated business profile for business_id: {business_id}")
        return result
        
    except Exception as e:
        raise handle_voice_bot_error(e, "update business profile")


# =============================================================================
# SERVICES MANAGEMENT ENDPOINTS
# =============================================================================

@router.get("/services")
async def get_services(
    request: Request,
    include_inactive: bool = Query(False, description="Include inactive services"),
    current_user: dict = Depends(get_current_user),
    voice_bot: VoiceBotClient = Depends(get_voice_bot_client)
):
    """
    Get all services for the business from Voice Bot service.
    
    Returns a list of services with their configuration, pricing,
    and availability status.
    """
    try:
        business_id = await get_business_id_for_user(request, current_user)
        logger.info(f"Fetching services for business_id: {business_id}, include_inactive: {include_inactive}")
        
        services = await voice_bot.get_services(business_id, include_inactive)
        
        # Add metadata
        if isinstance(services, dict):
            services["_metadata"] = {
                "last_updated": datetime.utcnow().isoformat(),
                "include_inactive": include_inactive,
                "source": "voice_bot"
            }
        
        return services
        
    except Exception as e:
        raise handle_voice_bot_error(e, "fetch services")


@router.post("/services")
async def create_service(
    request: Request,
    service: ServiceCreate,
    current_user: dict = Depends(get_current_user),
    voice_bot: VoiceBotClient = Depends(get_voice_bot_client)
):
    """
    Create a new service in Voice Bot service.
    
    Creates a service with the provided configuration. The service
    will be automatically assigned a sort order based on existing services.
    """
    try:
        business_id = await get_business_id_for_user(request, current_user)
        logger.info(f"Creating service for business_id: {business_id}")
        
        service_data = service.dict()
        logger.debug(f"Creating service with data: {service.name}")
        
        result = await voice_bot.create_service(business_id, service_data)
        
        logger.info(f"Successfully created service '{service.name}' for business_id: {business_id}")
        return result
        
    except Exception as e:
        raise handle_voice_bot_error(e, "create service")


@router.patch("/services/{service_id}")
async def update_service(
    request: Request,
    service_id: str,
    updates: ServiceUpdate,
    current_user: dict = Depends(get_current_user),
    voice_bot: VoiceBotClient = Depends(get_voice_bot_client)
):
    """
    Update an existing service in Voice Bot service.
    
    Updates the specified service with provided data. Only specified
    fields will be updated; omitted fields will remain unchanged.
    """
    try:
        business_id = await get_business_id_for_user(request, current_user)
        logger.info(f"Updating service {service_id} for business_id: {business_id}")
        
        # Convert to dict and remove None values
        update_data = updates.dict(exclude_unset=True, exclude_none=True)
        
        if not update_data:
            return {"success": True, "message": "No updates provided"}
        
        logger.debug(f"Updating service {service_id} with data: {list(update_data.keys())}")
        
        result = await voice_bot.update_service(business_id, service_id, update_data)
        
        logger.info(f"Successfully updated service {service_id} for business_id: {business_id}")
        return result
        
    except Exception as e:
        raise handle_voice_bot_error(e, f"update service {service_id}")


@router.delete("/services/{service_id}")
async def delete_service(
    request: Request,
    service_id: str,
    current_user: dict = Depends(get_current_user),
    voice_bot: VoiceBotClient = Depends(get_voice_bot_client)
):
    """
    Delete a service from Voice Bot service.
    
    Performs a soft delete of the specified service, marking it as inactive
    while preserving historical data and references.
    """
    try:
        business_id = await get_business_id_for_user(request, current_user)
        logger.info(f"Deleting service {service_id} for business_id: {business_id}")
        
        result = await voice_bot.delete_service(business_id, service_id)
        
        logger.info(f"Successfully deleted service {service_id} for business_id: {business_id}")
        return result
        
    except Exception as e:
        raise handle_voice_bot_error(e, f"delete service {service_id}")


@router.post("/services/reorder")
async def reorder_services(
    request: Request,
    reorder_data: ServiceReorder,
    current_user: dict = Depends(get_current_user),
    voice_bot: VoiceBotClient = Depends(get_voice_bot_client)
):
    """
    Reorder services in Voice Bot service.
    
    Updates the display order of services based on the provided list.
    The order in the list determines the new sort order.
    """
    try:
        business_id = await get_business_id_for_user(request, current_user)
        logger.info(f"Reordering {len(reorder_data.service_ids)} services for business_id: {business_id}")
        
        result = await voice_bot.reorder_services(business_id, reorder_data.service_ids)
        
        logger.info(f"Successfully reordered services for business_id: {business_id}")
        return result
        
    except Exception as e:
        raise handle_voice_bot_error(e, "reorder services")


@router.post("/services/apply-template")
async def apply_service_template(
    request: Request,
    template_name: str = Query(..., description="Name of service template to apply"),
    current_user: dict = Depends(get_current_user),
    voice_bot: VoiceBotClient = Depends(get_voice_bot_client)
):
    """
    Apply a service template to the business.
    
    Applies a predefined service template, creating multiple services
    based on industry-specific configurations.
    """
    try:
        business_id = await get_business_id_for_user(request, current_user)
        logger.info(f"Applying service template '{template_name}' for business_id: {business_id}")
        
        result = await voice_bot.apply_service_template(business_id, template_name)
        
        logger.info(f"Successfully applied template '{template_name}' for business_id: {business_id}")
        return result
        
    except Exception as e:
        raise handle_voice_bot_error(e, f"apply service template '{template_name}'")


# =============================================================================
# BUSINESS HOURS ENDPOINTS
# =============================================================================

@router.get("/hours")
async def get_business_hours(
    request: Request,
    current_user: dict = Depends(get_current_user),
    voice_bot: VoiceBotClient = Depends(get_voice_bot_client)
):
    """
    Get business operating hours from Voice Bot service.
    
    Returns the weekly schedule and timezone configuration
    for the business.
    """
    try:
        business_id = await get_business_id_for_user(request, current_user)
        logger.info(f"Fetching business hours for business_id: {business_id}")
        
        hours = await voice_bot.get_business_hours(business_id)
        
        # Add metadata
        if isinstance(hours, dict):
            hours["_metadata"] = {
                "last_updated": datetime.utcnow().isoformat(),
                "source": "voice_bot"
            }
        
        return hours
        
    except Exception as e:
        raise handle_voice_bot_error(e, "fetch business hours")


@router.put("/hours")
async def update_business_hours(
    request: Request,
    hours: BusinessHours,
    current_user: dict = Depends(get_current_user),
    voice_bot: VoiceBotClient = Depends(get_voice_bot_client)
):
    """
    Update business operating hours in Voice Bot service.
    
    Updates the weekly schedule with new hours. Accepts partial
    updates - only specified days will be modified.
    """
    try:
        business_id = await get_business_id_for_user(request, current_user)
        logger.info(f"Updating business hours for business_id: {business_id}")
        
        hours_data = hours.dict(exclude_unset=True, exclude_none=True)
        
        if not hours_data:
            return {"success": True, "message": "No hour updates provided"}
        
        logger.debug(f"Updating business hours with data: {list(hours_data.keys())}")
        
        result = await voice_bot.update_business_hours(business_id, hours_data)
        
        logger.info(f"Successfully updated business hours for business_id: {business_id}")
        return result
        
    except Exception as e:
        raise handle_voice_bot_error(e, "update business hours")


@router.post("/holidays")
async def add_holiday(
    request: Request,
    holiday: HolidayCreate,
    current_user: dict = Depends(get_current_user),
    voice_bot: VoiceBotClient = Depends(get_voice_bot_client)
):
    """
    Add a holiday to business hours.
    
    Marks a specific date as a holiday when the business will be closed.
    """
    try:
        business_id = await get_business_id_for_user(request, current_user)
        logger.info(f"Adding holiday {holiday.date} for business_id: {business_id}")
        
        result = await voice_bot.add_holiday(business_id, holiday.date, holiday.description)
        
        logger.info(f"Successfully added holiday {holiday.date} for business_id: {business_id}")
        return result
        
    except Exception as e:
        raise handle_voice_bot_error(e, f"add holiday {holiday.date}")


@router.delete("/holidays/{holiday_date}")
async def remove_holiday(
    request: Request,
    holiday_date: str,
    current_user: dict = Depends(get_current_user),
    voice_bot: VoiceBotClient = Depends(get_voice_bot_client)
):
    """
    Remove a holiday from business hours.
    
    Removes the specified date from the holidays list, making
    the business available according to regular hours.
    """
    try:
        business_id = await get_business_id_for_user(request, current_user)
        logger.info(f"Removing holiday {holiday_date} for business_id: {business_id}")
        
        result = await voice_bot.remove_holiday(business_id, holiday_date)
        
        logger.info(f"Successfully removed holiday {holiday_date} for business_id: {business_id}")
        return result
        
    except Exception as e:
        raise handle_voice_bot_error(e, f"remove holiday {holiday_date}")


# =============================================================================
# ANALYTICS ENDPOINTS
# =============================================================================

@router.get("/analytics")
async def get_analytics(
    request: Request,
    start_date: Optional[str] = Query(None, pattern=r'^\d{4}-\d{2}-\d{2}$', description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, pattern=r'^\d{4}-\d{2}-\d{2}$', description="End date (YYYY-MM-DD)"),
    metrics: Optional[str] = Query(None, description="Comma-separated list of metrics"),
    current_user: dict = Depends(get_current_user),
    voice_bot: VoiceBotClient = Depends(get_voice_bot_client)
):
    """
    Get analytics data from Voice Bot service.
    
    Retrieves analytics data for the specified date range and metrics.
    Includes call statistics, booking metrics, and performance data.
    """
    try:
        business_id = await get_business_id_for_user(request, current_user)
        logger.info(f"Fetching analytics for business_id: {business_id}")
        
        # Parse metrics if provided
        metrics_list = None
        if metrics:
            metrics_list = [m.strip() for m in metrics.split(',') if m.strip()]
        
        analytics = await voice_bot.get_analytics(
            business_id,
            start_date,
            end_date,
            metrics_list
        )
        
        # Add metadata
        if isinstance(analytics, dict):
            analytics["_metadata"] = {
                "last_updated": datetime.utcnow().isoformat(),
                "date_range": {
                    "start": start_date,
                    "end": end_date
                },
                "requested_metrics": metrics_list,
                "source": "voice_bot"
            }
        
        return analytics
        
    except Exception as e:
        raise handle_voice_bot_error(e, "fetch analytics")


# =============================================================================
# CONFIGURATION ENDPOINTS
# =============================================================================

@router.get("/prompts")
async def get_prompts(
    request: Request,
    current_user: dict = Depends(get_current_user),
    voice_bot: VoiceBotClient = Depends(get_voice_bot_client)
):
    """
    Get AI prompt templates from Voice Bot service.
    
    Returns the current AI prompt configuration including
    greeting messages, booking flows, and conversation templates.
    """
    try:
        business_id = await get_business_id_for_user(request, current_user)
        logger.info(f"Fetching prompts for business_id: {business_id}")
        
        prompts = await voice_bot.get_prompts(business_id)
        
        return prompts
        
    except Exception as e:
        raise handle_voice_bot_error(e, "fetch prompts")


@router.patch("/prompts")
async def update_prompts(
    request: Request,
    prompts: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    voice_bot: VoiceBotClient = Depends(get_voice_bot_client)
):
    """
    Update AI prompts in Voice Bot service.
    
    Updates the AI prompt configuration. Only specified prompts
    will be updated; others will remain unchanged.
    """
    try:
        business_id = await get_business_id_for_user(request, current_user)
        logger.info(f"Updating prompts for business_id: {business_id}")
        
        if not prompts:
            return {"success": True, "message": "No prompt updates provided"}
        
        logger.debug(f"Updating prompts with keys: {list(prompts.keys())}")
        
        result = await voice_bot.update_prompts(business_id, prompts)
        
        logger.info(f"Successfully updated prompts for business_id: {business_id}")
        return result
        
    except Exception as e:
        raise handle_voice_bot_error(e, "update prompts")


@router.get("/staff")
async def get_staff(
    request: Request,
    current_user: dict = Depends(get_current_user),
    voice_bot: VoiceBotClient = Depends(get_voice_bot_client)
):
    """
    Get staff members from Voice Bot service.
    
    Returns the list of staff members configured for scheduling
    and service assignment.
    """
    try:
        business_id = await get_business_id_for_user(request, current_user)
        logger.info(f"Fetching staff for business_id: {business_id}")
        
        staff = await voice_bot.get_staff(business_id)
        
        return staff
        
    except Exception as e:
        raise handle_voice_bot_error(e, "fetch staff")


@router.get("/integrations")
async def get_integrations(
    request: Request,
    current_user: dict = Depends(get_current_user),
    voice_bot: VoiceBotClient = Depends(get_voice_bot_client)
):
    """
    Get integration status from Voice Bot service.
    
    Returns the current status of third-party integrations
    including calendar systems and booking platforms.
    """
    try:
        business_id = await get_business_id_for_user(request, current_user)
        logger.info(f"Fetching integrations for business_id: {business_id}")
        
        integrations = await voice_bot.get_integrations(business_id)
        
        return integrations
        
    except Exception as e:
        raise handle_voice_bot_error(e, "fetch integrations")


# =============================================================================
# HEALTH AND STATUS ENDPOINTS
# =============================================================================

@router.get("/health")
async def voice_bot_health_check(
    voice_bot: VoiceBotClient = Depends(get_voice_bot_client)
):
    """
    Check Voice Bot service health status.
    
    Performs a health check on the Voice Bot service to verify
    connectivity and authentication.
    """
    try:
        health_status = await voice_bot.health_check()
        return health_status
        
    except Exception as e:
        logger.error(f"Voice Bot health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }