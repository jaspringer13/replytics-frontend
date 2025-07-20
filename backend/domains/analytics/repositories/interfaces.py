"""
Analytics repository interfaces.

This module defines abstract interfaces for analytics data access,
ensuring consistent patterns while maintaining database independence.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime

from ..entities import (
    Call, Service, Appointment, AnalyticsStats,
    AnalyticsDateRange
)


class IAnalyticsRepository(ABC):
    """Interface for analytics data access."""
    
    @abstractmethod
    async def get_calls_for_period(
        self,
        business_id: str,
        date_range: AnalyticsDateRange
    ) -> List[Call]:
        """
        Get all calls for a business within a date range.
        
        Args:
            business_id: The business identifier
            date_range: The date range to query
            
        Returns:
            List of calls within the period
        """
        pass
    
    @abstractmethod
    async def get_calls_today(self, business_id: str) -> List[Call]:
        """
        Get all calls for today.
        
        Args:
            business_id: The business identifier
            
        Returns:
            List of calls from today
        """
        pass
    
    @abstractmethod
    async def get_active_services(self, business_id: str) -> List[Service]:
        """
        Get all active services for a business.
        
        Args:
            business_id: The business identifier
            
        Returns:
            List of active services
        """
        pass
    
    @abstractmethod
    async def get_appointments_for_period(
        self,
        business_id: str,
        date_range: AnalyticsDateRange,
        exclude_cancelled: bool = True
    ) -> List[Appointment]:
        """
        Get appointments for a business within a date range.
        
        Args:
            business_id: The business identifier
            date_range: The date range to query
            exclude_cancelled: Whether to exclude cancelled appointments
            
        Returns:
            List of appointments within the period
        """
        pass
    
    @abstractmethod
    async def get_appointments_today(
        self,
        business_id: str,
        exclude_cancelled: bool = True
    ) -> List[Appointment]:
        """
        Get appointments for today.
        
        Args:
            business_id: The business identifier
            exclude_cancelled: Whether to exclude cancelled appointments
            
        Returns:
            List of appointments for today
        """
        pass
    
    @abstractmethod
    async def get_sms_count_for_period(
        self,
        business_id: str,
        date_range: AnalyticsDateRange
    ) -> int:
        """
        Get count of SMS messages for a period.
        
        Args:
            business_id: The business identifier
            date_range: The date range to query
            
        Returns:
            Count of SMS messages
        """
        pass
    
    @abstractmethod
    async def get_sms_count_today(self, business_id: str) -> int:
        """
        Get count of SMS messages for today.
        
        Args:
            business_id: The business identifier
            
        Returns:
            Count of SMS messages sent today
        """
        pass
    
    @abstractmethod
    async def get_analytics_stats(
        self,
        business_id: str,
        date_range: AnalyticsDateRange
    ) -> AnalyticsStats:
        """
        Get aggregated analytics statistics.
        
        This method should be optimized to use database aggregations
        where possible rather than fetching all records.
        
        Args:
            business_id: The business identifier
            date_range: The date range to query
            
        Returns:
            Aggregated analytics statistics
        """
        pass