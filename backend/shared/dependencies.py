"""
Shared dependencies for dependency injection.

This module provides common dependencies that can be used across different domains.
"""

from fastapi import Request, Depends
from supabase import Client
from typing import Optional


async def get_supabase_client(request: Request) -> Client:
    """
    Get Supabase client from the application state.
    
    This is used as a dependency in FastAPI routes to inject the Supabase client.
    """
    if not hasattr(request.app.state, 'supabase'):
        raise RuntimeError("Supabase client not initialized in application state")
    
    return request.app.state.supabase.client


async def get_current_user_id(request: Request) -> Optional[str]:
    """
    Get current user ID from request state.
    
    This assumes authentication middleware has already validated the user
    and stored the user ID in the request state.
    """
    return getattr(request.state, 'user_id', None)


async def get_current_business_id(request: Request) -> Optional[str]:
    """
    Get current business ID from request state.
    
    This assumes authentication middleware has already validated the user
    and stored the business ID in the request state.
    """
    return getattr(request.state, 'business_id', None)