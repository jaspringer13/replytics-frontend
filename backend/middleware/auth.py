"""
Authentication middleware
"""

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from jose import JWTError, jwt
from config.settings import get_settings

settings = get_settings()

# Public endpoints that don't require authentication
PUBLIC_ENDPOINTS = [
    "/",
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/api/dashboard/auth",
    "/api/dashboard/auth/google",
]


class AuthMiddleware(BaseHTTPMiddleware):
    """Middleware to verify JWT tokens for protected routes"""
    
    async def dispatch(self, request: Request, call_next):
        # Skip authentication for public endpoints
        if any(request.url.path.startswith(endpoint) for endpoint in PUBLIC_ENDPOINTS):
            return await call_next(request)
        
        # Get token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"error": "Missing or invalid authorization header"}
            )
        
        token = auth_header.split(" ")[1]
        
        try:
            # Verify token
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            
            # Add user info to request state
            request.state.user_id = payload.get("sub")
            request.state.user_email = payload.get("email")
            
        except JWTError:
            return JSONResponse(
                status_code=401,
                content={"error": "Invalid or expired token"}
            )
        
        response = await call_next(request)
        return response