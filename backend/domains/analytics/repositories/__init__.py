"""Analytics repositories module."""
from .interfaces import IAnalyticsRepository
from .supabase_repository import SupabaseAnalyticsRepository

__all__ = ["IAnalyticsRepository", "SupabaseAnalyticsRepository"]