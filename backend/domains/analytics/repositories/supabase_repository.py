"""
Supabase implementation of analytics repository.

This module provides the concrete implementation of analytics data access
using Supabase as the backend.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta, timezone
import logging

from supabase import Client

from ..entities import (
    Call, Service, Appointment, AnalyticsStats,
    AnalyticsDateRange, CallStatus, CallOutcome
)
from .interfaces import IAnalyticsRepository
from shared.errors import ExternalServiceError, ErrorContext


logger = logging.getLogger(__name__)


class SupabaseAnalyticsRepository(IAnalyticsRepository):
    """Supabase implementation of analytics repository."""
    
    def __init__(self, client: Client):
        self.client = client
        self.domain_name = "analytics"
    
    def _create_error_context(self, operation: str, **kwargs) -> ErrorContext:
        """Create error context for operations."""
        return ErrorContext(
            domain=self.domain_name,
            operation=operation,
            business_id=kwargs.get("business_id"),
            metadata=kwargs
        )
    
    def _parse_call(self, data: Dict[str, Any]) -> Call:
        """Parse call data from database."""
        return Call(
            id=data["id"],
            business_id=data["business_id"],
            created_at=datetime.fromisoformat(data["created_at"].replace('Z', '+00:00')),
            status=CallStatus(data["status"].lower()) if data.get("status") else CallStatus.MISSED,
            outcome=CallOutcome(data["outcome"].lower()) if data.get("outcome") else None,
            duration=data.get("duration"),
            caller_phone=data.get("caller_phone")
        )
    
    def _parse_service(self, data: Dict[str, Any]) -> Service:
        """Parse service data from database."""
        return Service(
            id=data["id"],
            business_id=data["business_id"],
            name=data["name"],
            is_active=data.get("is_active", True),
            created_at=datetime.fromisoformat(data["created_at"].replace('Z', '+00:00')),
            updated_at=datetime.fromisoformat(data["updated_at"].replace('Z', '+00:00')) if data.get("updated_at") else None
        )
    
    def _parse_appointment(self, data: Dict[str, Any]) -> Appointment:
        """Parse appointment data from database."""
        return Appointment(
            id=data["id"],
            business_id=data["business_id"],
            service_id=data["service_id"],
            customer_id=data.get("customer_id"),
            created_at=datetime.fromisoformat(data["created_at"].replace('Z', '+00:00')),
            scheduled_at=datetime.fromisoformat(data["scheduled_at"].replace('Z', '+00:00')),
            status=data.get("status", "confirmed")
        )
    
    async def get_calls_for_period(
        self,
        business_id: str,
        date_range: AnalyticsDateRange
    ) -> List[Call]:
        """Get all calls for a business within a date range."""
        try:
            result = self.client.table('calls') \
                .select('*') \
                .eq('business_id', business_id) \
                .gte('created_at', date_range.start_date.isoformat()) \
                .lte('created_at', date_range.end_date.isoformat()) \
                .execute()
            
            return [self._parse_call(call) for call in result.data]
            
        except Exception as e:
            logger.error(f"Error fetching calls for period: {e}")
            raise ExternalServiceError(
                service_name="Supabase",
                message="Failed to fetch calls for period",
                context=self._create_error_context(
                    "get_calls_for_period",
                    business_id=business_id,
                    date_range=f"{date_range.start_date} to {date_range.end_date}"
                ),
                inner_error=e
            )
    
    async def get_calls_today(self, business_id: str) -> List[Call]:
        """Get all calls for today."""
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        date_range = AnalyticsDateRange(
            start_date=today_start,
            end_date=today_end
        )
        
        return await self.get_calls_for_period(business_id, date_range)
    
    async def get_active_services(self, business_id: str) -> List[Service]:
        """Get all active services for a business."""
        try:
            result = self.client.table('services') \
                .select('*') \
                .eq('business_id', business_id) \
                .eq('is_active', True) \
                .execute()
            
            return [self._parse_service(service) for service in result.data]
            
        except Exception as e:
            logger.error(f"Error fetching active services: {e}")
            raise ExternalServiceError(
                service_name="Supabase",
                message="Failed to fetch active services",
                context=self._create_error_context(
                    "get_active_services",
                    business_id=business_id
                ),
                inner_error=e
            )
    
    async def get_appointments_for_period(
        self,
        business_id: str,
        date_range: AnalyticsDateRange,
        exclude_cancelled: bool = True
    ) -> List[Appointment]:
        """Get appointments for a business within a date range."""
        try:
            query = self.client.table('appointments') \
                .select('*') \
                .eq('business_id', business_id) \
                .gte('created_at', date_range.start_date.isoformat()) \
                .lte('created_at', date_range.end_date.isoformat())
            
            if exclude_cancelled:
                query = query.neq('status', 'cancelled')
            
            result = query.execute()
            
            return [self._parse_appointment(appt) for appt in result.data]
            
        except Exception as e:
            logger.error(f"Error fetching appointments for period: {e}")
            raise ExternalServiceError(
                service_name="Supabase",
                message="Failed to fetch appointments for period",
                context=self._create_error_context(
                    "get_appointments_for_period",
                    business_id=business_id,
                    date_range=f"{date_range.start_date} to {date_range.end_date}"
                ),
                inner_error=e
            )
    
    async def get_appointments_today(
        self,
        business_id: str,
        exclude_cancelled: bool = True
    ) -> List[Appointment]:
        """Get appointments for today."""
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        date_range = AnalyticsDateRange(
            start_date=today_start,
            end_date=today_end
        )
        
        return await self.get_appointments_for_period(business_id, date_range, exclude_cancelled)
    
    async def get_sms_count_for_period(
        self,
        business_id: str,
        date_range: AnalyticsDateRange
    ) -> int:
        """Get count of SMS messages for a period."""
        try:
            result = self.client.table('sms_messages') \
                .select('*', count='exact', head=True) \
                .eq('business_id', business_id) \
                .gte('created_at', date_range.start_date.isoformat()) \
                .lte('created_at', date_range.end_date.isoformat()) \
                .execute()
            
            return result.count or 0
            
        except Exception as e:
            logger.error(f"Error counting SMS for period: {e}")
            raise ExternalServiceError(
                service_name="Supabase",
                message="Failed to count SMS for period",
                context=self._create_error_context(
                    "get_sms_count_for_period",
                    business_id=business_id,
                    date_range=f"{date_range.start_date} to {date_range.end_date}"
                ),
                inner_error=e
            )
    
    async def get_sms_count_today(self, business_id: str) -> int:
        """Get count of SMS messages for today."""
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        date_range = AnalyticsDateRange(
            start_date=today_start,
            end_date=today_end
        )
        
        return await self.get_sms_count_for_period(business_id, date_range)
    
    async def get_analytics_stats(
        self,
        business_id: str,
        date_range: AnalyticsDateRange
    ) -> AnalyticsStats:
        """Get aggregated analytics statistics."""
        try:
            # Get calls for the period
            calls = await self.get_calls_for_period(business_id, date_range)
            
            # Calculate call statistics
            total_calls = len(calls)
            answered_calls = sum(1 for call in calls if call.is_answered())
            missed_calls = sum(1 for call in calls if call.is_missed())
            
            # Calculate average duration (only for answered calls with duration)
            durations = [call.duration for call in calls if call.is_answered() and call.duration]
            avg_call_duration = sum(durations) / len(durations) if durations else 0.0
            
            # Get SMS count
            total_sms = await self.get_sms_count_for_period(business_id, date_range)
            
            # Get today's statistics
            calls_today = await self.get_calls_today(business_id)
            bookings_today = await self.get_appointments_today(business_id)
            sms_today = await self.get_sms_count_today(business_id)
            
            return AnalyticsStats(
                total_calls=total_calls,
                answered_calls=answered_calls,
                missed_calls=missed_calls,
                avg_call_duration=avg_call_duration,
                total_sms=total_sms,
                bookings_today=len(bookings_today),
                calls_today=len(calls_today),
                sms_today=sms_today
            )
            
        except ExternalServiceError:
            # Re-raise domain errors
            raise
        except Exception as e:
            logger.error(f"Error calculating analytics stats: {e}")
            raise ExternalServiceError(
                service_name="Supabase",
                message="Failed to calculate analytics stats",
                context=self._create_error_context(
                    "get_analytics_stats",
                    business_id=business_id,
                    date_range=f"{date_range.start_date} to {date_range.end_date}"
                ),
                inner_error=e
            )