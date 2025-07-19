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
    existing_services = await supabase.get_services(profile["id"], includeInactive=True)
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
    result = await supabase.client.table('services').update(update_data).eq('id', service_id).execute()
    
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
    """Reorder services using atomic bulk update"""
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
    
    try:
        # Create a list of service updates for bulk operation
        business_id = profile["id"]
        updates = []
        
        # Prepare all updates first, including business_id for security
        for index, service_id in enumerate(reorder_data.serviceIds):
            updates.append({
                'id': service_id,
                'business_id': business_id,  # Include business_id for security
                'display_order': index,
                'updated_at': datetime.now().isoformat()
            })
        
        # Execute bulk update using upsert for atomic operation
        # This ensures all updates succeed or all fail together
        result = await supabase.client.table('services').upsert(
            updates,
            on_conflict='id'
        ).execute()
        
        # Verify all services were updated successfully
        if not result.data or len(result.data) != len(reorder_data.serviceIds):
            raise HTTPException(status_code=500, detail="Failed to reorder all services")
        
        # Double-check that all returned services belong to the correct business
        for service in result.data:
            if service.get('business_id') != business_id:
                raise HTTPException(status_code=403, detail="Unauthorized service modification detected")
            
        return {"success": True, "message": "Services reordered successfully"}
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the error for debugging
        print(f"Error reordering services: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to reorder services - operation rolled back"
        )