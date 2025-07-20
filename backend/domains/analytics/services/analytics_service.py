"""
Analytics business logic service.

This module contains all business logic for analytics operations,
separated from data access and HTTP concerns.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta, timezone
from collections import defaultdict
import logging

from ..entities import (
    AnalyticsDateRange, AnalyticsOverview, AnalyticsStats,
    AnalyticsChartData, CallVolumeDataPoint, CallOutcomesData,
    PeakHourDataPoint, ServiceBookingData, Call, Service, Appointment
)
from ..repositories.interfaces import IAnalyticsRepository
from shared.errors import (
    BusinessRuleViolation, ValidationError, ErrorContext
)


logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for analytics business logic."""
    
    def __init__(self, repository: IAnalyticsRepository):
        self.repository = repository
    
    def _create_error_context(self, operation: str, business_id: str) -> ErrorContext:
        """Create error context for service operations."""
        return ErrorContext(
            domain="analytics",
            operation=f"service.{operation}",
            business_id=business_id
        )
    
    async def get_analytics_overview(
        self,
        business_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> AnalyticsOverview:
        """
        Get complete analytics overview for a business.
        
        Args:
            business_id: The business identifier
            start_date: Start of the period (defaults to 30 days ago)
            end_date: End of the period (defaults to now)
            
        Returns:
            Complete analytics overview with stats and charts
            
        Raises:
            ValidationError: If date range is invalid
            BusinessRuleViolation: If business rules are violated
        """
        # Set default date range if not provided
        if not end_date:
            end_date = datetime.now(timezone.utc)
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Create and validate date range
        date_range = AnalyticsDateRange(start_date=start_date, end_date=end_date)
        
        try:
            date_range.validate()
        except ValueError as e:
            raise ValidationError(
                message=str(e),
                field_errors={"date_range": [str(e)]},
                context=self._create_error_context("get_analytics_overview", business_id)
            )
        
        # Get analytics stats
        stats = await self.repository.get_analytics_stats(business_id, date_range)
        
        # Get chart data
        chart_data = await self._get_chart_data(business_id, date_range)
        
        return AnalyticsOverview(
            stats=stats,
            charts=chart_data,
            date_range=date_range,
            business_id=business_id
        )
    
    async def _get_chart_data(
        self,
        business_id: str,
        date_range: AnalyticsDateRange
    ) -> AnalyticsChartData:
        """Get all chart data for analytics."""
        # Fetch data in parallel where possible
        calls = await self.repository.get_calls_for_period(business_id, date_range)
        services = await self.repository.get_active_services(business_id)
        appointments = await self.repository.get_appointments_for_period(business_id, date_range)
        
        # Process chart data
        call_volume = self._calculate_call_volume(calls, date_range)
        call_outcomes = self._calculate_call_outcomes(calls)
        peak_hours = self._calculate_peak_hours(calls)
        top_services = await self._calculate_top_services(services, appointments)
        
        return AnalyticsChartData(
            call_volume=call_volume,
            call_outcomes=call_outcomes,
            peak_hours=peak_hours,
            top_services=top_services
        )
    
    def _calculate_call_volume(
        self,
        calls: List[Call],
        date_range: AnalyticsDateRange
    ) -> List[CallVolumeDataPoint]:
        """Calculate daily call volume for the date range."""
        # Initialize all dates in range with 0 calls
        daily_counts: Dict[date, int] = {}
        current_date = date_range.start_date.date()
        end_date = date_range.end_date.date()
        
        while current_date <= end_date:
            daily_counts[current_date] = 0
            current_date += timedelta(days=1)
        
        # Count actual calls per day
        for call in calls:
            call_date = call.created_at.date()
            if call_date in daily_counts:
                daily_counts[call_date] += 1
        
        # Convert to data points and sort by date
        return [
            CallVolumeDataPoint(date=d, calls=count)
            for d, count in sorted(daily_counts.items())
        ]
    
    def _calculate_call_outcomes(self, calls: List[Call]) -> CallOutcomesData:
        """Calculate distribution of call outcomes."""
        outcomes = CallOutcomesData()
        
        for call in calls:
            if call.is_answered():
                outcomes.answered += 1
            elif call.is_voicemail():
                outcomes.voicemail += 1
            else:
                outcomes.missed += 1
        
        return outcomes
    
    def _calculate_peak_hours(self, calls: List[Call]) -> List[PeakHourDataPoint]:
        """Calculate call distribution by hour of day."""
        # Count calls by hour (0-23)
        hourly_counts = defaultdict(int)
        
        for call in calls:
            # Convert to local time if needed (you might want to use business timezone)
            hour = call.created_at.hour
            hourly_counts[hour] += 1
        
        # Create data points for all business hours (7 AM - 8 PM)
        # or hours with actual calls
        peak_hours = []
        for hour in range(24):
            count = hourly_counts.get(hour, 0)
            # Include hour if it has calls or is within business hours
            if count > 0 or (7 <= hour <= 20):
                peak_hours.append(PeakHourDataPoint(hour=hour, calls=count))
        
        return peak_hours
    
    async def _calculate_top_services(
        self,
        services: List[Service],
        appointments: List[Appointment]
    ) -> List[ServiceBookingData]:
        """Calculate top services by booking count."""
        if not services or not appointments:
            return []
        
        # Create service map for quick lookup
        service_map = {service.id: service.name for service in services}
        
        # Count bookings per service
        service_counts: Dict[str, int] = defaultdict(int)
        
        for appointment in appointments:
            if appointment.service_id in service_map:
                service_name = service_map[appointment.service_id]
                service_counts[service_name] += 1
        
        # Convert to data points and sort by bookings (descending)
        top_services = [
            ServiceBookingData(service_name=name, bookings=count)
            for name, count in service_counts.items()
        ]
        
        # Return top 10 services
        return sorted(top_services, key=lambda x: x.bookings, reverse=True)[:10]
    
    async def validate_date_range(
        self,
        start_date: Optional[str],
        end_date: Optional[str]
    ) -> tuple[Optional[datetime], Optional[datetime]]:
        """
        Validate and parse date strings.
        
        Args:
            start_date: ISO format date string
            end_date: ISO format date string
            
        Returns:
            Tuple of parsed datetime objects
            
        Raises:
            ValidationError: If date format is invalid
        """
        parsed_start = None
        parsed_end = None
        
        if start_date:
            try:
                parsed_start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except ValueError:
                raise ValidationError(
                    message=f"Invalid start date format: {start_date}",
                    field_errors={"startDate": ["Use ISO format (YYYY-MM-DDTHH:MM:SS)"]}
                )
        
        if end_date:
            try:
                parsed_end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except ValueError:
                raise ValidationError(
                    message=f"Invalid end date format: {end_date}",
                    field_errors={"endDate": ["Use ISO format (YYYY-MM-DDTHH:MM:SS)"]}
                )
        
        return parsed_start, parsed_end