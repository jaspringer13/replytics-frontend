"""
Stripe service for payment processing and billing management
"""

import os
import stripe
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)


class StripeService:
    """Service for managing Stripe payments, subscriptions, and billing"""
    
    def __init__(self):
        self.api_key = os.getenv("STRIPE_SECRET_KEY")
        self.webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
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
        
    def is_configured(self) -> bool:
        """Check if Stripe is properly configured"""
        return bool(self.api_key)
    
    async def get_customer_invoices(self, customer_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get invoices for a specific customer"""
        if not self.is_configured():
            raise HTTPException(status_code=503, detail="Payment provider not configured")
        
        try:
            # Get invoices from Stripe
            invoices = stripe.Invoice.list(
                customer=customer_id,
                limit=limit,
                expand=['data.charge']
            )
            
            formatted_invoices = []
            for invoice in invoices.data:
                formatted_invoices.append({
                    "id": invoice.id,
                    "date": datetime.fromtimestamp(invoice.created, tz=timezone.utc).isoformat(),
                    "amount": invoice.amount_paid / 100,  # Convert from cents
                    "currency": invoice.currency.upper(),
                    "status": invoice.status,
                    "description": invoice.description or f"Invoice #{invoice.number}",
                    "downloadUrl": invoice.invoice_pdf if invoice.invoice_pdf else None,
                    "hostedInvoiceUrl": invoice.hosted_invoice_url,
                    "number": invoice.number,
                    "subtotal": invoice.subtotal / 100,
                    "tax": invoice.tax / 100 if invoice.tax else 0,
                    "total": invoice.total / 100,
                    "period": {
                        "start": datetime.fromtimestamp(invoice.period_start, tz=timezone.utc).isoformat() if invoice.period_start else None,
                        "end": datetime.fromtimestamp(invoice.period_end, tz=timezone.utc).isoformat() if invoice.period_end else None
                    }
                })
            
            return formatted_invoices
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error fetching invoices: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to fetch invoices: {str(e)}") from e
        except Exception as e:
            logger.error(f"Unexpected error fetching invoices: {e}")
            raise HTTPException(status_code=500, detail="Internal server error") from e
    
    async def get_customer_by_email(self, email: str) -> Optional[str]:
        """Get Stripe customer ID by email"""
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
        """Create a new Stripe customer"""
        if not self.is_configured():
            raise HTTPException(status_code=503, detail="Payment provider not configured")
        
        try:
            metadata = {"business_id": business_id} if business_id else {}
            
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata=metadata
            )
            
            return customer.id
            
        except stripe.error.StripeError as e:
            logger.error(f"Error creating customer: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to create customer: {str(e)}") from e
    
    async def get_or_create_customer(self, email: str, name: str = None, business_id: str = None) -> str:
        """Get existing customer or create new one"""
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
        """Create a Stripe checkout session for subscription"""
        if not self.is_configured():
            raise HTTPException(status_code=503, detail="Payment provider not configured")
        
        price_id = self.price_ids.get(plan)
        if not price_id:
            raise HTTPException(status_code=400, detail=f"Invalid plan: {plan}")
        
        try:
            # Get or create customer
            customer_id = await self.get_or_create_customer(customer_email, business_id=business_id)
            
            # Create checkout session
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "business_id": business_id,
                    "plan": plan
                } if business_id else {"plan": plan}
            )
            
            return session.url
            
        except stripe.error.StripeError as e:
            logger.error(f"Error creating checkout session: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to create checkout session: {str(e)}") from e
    
    async def get_customer_subscription(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """Get active subscription for a customer"""
        if not self.is_configured():
            return None
        
        try:
            subscriptions = stripe.Subscription.list(
                customer=customer_id,
                status='active',
                limit=1
            )
            
            if subscriptions.data:
                sub = subscriptions.data[0]
                return {
                    "id": sub.id,
                    "status": sub.status,
                    "current_period_start": datetime.fromtimestamp(sub.current_period_start, tz=timezone.utc).isoformat(),
                    "current_period_end": datetime.fromtimestamp(sub.current_period_end, tz=timezone.utc).isoformat(),
                    "plan": sub.items.data[0].price.nickname if sub.items.data[0].price.nickname else "unknown",
                    "amount": sub.items.data[0].price.unit_amount / 100,
                    "currency": sub.items.data[0].price.currency.upper(),
                    "interval": sub.items.data[0].price.recurring.interval if sub.items.data[0].price.recurring else "month"
                }
            
            return None
            
        except stripe.error.StripeError as e:
            logger.error(f"Error fetching subscription: {e}")
            return None
    
    async def cancel_subscription(self, subscription_id: str) -> bool:
        """Cancel a subscription"""
        if not self.is_configured():
            raise HTTPException(status_code=503, detail="Payment provider not configured")
        
        try:
            stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
            return True
            
        except stripe.error.StripeError as e:
            logger.error(f"Error canceling subscription: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to cancel subscription: {str(e)}") from e
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> Dict[str, Any]:
        """Verify Stripe webhook signature and parse event"""
        if not self.webhook_secret:
            raise HTTPException(status_code=500, detail="Webhook secret not configured")
        
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, self.webhook_secret
            )
            return event
            
        except ValueError as e:
            logger.error("Invalid webhook payload")
            raise HTTPException(status_code=400, detail="Invalid payload") from e
        except stripe.error.SignatureVerificationError as e:
            logger.error("Invalid webhook signature")
            raise HTTPException(status_code=400, detail="Invalid signature") from e


# Global instance
stripe_service = StripeService()