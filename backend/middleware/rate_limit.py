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
        self.last_cleanup = time.time()
        self.cleanup_interval = 3600  # Clean every hour
    
    async def dispatch(self, request: Request, call_next):
        # Get client identifier (IP address or user ID)
        client_id = request.client.host if request.client and request.client.host else f"unknown_{id(request)}"
        if hasattr(request.state, "user_id"):
            client_id = f"user:{request.state.user_id}"
        
        # Current timestamp
        now = time.time()
        
        # Periodic cleanup of inactive clients
        if now - self.last_cleanup > self.cleanup_interval:
            hour_ago = now - 3600
            # Remove clients with no requests in the last hour
            inactive_clients = [
                client_id for client_id, requests in self.requests.items()
                if not any(req_time > hour_ago for req_time in requests)
            ]
            for client_id in inactive_clients:
                del self.requests[client_id]
            self.last_cleanup = now
        
        # Clean old requests and remove empty entries
        minute_ago = now - 60
        hour_ago = now - 3600
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if req_time > hour_ago  # Keep hour of history for both limits
        ]
        
        # Check both minute and hour rate limits
        minute_requests = [t for t in self.requests[client_id] if t > minute_ago]
        if (len(minute_requests) >= settings.RATE_LIMIT_PER_MINUTE or 
            len(self.requests[client_id]) >= settings.RATE_LIMIT_PER_HOUR):
            return JSONResponse(
                status_code=429,
                content={"error": "Rate limit exceeded. Please try again later."}
            )
        
        # Record this request
        self.requests[client_id].append(now)
        
        # Process request
        response = await call_next(request)
        return response