"""
Authentication middleware
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from jose import JWTError, jwt
from config.settings import get_settings

settings = get_settings()


def get_public_endpoints():
    """Get public endpoints from settings or return defaults"""
    return getattr(settings, 'PUBLIC_ENDPOINTS', [
        "/",
        "/health", 
        "/docs",
        "/redoc",
        "/openapi.json",
        "/api/dashboard/auth",
        "/api/dashboard/auth/google",
    ])


class AuthMiddleware(BaseHTTPMiddleware):
    """Middleware to verify JWT tokens for protected routes"""
    
    async def dispatch(self, request: Request, call_next):
        # Skip authentication for public endpoints
        path = request.url.path
        
        public_endpoints = get_public_endpoints()
        
        if any(path.startswith(endpoint + "/") or path == endpoint for endpoint in public_endpoints):
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
            if not settings.SECRET_KEY:
                return JSONResponse(
                    status_code=500,
                    content={"error": "JWT configuration missing"}
                )
                
            # Verify token
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            
            # Validate required payload fields
            user_id = payload.get("sub")
            user_email = payload.get("email")
            
            if not user_id:
                return JSONResponse(
                    status_code=401,
                    content={"error": "Invalid token: missing user ID"}
                )
            
            # Add user info to request state
            request.state.user_id = user_id
            request.state.user_email = user_email
            
        except JWTError:
            return JSONResponse(
                status_code=401,
                content={"error": "Invalid or expired token"}
            )
        
        response = await call_next(request)
        return response