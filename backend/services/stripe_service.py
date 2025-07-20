"""
Stripe service for payment processing and billing management.

This module now acts as a compatibility layer that uses the new billing domain structure
while maintaining backward compatibility with existing code.
"""

import os
import stripe
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import HTTPException
import logging
import asyncio

from domains.billing import PlanType, BillingService
from domains.billing.repositories import StripePaymentProcessor, SupabaseBillingRepository
from domains.billing.entities import CheckoutSession
from shared.errors import ExternalServiceError, BusinessLogicError, ValidationError

logger = logging.getLogger(__name__)


class StripeService:
    """Legacy compatibility layer for Stripe operations using new billing domain."""
    
    def __init__(self):
        # Initialize new domain components
        self.payment_processor = StripePaymentProcessor()
        self.api_key = os.getenv("STRIPE_SECRET_KEY")
        self.webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        
        # Legacy price IDs mapping
        self.price_ids = {
            "starter": os.getenv("STRIPE_STARTER_PRICE_ID"),
            "professional": os.getenv("STRIPE_PROFESSIONAL_PRICE_ID"),
            "enterprise": os.getenv("STRIPE_ENTERPRISE_PRICE_ID")
        }
        
        if not self.api_key:
            logger.warning("STRIPE_SECRET_KEY not configured")
            return
        
        # Validate price IDs when Stripe is configured
        missing_prices = [plan for plan, price_id in self.price_ids.items() if not price_id]
        if missing_prices:
            logger.warning(f"Missing Stripe price IDs for plans: {missing_prices}")
        
        stripe.api_key = self.api_key
        
        # Note: BillingService would be initialized per-request with proper repository
        
    def is_configured(self) -> bool:
        """Check if Stripe is properly configured."""
        return self.payment_processor.is_configured()
    
    async def get_customer_invoices(self, customer_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get invoices for a specific customer."""
        try:
            # Use payment processor directly for compatibility
            stripe_invoices = await self.payment_processor.list_customer_invoices(
                customer_id, 
                limit
            )
            
            # Format invoices in legacy format
            formatted_invoices = []
            for invoice in stripe_invoices:
                formatted_invoices.append({
                    "id": invoice.get("id"),
                    "date": datetime.fromtimestamp(
                        invoice.get("created", 0), tz=timezone.utc
                    ).isoformat(),
                    "amount": invoice.get("amount_paid", 0) / 100,  # Convert from cents
                    "currency": invoice.get("currency", "USD").upper(),
                    "status": invoice.get("status"),
                    "description": invoice.get("description") or f"Invoice #{invoice.get('number')}",
                    "downloadUrl": invoice.get("invoice_pdf"),
                    "hostedInvoiceUrl": invoice.get("hosted_invoice_url"),
                    "number": invoice.get("number"),
                    "subtotal": invoice.get("subtotal", 0) / 100,
                    "tax": invoice.get("tax", 0) / 100,
                    "total": invoice.get("total", 0) / 100,
                    "period": {
                        "start": datetime.fromtimestamp(
                            invoice.get("period_start", 0), tz=timezone.utc
                        ).isoformat() if invoice.get("period_start") else None,
                        "end": datetime.fromtimestamp(
                            invoice.get("period_end", 0), tz=timezone.utc
                        ).isoformat() if invoice.get("period_end") else None
                    }
                })
            
            return formatted_invoices
            
        except ExternalServiceError as e:
            logger.error(f"External service error fetching invoices: {e}")
            raise HTTPException(status_code=503, detail="Payment provider not configured") from e
        except Exception as e:
            logger.error(f"Unexpected error fetching invoices: {e}")
            raise HTTPException(status_code=500, detail="Internal server error") from e
    
    async def get_customer_by_email(self, email: str) -> Optional[str]:
        """Get Stripe customer ID by email."""
        if not self.is_configured():
            return None
        
        try:
            customers = stripe.Customer.list(email=email, limit=1)
            if customers.data:
                return customers.data[0].id
            return None
        except stripe.error.StripeError as e:
            logger.error(f"Error finding customer: {e}")
            return None
    
    async def create_customer(self, email: str, name: str = None, business_id: str = None) -> str:
        """Create a new Stripe customer."""
        try:
            metadata = {"business_id": business_id} if business_id else None
            customer_id = await self.payment_processor.create_customer(
                email=email,
                name=name,
                metadata=metadata
            )
            return customer_id
            
        except ExternalServiceError as e:
            logger.error(f"External service error creating customer: {e}")
            raise HTTPException(status_code=503, detail="Payment provider not configured") from e
        except Exception as e:
            logger.error(f"Error creating customer: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to create customer: {str(e)}") from e
    
    async def get_or_create_customer(self, email: str, name: str = None, business_id: str = None) -> str:
        """Get existing customer or create new one."""
        customer_id = await self.get_customer_by_email(email)
        if customer_id:
            return customer_id
        
        return await self.create_customer(email, name, business_id)
    
    async def create_checkout_session(
        self, 
        customer_email: str, 
        plan: str, 
        success_url: str, 
        cancel_url: str,
        business_id: str = None
    ) -> str:
        """Create a Stripe checkout session for subscription."""
        try:
            # Map legacy plan string to PlanType enum
            plan_type_map = {
                "starter": PlanType.STARTER,
                "professional": PlanType.PROFESSIONAL,
                "enterprise": PlanType.ENTERPRISE
            }
            
            if plan not in plan_type_map:
                raise HTTPException(status_code=400, detail=f"Invalid plan: {plan}")
            
            plan_type = plan_type_map[plan]
            
            # Create checkout session using payment processor
            session = CheckoutSession(
                customer_email=customer_email,
                plan_type=plan_type,
                success_url=success_url,
                cancel_url=cancel_url,
                business_id=business_id
            )
            
            checkout_url = await self.payment_processor.create_checkout_session(session)
            return checkout_url
            
        except ValidationError as e:
            logger.error(f"Validation error: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid plan: {plan}") from e
        except ExternalServiceError as e:
            logger.error(f"External service error: {e}")
            raise HTTPException(status_code=503, detail="Payment provider not configured") from e
        except Exception as e:
            logger.error(f"Error creating checkout session: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to create checkout session: {str(e)}") from e
    
    async def get_customer_subscription(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """Get active subscription for a customer."""
        if not self.is_configured():
            return None
        
        try:
            # Use payment processor to get subscription
            subscription_data = await self.payment_processor.retrieve_subscription(customer_id)
            if not subscription_data:
                return None
            
            # Format in legacy format
            items = subscription_data.get("items", {}).get("data", [])
            if items:
                item = items[0]
                price = item.get("price", {})
                return {
                    "id": subscription_data.get("id"),
                    "status": subscription_data.get("status"),
                    "current_period_start": datetime.fromtimestamp(
                        subscription_data.get("current_period_start", 0), tz=timezone.utc
                    ).isoformat(),
                    "current_period_end": datetime.fromtimestamp(
                        subscription_data.get("current_period_end", 0), tz=timezone.utc
                    ).isoformat(),
                    "plan": price.get("nickname", "unknown"),
                    "amount": price.get("unit_amount", 0) / 100,
                    "currency": price.get("currency", "USD").upper(),
                    "interval": price.get("recurring", {}).get("interval", "month")
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching subscription: {e}")
            return None
    
    async def cancel_subscription(self, subscription_id: str) -> bool:
        """Cancel a subscription."""
        try:
            success = await self.payment_processor.cancel_subscription(
                subscription_id,
                at_period_end=True
            )
            return success
            
        except ExternalServiceError as e:
            logger.error(f"External service error canceling subscription: {e}")
            raise HTTPException(status_code=503, detail="Payment provider not configured") from e
        except Exception as e:
            logger.error(f"Error canceling subscription: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to cancel subscription: {str(e)}") from e
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> Dict[str, Any]:
        """Verify Stripe webhook signature and parse event."""
        try:
            # Use payment processor for verification
            billing_event = self.payment_processor.verify_webhook_signature(
                payload=payload,
                signature=signature
            )
            
            # Convert back to legacy format for compatibility
            return {
                "id": billing_event.id,
                "type": billing_event.type,
                "data": billing_event.data,
                "created": int(billing_event.created_at.timestamp())
            }
            
        except ValidationError as e:
            logger.error(f"Webhook validation error: {e}")
            if "signature" in str(e).lower():
                raise HTTPException(status_code=400, detail="Invalid signature") from e
            raise HTTPException(status_code=400, detail="Invalid payload") from e
        except ExternalServiceError as e:
            logger.error(f"Webhook configuration error: {e}")
            raise HTTPException(status_code=500, detail="Webhook secret not configured") from e


# Global instance
stripe_service = StripeService()