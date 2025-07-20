"""
Billing controller for HTTP endpoints.

This module handles HTTP requests and responses for billing operations,
delegating business logic to the billing service.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Header
from typing import Optional, List
import logging

from ..services import BillingService
from ..schemas import (
    CreateCheckoutRequest, CreateCheckoutResponse,
    SubscriptionResponse, InvoiceResponse,
    UpdateSubscriptionRequest, CancelSubscriptionRequest
)
from ..repositories.supabase_repository import SupabaseBillingRepository
from ..repositories.stripe_processor import StripePaymentProcessor
from shared.errors import (
    BusinessLogicError, ResourceNotFoundError,
    ExternalServiceError, ValidationError
)
from shared.dependencies import get_supabase_client
from middleware.auth import get_current_user


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/billing", tags=["billing"])


def get_billing_service(
    supabase=Depends(get_supabase_client)
) -> BillingService:
    """Dependency to get billing service instance."""
    repository = SupabaseBillingRepository(supabase)
    payment_processor = StripePaymentProcessor()
    return BillingService(repository, payment_processor)


@router.post("/checkout", response_model=CreateCheckoutResponse)
async def create_checkout_session(
    request: CreateCheckoutRequest,
    service: BillingService = Depends(get_billing_service),
    current_user = Depends(get_current_user)
) -> CreateCheckoutResponse:
    """Create a checkout session for subscription purchase."""
    try:
        checkout_url = await service.create_checkout_session(
            email=request.email,
            plan_type=request.plan_type,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            business_id=current_user.get("business_id")
        )
        
        return CreateCheckoutResponse(
            checkout_url=checkout_url,
            success=True
        )
        
    except BusinessLogicError as e:
        logger.error(f"Business logic error in checkout: {e}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except ExternalServiceError as e:
        logger.error(f"External service error in checkout: {e}")
        raise HTTPException(
            status_code=503,
            detail="Payment service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"Unexpected error in checkout: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    service: BillingService = Depends(get_billing_service),
    current_user = Depends(get_current_user)
) -> SubscriptionResponse:
    """Get current subscription for authenticated user."""
    try:
        customer_id = current_user.get("id")
        if not customer_id:
            raise HTTPException(
                status_code=401,
                detail="User not authenticated"
            )
        
        subscription = await service.get_customer_subscription(customer_id)
        
        if not subscription:
            raise HTTPException(
                status_code=404,
                detail="No active subscription found"
            )
        
        return SubscriptionResponse.from_entity(subscription)
        
    except HTTPException:
        raise
    except ResourceNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="No active subscription found"
        )
    except Exception as e:
        logger.error(f"Error getting subscription: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )


@router.post("/subscription/cancel")
async def cancel_subscription(
    request: CancelSubscriptionRequest,
    service: BillingService = Depends(get_billing_service),
    current_user = Depends(get_current_user)
) -> dict:
    """Cancel current subscription."""
    try:
        customer_id = current_user.get("id")
        if not customer_id:
            raise HTTPException(
                status_code=401,
                detail="User not authenticated"
            )
        
        success = await service.cancel_subscription(
            customer_id=customer_id,
            at_period_end=request.at_period_end
        )
        
        return {
            "success": success,
            "message": "Subscription canceled successfully"
        }
        
    except ResourceNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="No active subscription found"
        )
    except BusinessLogicError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error canceling subscription: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )


@router.put("/subscription/plan")
async def update_subscription_plan(
    request: UpdateSubscriptionRequest,
    service: BillingService = Depends(get_billing_service),
    current_user = Depends(get_current_user)
) -> SubscriptionResponse:
    """Update subscription to a different plan."""
    try:
        customer_id = current_user.get("id")
        if not customer_id:
            raise HTTPException(
                status_code=401,
                detail="User not authenticated"
            )
        
        updated_subscription = await service.update_subscription_plan(
            customer_id=customer_id,
            new_plan_type=request.plan_type
        )
        
        return SubscriptionResponse.from_entity(updated_subscription)
        
    except ResourceNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="No active subscription found"
        )
    except BusinessLogicError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except ExternalServiceError:
        raise HTTPException(
            status_code=503,
            detail="Payment service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"Error updating subscription: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )


@router.get("/invoices", response_model=List[InvoiceResponse])
async def get_invoices(
    limit: int = 10,
    service: BillingService = Depends(get_billing_service),
    current_user = Depends(get_current_user)
) -> List[InvoiceResponse]:
    """Get invoices for authenticated user."""
    try:
        customer_id = current_user.get("id")
        if not customer_id:
            raise HTTPException(
                status_code=401,
                detail="User not authenticated"
            )
        
        invoices = await service.get_customer_invoices(
            customer_id=customer_id,
            limit=min(limit, 100)  # Cap at 100
        )
        
        return [InvoiceResponse.from_entity(invoice) for invoice in invoices]
        
    except ResourceNotFoundError:
        return []  # Return empty list if customer not found
    except Exception as e:
        logger.error(f"Error getting invoices: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )


@router.post("/webhook/stripe")
async def handle_stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
    service: BillingService = Depends(get_billing_service)
) -> dict:
    """Handle Stripe webhook events."""
    try:
        # Get raw body
        body = await request.body()
        
        if not stripe_signature:
            raise HTTPException(
                status_code=400,
                detail="Missing Stripe signature"
            )
        
        # Verify and parse webhook
        payment_processor = StripePaymentProcessor()
        event = payment_processor.verify_webhook_signature(
            payload=body,
            signature=stripe_signature
        )
        
        # Process event
        success = await service.handle_webhook_event(event)
        
        return {
            "success": success,
            "event_id": event.id
        }
        
    except ValidationError as e:
        logger.error(f"Invalid webhook: {e}")
        raise HTTPException(
            status_code=400,
            detail="Invalid webhook signature"
        )
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        # Return 200 to avoid Stripe retries on internal errors
        return {
            "success": False,
            "error": "Internal error processing webhook"
        }