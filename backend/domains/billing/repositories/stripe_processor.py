"""
Stripe implementation of payment processor.

This module provides the Stripe-specific implementation of payment processing,
abstracting Stripe API calls behind the IPaymentProcessor interface.
"""

import os
import stripe
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import logging

from .interfaces import IPaymentProcessor
from ..entities import (
    CheckoutSession, PlanType, BillingEvent,
    Price, SubscriptionStatus, InvoiceStatus
)
from shared.errors import (
    ExternalServiceError, ErrorContext, ValidationError
)


logger = logging.getLogger(__name__)


class StripePaymentProcessor(IPaymentProcessor):
    """Stripe implementation of payment processor."""
    
    def __init__(self):
        self.api_key = os.getenv("STRIPE_SECRET_KEY")
        self.webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        self.price_ids = {
            PlanType.STARTER: os.getenv("STRIPE_STARTER_PRICE_ID"),
            PlanType.PROFESSIONAL: os.getenv("STRIPE_PROFESSIONAL_PRICE_ID"),
            PlanType.ENTERPRISE: os.getenv("STRIPE_ENTERPRISE_PRICE_ID")
        }
        
        if self.api_key:
            stripe.api_key = self.api_key
            
            # Validate price IDs when Stripe is configured
            missing_prices = [
                plan.value for plan, price_id in self.price_ids.items() 
                if not price_id
            ]
            if missing_prices:
                logger.warning(f"Missing Stripe price IDs for plans: {missing_prices}")
        else:
            logger.warning("STRIPE_SECRET_KEY not configured")
    
    def _create_error_context(self, operation: str, **kwargs) -> ErrorContext:
        """Create error context for operations."""
        return ErrorContext(
            domain="billing",
            operation=f"stripe.{operation}",
            metadata=kwargs
        )
    
    def is_configured(self) -> bool:
        """Check if Stripe is properly configured."""
        return bool(self.api_key)
    
    def _ensure_configured(self):
        """Ensure Stripe is configured before operations."""
        if not self.is_configured():
            raise ExternalServiceError(
                service_name="Stripe",
                message="Payment processor not configured",
                context=self._create_error_context("check_configuration")
            )
    
    async def create_customer(
        self,
        email: str,
        name: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create a customer in Stripe."""
        self._ensure_configured()
        
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata=metadata or {}
            )
            return customer.id
            
        except stripe.error.StripeError as e:
            logger.error(f"Error creating Stripe customer: {e}")
            raise ExternalServiceError(
                service_name="Stripe",
                message=f"Failed to create customer: {str(e)}",
                context=self._create_error_context("create_customer", email=email),
                inner_error=e
            ) from e
    
    async def create_checkout_session(
        self,
        session: CheckoutSession
    ) -> str:
        """Create a Stripe checkout session."""
        self._ensure_configured()
        
        price_id = self.price_ids.get(session.plan_type)
        if not price_id:
            raise ValidationError(
                message=f"Invalid plan: {session.plan_type.value}",
                field_errors={"plan_type": [f"No price ID configured for {session.plan_type.value}"]},
                context=self._create_error_context("create_checkout_session")
            )
        
        try:
            # Get or create customer
            customers = stripe.Customer.list(email=session.customer_email, limit=1)
            customer_id = customers.data[0].id if customers.data else None
            
            if not customer_id:
                customer = stripe.Customer.create(
                    email=session.customer_email,
                    metadata={"business_id": session.business_id} if session.business_id else {}
                )
                customer_id = customer.id
            
            # Create checkout session
            checkout_session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=session.success_url,
                cancel_url=session.cancel_url,
                metadata={
                    "business_id": session.business_id,
                    "plan": session.plan_type.value,
                    **session.metadata
                }
            )
            
            return checkout_session.url
            
        except stripe.error.StripeError as e:
            logger.error(f"Error creating checkout session: {e}")
            raise ExternalServiceError(
                service_name="Stripe",
                message=f"Failed to create checkout session: {str(e)}",
                context=self._create_error_context(
                    "create_checkout_session",
                    plan=session.plan_type.value
                ),
                inner_error=e
            ) from e
    
    async def cancel_subscription(
        self,
        subscription_id: str,
        at_period_end: bool = True
    ) -> bool:
        """Cancel a Stripe subscription."""
        self._ensure_configured()
        
        try:
            if at_period_end:
                stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            else:
                stripe.Subscription.cancel(subscription_id)
            
            return True
            
        except stripe.error.StripeError as e:
            logger.error(f"Error canceling subscription: {e}")
            raise ExternalServiceError(
                service_name="Stripe",
                message=f"Failed to cancel subscription: {str(e)}",
                context=self._create_error_context(
                    "cancel_subscription",
                    subscription_id=subscription_id
                ),
                inner_error=e
            ) from e
    
    async def update_subscription(
        self,
        subscription_id: str,
        plan_type: PlanType
    ) -> bool:
        """Update subscription to a different plan."""
        self._ensure_configured()
        
        price_id = self.price_ids.get(plan_type)
        if not price_id:
            raise ValidationError(
                message=f"Invalid plan: {plan_type.value}",
                field_errors={"plan_type": [f"No price ID configured for {plan_type.value}"]},
                context=self._create_error_context("update_subscription")
            )
        
        try:
            # Get subscription
            subscription = stripe.Subscription.retrieve(subscription_id)
            
            # Update the subscription item with new price
            stripe.Subscription.modify(
                subscription_id,
                items=[{
                    'id': subscription['items']['data'][0].id,
                    'price': price_id,
                }]
            )
            
            return True
            
        except stripe.error.StripeError as e:
            logger.error(f"Error updating subscription: {e}")
            raise ExternalServiceError(
                service_name="Stripe",
                message=f"Failed to update subscription: {str(e)}",
                context=self._create_error_context(
                    "update_subscription",
                    subscription_id=subscription_id,
                    plan=plan_type.value
                ),
                inner_error=e
            ) from e
    
    async def retrieve_customer(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve customer from Stripe."""
        self._ensure_configured()
        
        try:
            customer = stripe.Customer.retrieve(customer_id)
            return customer.to_dict()
        except stripe.error.StripeError as e:
            logger.error(f"Error retrieving customer: {e}")
            return None
    
    async def retrieve_subscription(self, subscription_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve subscription from Stripe."""
        self._ensure_configured()
        
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            return subscription.to_dict()
        except stripe.error.StripeError as e:
            logger.error(f"Error retrieving subscription: {e}")
            return None
    
    async def retrieve_invoice(self, invoice_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve invoice from Stripe."""
        self._ensure_configured()
        
        try:
            invoice = stripe.Invoice.retrieve(invoice_id)
            return invoice.to_dict()
        except stripe.error.StripeError as e:
            logger.error(f"Error retrieving invoice: {e}")
            return None
    
    async def list_customer_invoices(
        self,
        customer_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """List invoices for a customer from Stripe."""
        self._ensure_configured()
        
        try:
            invoices = stripe.Invoice.list(
                customer=customer_id,
                limit=limit,
                expand=['data.charge']
            )
            return [invoice.to_dict() for invoice in invoices.data]
            
        except stripe.error.StripeError as e:
            logger.error(f"Error listing invoices: {e}")
            raise ExternalServiceError(
                service_name="Stripe",
                message=f"Failed to fetch invoices: {str(e)}",
                context=self._create_error_context(
                    "list_invoices",
                    customer_id=customer_id
                ),
                inner_error=e
            ) from e
    
    def verify_webhook_signature(
        self,
        payload: bytes,
        signature: str
    ) -> BillingEvent:
        """Verify Stripe webhook signature and return parsed event."""
        if not self.webhook_secret:
            raise ExternalServiceError(
                service_name="Stripe",
                message="Webhook secret not configured",
                context=self._create_error_context("verify_webhook")
            )
        
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, self.webhook_secret
            )
            
            return BillingEvent(
                id=event['id'],
                type=event['type'],
                data=event['data'],
                created_at=datetime.fromtimestamp(event['created'], tz=timezone.utc),
                stripe_event_id=event['id']
            )
            
        except ValueError as e:
            logger.error("Invalid webhook payload")
            raise ValidationError(
                message="Invalid webhook payload",
                context=self._create_error_context("verify_webhook")
            ) from e
        except stripe.error.SignatureVerificationError as e:
            logger.error("Invalid webhook signature")
            raise ValidationError(
                message="Invalid webhook signature",
                context=self._create_error_context("verify_webhook")
            ) from e