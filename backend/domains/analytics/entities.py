"""
Analytics domain entities.

This module defines the core business objects for the analytics domain,
representing the data structures used throughout analytics operations.
"""

from dataclasses import dataclass
from datetime import datetime, date
from typing import Optional, Dict, List
from enum import Enum


class CallStatus(Enum):
    """Status of a call."""
    COMPLETED = "completed"
    MISSED = "missed"
    IN_PROGRESS = "in_progress"
    FAILED = "failed"


class CallOutcome(Enum):
    """Outcome of a call."""
    ANSWERED = "answered"
    MISSED = "missed"
    VOICEMAIL = "voicemail"
    TRANSFERRED = "transferred"
    BOOKING_MADE = "booking_made"


@dataclass
class AnalyticsDateRange:
    """Date range for analytics queries."""
    start_date: datetime
    end_date: datetime
    
    def validate(self) -> None:
        """Validate the date range."""
        if self.start_date > self.end_date:
            raise ValueError("Start date must be before end date")
        
        # Check if range is too large (e.g., more than 1 year)
        delta = self.end_date - self.start_date
        if delta.days > 365:
            raise ValueError("Date range cannot exceed 365 days")


@dataclass
class CallVolumeDataPoint:
    """Data point for call volume chart."""
    date: date
    calls: int


@dataclass
class CallOutcomesData:
    """Distribution of call outcomes."""
    answered: int = 0
    missed: int = 0
    voicemail: int = 0
    
    @property
    def total(self) -> int:
        """Total number of calls."""
        return self.answered + self.missed + self.voicemail


@dataclass
class PeakHourDataPoint:
    """Data point for peak hours chart."""
    hour: int  # 0-23
    calls: int


@dataclass
class ServiceBookingData:
    """Service booking statistics."""
    service_name: str
    bookings: int


@dataclass
class AnalyticsStats:
    """Overall analytics statistics."""
    total_calls: int
    answered_calls: int
    missed_calls: int
    avg_call_duration: float  # in seconds
    total_sms: int
    bookings_today: int
    calls_today: int
    sms_today: int
    
    @property
    def answer_rate(self) -> float:
        """Calculate answer rate percentage."""
        if self.total_calls == 0:
            return 0.0
        return (self.answered_calls / self.total_calls) * 100


@dataclass
class AnalyticsChartData:
    """Container for all analytics chart data."""
    call_volume: List[CallVolumeDataPoint]
    call_outcomes: CallOutcomesData
    peak_hours: List[PeakHourDataPoint]
    top_services: List[ServiceBookingData]


@dataclass
class AnalyticsOverview:
    """Complete analytics overview including stats and charts."""
    stats: AnalyticsStats
    charts: AnalyticsChartData
    date_range: AnalyticsDateRange
    business_id: str


@dataclass
class Call:
    """Call entity."""
    id: str
    business_id: str
    created_at: datetime
    status: CallStatus
    outcome: Optional[CallOutcome] = None
    duration: Optional[int] = None  # in seconds
    caller_phone: Optional[str] = None
    
    def is_answered(self) -> bool:
        """Check if call was answered."""
        return (
            self.status == CallStatus.COMPLETED or 
            self.outcome == CallOutcome.ANSWERED
        )
    
    def is_missed(self) -> bool:
        """Check if call was missed."""
        return (
            self.status == CallStatus.MISSED or 
            self.outcome == CallOutcome.MISSED
        )
    
    def is_voicemail(self) -> bool:
        """Check if call went to voicemail."""
        return self.outcome == CallOutcome.VOICEMAIL


@dataclass
class Service:
    """Service entity."""
    id: str
    business_id: str
    name: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


@dataclass
class Appointment:
    """Appointment entity."""
    id: str
    business_id: str
    service_id: str
    customer_id: Optional[str]
    created_at: datetime
    scheduled_at: datetime
    status: str  # e.g., 'confirmed', 'cancelled', 'completed'
    
    def is_cancelled(self) -> bool:
        """Check if appointment is cancelled."""
        return self.status.lower() == 'cancelled'