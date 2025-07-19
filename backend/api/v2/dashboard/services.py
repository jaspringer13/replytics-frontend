"""
Services management endpoints
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Request, Depends, Query, HTTPException
from pydantic import BaseModel

from api.dashboard.auth import get_current_user
from services.supabase_service import SupabaseService

router = APIRouter()


class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration: int  # in minutes
    price: float
    category: Optional[str] = None
    isActive: bool = True


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[int] = None
    price: Optional[float] = None
    category: Optional[str] = None
    isActive: Optional[bool] = None


class ServiceReorder(BaseModel):
    serviceIds: List[str]


@router.get("/")
async def get_services(
    request: Request,
    includeInactive: bool = Query(False),
    current_user: dict = Depends(get_current_user)
):
    """Get all services for business"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        return []
    
    services = await supabase.get_services(profile["id"], includeInactive)
    return services


@router.post("/")
async def create_service(
    request: Request,
    service: ServiceCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new service"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    
    # Get current services to determine display order
    existing_services = await supabase.get_services(profile["id"], include_inactive=True)
    display_order = len(existing_services)
    
    service_data = {
        **service.dict(),
        "display_order": display_order
    }
    
    new_service = await supabase.create_service(profile["id"], service_data)
    if not new_service:
        raise HTTPException(status_code=500, detail="Failed to create service")
    
    return new_service


@router.patch("/{service_id}")
async def update_service(
    request: Request,
    service_id: str,
    updates: ServiceUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a service"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    
    # Verify service belongs to user's business
    service = await supabase.client.table('services')\
        .select('id')\
        .eq('id', service_id)\
        .eq('business_id', profile["id"])\
        .single()\
        .execute()
    
    if not service.data:
        raise HTTPException(status_code=404, detail="Service not found or unauthorized")
    
    # Convert to dict and remove None values
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    
    if not update_data:
        return {"message": "No updates provided"}
    
    # Update service
    result = supabase.client.table('services').update(update_data).eq('id', service_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return result.data[0]


@router.delete("/{service_id}")
async def delete_service(
    request: Request,
    service_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a service (soft delete)"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    
    # Verify service belongs to user's business
    service = await supabase.client.table('services')\
        .select('id')\
        .eq('id', service_id)\
        .eq('business_id', profile["id"])\
        .single()\
        .execute()
    
    if not service.data:
        raise HTTPException(status_code=404, detail="Service not found or unauthorized")
    
    # Soft delete by setting is_active to false
    result = await supabase.client.table('services').update({
        'is_active': False,
        'deleted_at': datetime.now().isoformat()
    }).eq('id', service_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return {"success": True, "message": "Service deleted"}


@router.post("/reorder")
async def reorder_services(
    request: Request,
    reorder_data: ServiceReorder,
    current_user: dict = Depends(get_current_user)
):
    """Reorder services"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    
    # Verify all services belong to user's business
    services = await supabase.client.table('services')\
        .select('id')\
        .eq('business_id', profile["id"])\
        .in_('id', reorder_data.serviceIds)\
        .execute()
    
    if not services.data or len(services.data) != len(reorder_data.serviceIds):
        raise HTTPException(status_code=404, detail="One or more services not found or unauthorized")
    
    # Update display order for each service
    for index, service_id in enumerate(reorder_data.serviceIds):
        await supabase.client.table('services').update({
            'display_order': index
        }).eq('id', service_id).eq('business_id', profile["id"]).execute()
    
    return {"success": True, "message": "Services reordered"}