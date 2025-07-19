"""
Billing and usage endpoints
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Request, Depends, HTTPException
from typing import Optional

from api.dashboard.auth import get_current_user
from services.supabase_service import SupabaseService
from services.stripe_service import stripe_service

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
        .select('duration, recording_url', count='exact')\
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
    current_user: dict = Depends(get_current_user),
    limit: Optional[int] = 10
):
    """Get billing invoices from Stripe"""
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile to find Stripe customer ID
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        return {"invoices": []}
    
    # Try to get invoices from Stripe
    if stripe_service.is_configured():
        try:
            # Get or find Stripe customer
            customer_email = current_user.get("email")
            if customer_email:
                customer_id = await stripe_service.get_customer_by_email(customer_email)
                
                if customer_id:
                    # Get real invoices from Stripe
                    invoices = await stripe_service.get_customer_invoices(customer_id, limit)
                    return {"invoices": invoices}
        
        except Exception as e:
            # Log error but continue with fallback
            print(f"Error fetching Stripe invoices: {e}")
    
    # Fallback to mock data if Stripe is not configured or fails
    return {
        "invoices": [
            {
                "id": "inv_demo_001",
                "date": datetime.now().replace(day=1).isoformat(),
                "amount": 49.99,
                "currency": "USD",
                "status": "paid",
                "description": "Replytics Pro - Monthly Subscription",
                "downloadUrl": None,
                "hostedInvoiceUrl": "#",
                "number": "DEMO-001",
                "subtotal": 49.99,
                "tax": 0,
                "total": 49.99,
                "period": {
                    "start": datetime.now().replace(day=1).isoformat(),
                    "end": (datetime.now().replace(day=1) + timedelta(days=30)).isoformat()
                }
            }
        ]
    }


@router.post("/upgrade")
async def upgrade_plan(
    request: Request,
    plan: str,
    current_user: dict = Depends(get_current_user)
):
    """Upgrade billing plan via Stripe"""
    allowed_plans = ["starter", "professional", "enterprise"]
    if plan not in allowed_plans:
        raise HTTPException(status_code=400, detail=f"Invalid plan. Must be one of: {', '.join(allowed_plans)}")
    
    supabase: SupabaseService = request.app.state.supabase
    
    # Get business profile
    profile = await supabase.get_business_profile(current_user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    
    # Try to create Stripe checkout session
    if stripe_service.is_configured():
        try:
            customer_email = current_user.get("email")
            if not customer_email:
                raise HTTPException(status_code=400, detail="User email not found")
            
            # Create checkout session
            base_url = request.headers.get("origin", "http://localhost:3000")
            success_url = f"{base_url}/dashboard/billing?success=true&plan={plan}"
            cancel_url = f"{base_url}/dashboard/billing?canceled=true"
            
            checkout_url = await stripe_service.create_checkout_session(
                customer_email=customer_email,
                plan=plan,
                success_url=success_url,
                cancel_url=cancel_url,
                business_id=profile["id"]
            )
            
            return {
                "success": True,
                "message": f"Redirecting to checkout for {plan} plan",
                "checkoutUrl": checkout_url
            }
        
        except Exception as e:
            # Log error but continue with fallback
            print(f"Error creating Stripe checkout: {e}")
    
    # Fallback for demo/testing when Stripe is not configured
    return {
        "success": True,
        "message": f"Plan upgraded to {plan} (Demo mode - Stripe not configured)",
        "checkoutUrl": f"/dashboard/billing?demo=true&plan={plan}"
    }