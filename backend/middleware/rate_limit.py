"""
Rate limiting middleware
"""

import time
from collections import defaultdict
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from config.settings import get_settings

settings = get_settings()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiting middleware"""
    
    def __init__(self, app):
        super().__init__(app)
        self.requests = defaultdict(list)
    
    async def dispatch(self, request: Request, call_next):
        # Get client identifier (IP address or user ID)
        client_id = request.client.host if request.client else "unknown"
        if hasattr(request.state, "user_id"):
            client_id = f"user:{request.state.user_id}"
        
        # Current timestamp
        now = time.time()
        
        # Clean old requests
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if req_time > now - 60  # Keep only last minute
        ]
        
        # Check rate limit
        if len(self.requests[client_id]) >= settings.RATE_LIMIT_PER_MINUTE:
            return JSONResponse(
                status_code=429,
                content={"error": "Rate limit exceeded. Please try again later."}
            )
        
        # Record this request
        self.requests[client_id].append(now)
        
        # Process request
        response = await call_next(request)
        return response