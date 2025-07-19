"""
Authentication endpoints
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from jose import JWTError, jwt
from passlib.context import CryptContext
import httpx

from config.settings import get_settings
from services.supabase_service import SupabaseService

router = APIRouter()
settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    email: EmailStr
    name: str
    image: Optional[str] = None
    google_id: str


class AuthResponse(BaseModel):
    token: str
    user: dict
    expires_at: str
    expires_in: int


def create_access_token(data: dict) -> tuple[str, str, int]:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    expires_at = expire.isoformat()
    expires_in = settings.JWT_EXPIRATION_HOURS * 3600
    
    return encoded_jwt, expires_at, expires_in


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash password"""
    return pwd_context.hash(password)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), request: Request = None):
    """Get current user from JWT token"""
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        # Get user from database
        supabase: SupabaseService = request.app.state.supabase
        user = await supabase.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")


@router.post("/", response_model=AuthResponse)
async def login(request: Request, login_data: LoginRequest):
    """Login with email and password"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Special handling for test account
    if login_data.email == "jaspringer13@gmail.com" and login_data.password == "admin":
        # Create test user response
        user = {
            "id": "test-user-id",
            "email": login_data.email,
            "name": "Test Admin",
            "created_at": datetime.utcnow().isoformat()
        }
        
        token, expires_at, expires_in = create_access_token({"sub": user["id"], "email": user["email"]})
        
        return AuthResponse(
            token=token,
            user=user,
            expires_at=expires_at,
            expires_in=expires_in
        )
    
    # Normal authentication flow
    user = await supabase.get_user_by_email(login_data.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(login_data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Remove password hash from response
    user.pop("password_hash", None)
    
    token, expires_at, expires_in = create_access_token({"sub": user["id"], "email": user["email"]})
    
    return AuthResponse(
        token=token,
        user=user,
        expires_at=expires_at,
        expires_in=expires_in
    )


@router.post("/google", response_model=AuthResponse)
async def google_login(request: Request, google_data: GoogleLoginRequest):
    """Login with Google OAuth"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Check if user exists
    user = await supabase.get_user_by_email(google_data.email)
    
    if not user:
        # Create new user
        user = await supabase.create_user(
            email=google_data.email,
            password_hash="",  # No password for OAuth users
            name=google_data.name
        )
        
        # Create business profile
        await supabase.client.table('business_profiles').insert({
            'user_id': user['id'],
            'business_name': f"{google_data.name}'s Business",
            'onboarding_step': 0
        }).execute()
    
    token, expires_at, expires_in = create_access_token({"sub": user["id"], "email": user["email"]})
    
    return AuthResponse(
        token=token,
        user=user,
        expires_at=expires_at,
        expires_in=expires_in
    )


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(request: Request, current_user: dict = Depends(get_current_user)):
    """Refresh authentication token"""
    token, expires_at, expires_in = create_access_token({"sub": current_user["id"], "email": current_user["email"]})
    
    return AuthResponse(
        token=token,
        user=current_user,
        expires_at=expires_at,
        expires_in=expires_in
    )


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout (client-side token removal)"""
    return {"success": True, "message": "Logged out successfully"}