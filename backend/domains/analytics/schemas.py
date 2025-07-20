"""
Analytics API schemas.

This module defines Pydantic models for API request/response validation,
ensuring type safety and documentation for analytics endpoints.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator


class AnalyticsDateRangeRequest(BaseModel):
    """Request model for date range parameters."""
    start_date: Optional[str] = Field(
        None,
        description="Start date in ISO format (YYYY-MM-DDTHH:MM:SS)",
        alias="startDate"
    )
    end_date: Optional[str] = Field(
        None,
        description="End date in ISO format (YYYY-MM-DDTHH:MM:SS)",
        alias="endDate"
    )
    
    class Config:
        populate_by_name = True


class CallVolumeDataResponse(BaseModel):
    """Response model for call volume data point."""
    date: str
    calls: int


class CallOutcomesResponse(BaseModel):
    """Response model for call outcomes distribution."""
    answered: int
    missed: int
    voicemail: int


class PeakHourDataResponse(BaseModel):
    """Response model for peak hour data point."""
    hour: int
    calls: int


class ServiceBookingResponse(BaseModel):
    """Response model for service booking data."""
    service: str
    bookings: int


class AnalyticsStatsResponse(BaseModel):
    """Response model for analytics statistics."""
    totalCalls: int = Field(..., alias="total_calls")
    answeredCalls: int = Field(..., alias="answered_calls")
    missedCalls: int = Field(..., alias="missed_calls")
    avgCallDuration: float = Field(..., alias="avg_call_duration")
    totalSMS: int = Field(..., alias="total_sms")
    bookingsToday: int = Field(..., alias="bookings_today")
    callsToday: int = Field(..., alias="calls_today")
    smsToday: int = Field(..., alias="sms_today")
    
    class Config:
        populate_by_name = True
        
    @classmethod
    def from_entity(cls, stats):
        """Create from domain entity."""
        return cls(
            total_calls=stats.total_calls,
            answered_calls=stats.answered_calls,
            missed_calls=stats.missed_calls,
            avg_call_duration=stats.avg_call_duration,
            total_sms=stats.total_sms,
            bookings_today=stats.bookings_today,
            calls_today=stats.calls_today,
            sms_today=stats.sms_today
        )


class AnalyticsChartsResponse(BaseModel):
    """Response model for analytics charts data."""
    callVolume: List[CallVolumeDataResponse] = Field(..., alias="call_volume")
    callOutcomes: CallOutcomesResponse = Field(..., alias="call_outcomes")
    peakHours: List[PeakHourDataResponse] = Field(..., alias="peak_hours")
    topServices: List[ServiceBookingResponse] = Field(..., alias="top_services")
    
    class Config:
        populate_by_name = True
    
    @classmethod
    def from_entity(cls, charts):
        """Create from domain entity."""
        return cls(
            call_volume=[
                CallVolumeDataResponse(
                    date=point.date.isoformat(),
                    calls=point.calls
                )
                for point in charts.call_volume
            ],
            call_outcomes=CallOutcomesResponse(
                answered=charts.call_outcomes.answered,
                missed=charts.call_outcomes.missed,
                voicemail=charts.call_outcomes.voicemail
            ),
            peak_hours=[
                PeakHourDataResponse(
                    hour=point.hour,
                    calls=point.calls
                )
                for point in charts.peak_hours
            ],
            top_services=[
                ServiceBookingResponse(
                    service=service.service_name,
                    bookings=service.bookings
                )
                for service in charts.top_services
            ]
        )


class AnalyticsOverviewResponse(BaseModel):
    """Response model for complete analytics overview."""
    stats: AnalyticsStatsResponse
    charts: AnalyticsChartsResponse
    
    @classmethod
    def from_entity(cls, overview):
        """Create from domain entity."""
        return cls(
            stats=AnalyticsStatsResponse.from_entity(overview.stats),
            charts=AnalyticsChartsResponse.from_entity(overview.charts)
        )


class ErrorResponse(BaseModel):
    """Standard error response model."""
    error: Dict[str, Any]
    request_id: Optional[str] = Field(None, alias="requestId")
    
    class Config:
        populate_by_name = True