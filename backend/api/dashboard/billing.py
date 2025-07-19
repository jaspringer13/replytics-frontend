"""
Billing and usage endpoints
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Request, Depends

from api.dashboard.auth import get_current_user
from services.supabase_service import SupabaseService

router = APIRouter()


@router.get("/")
async def get_billing_info(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get billing information and usage"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        return {
            "usage": {
                "minutes": 0,
                "calls": 0,
                "sms": 0,
                "recordings": 0
            },
            "limits": {
                "minutes": 1000,
                "calls": 500,
                "sms": 1000,
                "recordings": 100
            },
            "billingPeriod": {
                "start": datetime.now().replace(day=1).isoformat(),
                "end": (datetime.now().replace(day=1) + timedelta(days=32)).replace(day=1).isoformat()
            }
        }
    
    # Calculate billing period
    now = datetime.now()
    billing_start = now.replace(day=1, hour=0, minute=0, second=0)
    next_month = billing_start + timedelta(days=32)
    billing_end = next_month.replace(day=1)
    
    # Get usage for current billing period
    calls_result = await supabase.client.table('calls')\
        .select('duration', count='exact')\
        .eq('business_id', profile["id"])\
        .gte('created_at', billing_start.isoformat())\
        .lt('created_at', billing_end.isoformat())\
        .execute()
    
    sms_result = await supabase.client.table('sms_messages')\
        .select('id', count='exact')\
        .eq('business_id', profile["id"])\
        .eq('direction', 'outbound')\
        .gte('created_at', billing_start.isoformat())\
        .lt('created_at', billing_end.isoformat())\
        .execute()
    
    # Calculate usage
    total_minutes = sum(call.get('duration', 0) for call in (calls_result.data or [])) // 60
    total_calls = calls_result.count or 0
    total_sms = sms_result.count or 0
    total_recordings = len([c for c in (calls_result.data or []) if c.get('recording_url')])
    
    # Get plan limits from profile
    plan = profile.get('plan', 'starter')
    limits = {
        "starter": {"minutes": 1000, "calls": 500, "sms": 1000, "recordings": 100},
        "professional": {"minutes": 5000, "calls": 2500, "sms": 5000, "recordings": 500},
        "enterprise": {"minutes": -1, "calls": -1, "sms": -1, "recordings": -1}  # -1 means unlimited
    }
    
    return {
        "usage": {
            "minutes": total_minutes,
            "calls": total_calls,
            "sms": total_sms,
            "recordings": total_recordings
        },
        "limits": limits.get(plan, limits["starter"]),
        "billingPeriod": {
            "start": billing_start.isoformat(),
            "end": billing_end.isoformat()
        },
        "plan": plan
    }


@router.get("/invoices")
async def get_invoices(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get billing invoices"""
    # TODO: Integrate with payment provider (Stripe)
    return {
        "invoices": [
            {
                "id": "inv_123",
                "date": "2024-01-01",
                "amount": 49.99,
                "status": "paid",
                "downloadUrl": "#"
            }
        ]
    }


@router.post("/upgrade")
async def upgrade_plan(
    request: Request,
    plan: str,
    current_user: dict = Depends(get_current_user)
):
    """Upgrade billing plan"""
    # TODO: Integrate with payment provider (Stripe)
    return {
        "success": True,
        "message": f"Plan upgraded to {plan}",
        "checkoutUrl": "#"
    }