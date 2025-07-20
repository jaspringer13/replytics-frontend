"""
Billing service layer.

This module provides the business logic for billing operations,
coordinating between repositories and payment processors.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import logging

from ..entities import (
    Customer, Subscription, Invoice, PaymentMethod,
    CheckoutSession, PlanType, BillingEvent,
    SubscriptionStatus, PlanConfig, Price
)
from ..repositories.interfaces import IBillingRepository, IPaymentProcessor
from shared.errors import (
    BusinessRuleViolation, ExternalServiceError, 
    ResourceNotFoundError, ValidationError, ErrorContext,
    InternalError
)


logger = logging.getLogger(__name__)


class BillingService:
    """Service for billing operations."""
    
    def __init__(
        self,
        repository: IBillingRepository,
        payment_processor: IPaymentProcessor
    ):
        self.repository = repository
        self.payment_processor = payment_processor
    
    def _create_error_context(self, operation: str, **kwargs) -> ErrorContext:
        """Create error context for operations."""
        return ErrorContext(
            domain="billing",
            operation=f"billing_service.{operation}",
            metadata=kwargs
        )
    
    async def create_checkout_session(
        self,
        email: str,
        plan_type: PlanType,
        success_url: str,
        cancel_url: str,
        business_id: Optional[str] = None
    ) -> str:
        """Create a checkout session for subscription purchase."""
        try:
            # Check if customer already exists
            existing_customer = await self.repository.get_customer_by_email(email)
            if existing_customer and existing_customer.stripe_customer_id:
                # Check if they already have an active subscription
                subscription = await self.repository.get_customer_subscription(
                    existing_customer.id
                )
                if subscription and subscription.is_active:
                    raise BusinessRuleViolation(
                        message="Customer already has an active subscription",
                        rule="duplicate_subscription",
                        context=self._create_error_context(
                            "create_checkout_session",
                            email=email,
                            plan=plan_type.value
                        )
                    )
            
            # Create checkout session
            session = CheckoutSession(
                customer_email=email,
                plan_type=plan_type,
                success_url=success_url,
                cancel_url=cancel_url,
                business_id=business_id
            )
            
            checkout_url = await self.payment_processor.create_checkout_session(session)
            return checkout_url
            
        except (BusinessRuleViolation, ExternalServiceError):
            raise
        except Exception as e:
            logger.error(f"Unexpected error creating checkout session: {e}")
            raise InternalError(
                message="Failed to create checkout session",
                context=self._create_error_context(
                    "create_checkout_session",
                    email=email,
                    plan=plan_type.value
                ),
                inner_error=e
            ) from e
    
    async def get_customer_subscription(
        self,
        customer_id: str
    ) -> Optional[Subscription]:
        """Get active subscription for a customer."""
        try:
            subscription = await self.repository.get_customer_subscription(customer_id)
            
            # If subscription exists in DB and has Stripe ID, sync with Stripe
            if subscription and subscription.stripe_subscription_id:
                stripe_data = await self.payment_processor.retrieve_subscription(
                    subscription.stripe_subscription_id
                )
                if stripe_data:
                    # Update local subscription with latest Stripe data
                    updates = self._map_stripe_subscription_updates(stripe_data)
                    if updates:
                        subscription = await self.repository.update_subscription(
                            subscription.id,
                            updates
                        )
            
            return subscription
            
        except Exception as e:
            logger.error(f"Error getting customer subscription: {e}")
            raise InternalError(
                message="Failed to retrieve subscription",
                context=self._create_error_context(
                    "get_customer_subscription",
                    customer_id=customer_id
                ),
                inner_error=e
            ) from e
    
    async def cancel_subscription(
        self,
        customer_id: str,
        at_period_end: bool = True
    ) -> bool:
        """Cancel a customer's subscription."""
        try:
            # Get current subscription
            subscription = await self.repository.get_customer_subscription(customer_id)
            if not subscription:
                raise ResourceNotFoundError(
                    resource_type="subscription",
                    resource_id=customer_id,
                    context=self._create_error_context(
                        "cancel_subscription",
                        customer_id=customer_id
                    )
                )
            
            if not subscription.is_active:
                raise BusinessRuleViolation(
                    message="Subscription is not active",
                    rule="inactive_subscription",
                    context=self._create_error_context(
                        "cancel_subscription",
                        customer_id=customer_id,
                        status=subscription.status.value
                    )
                )
            
            # Cancel in Stripe
            if subscription.stripe_subscription_id:
                success = await self.payment_processor.cancel_subscription(
                    subscription.stripe_subscription_id,
                    at_period_end=at_period_end
                )
                if not success:
                    raise ExternalServiceError(
                        service_name="Stripe",
                        message="Failed to cancel subscription in payment processor",
                        context=self._create_error_context(
                            "cancel_subscription",
                            subscription_id=subscription.stripe_subscription_id
                        )
                    )
            
            # Update local subscription
            updates = {
                "cancel_at_period_end": at_period_end,
                "canceled_at": datetime.now(timezone.utc)
            }
            if not at_period_end:
                updates["status"] = SubscriptionStatus.CANCELED
            
            await self.repository.update_subscription(subscription.id, updates)
            return True
            
        except (ResourceNotFoundError, BusinessRuleViolation, ExternalServiceError):
            raise
        except Exception as e:
            logger.error(f"Unexpected error canceling subscription: {e}")
            raise InternalError(
                message="Failed to cancel subscription",
                context=self._create_error_context(
                    "cancel_subscription",
                    customer_id=customer_id
                ),
                inner_error=e
            ) from e
    
    async def update_subscription_plan(
        self,
        customer_id: str,
        new_plan_type: PlanType
    ) -> Subscription:
        """Update a customer's subscription to a different plan."""
        try:
            # Get current subscription
            subscription = await self.repository.get_customer_subscription(customer_id)
            if not subscription:
                raise ResourceNotFoundError(
                    resource_type="subscription",
                    resource_id=customer_id,
                    context=self._create_error_context(
                        "update_subscription_plan",
                        customer_id=customer_id
                    )
                )
            
            if subscription.plan_type == new_plan_type:
                raise BusinessRuleViolation(
                    message="Customer already on this plan",
                    rule="same_plan",
                    context=self._create_error_context(
                        "update_subscription_plan",
                        customer_id=customer_id,
                        plan=new_plan_type.value
                    )
                )
            
            # Update in Stripe
            if subscription.stripe_subscription_id:
                success = await self.payment_processor.update_subscription(
                    subscription.stripe_subscription_id,
                    new_plan_type
                )
                if not success:
                    raise ExternalServiceError(
                        service_name="Stripe",
                        message="Failed to update subscription in payment processor",
                        context=self._create_error_context(
                            "update_subscription_plan",
                            subscription_id=subscription.stripe_subscription_id
                        )
                    )
            
            # Update local subscription
            updated = await self.repository.update_subscription(
                subscription.id,
                {"plan_type": new_plan_type}
            )
            
            if not updated:
                raise InternalError(
                    message="Failed to update subscription in database",
                    context=self._create_error_context(
                        "update_subscription_plan",
                        subscription_id=subscription.id
                    )
                )
            
            return updated
            
        except (ResourceNotFoundError, BusinessRuleViolation, ExternalServiceError):
            raise
        except Exception as e:
            logger.error(f"Unexpected error updating subscription plan: {e}")
            raise InternalError(
                message="Failed to update subscription plan",
                context=self._create_error_context(
                    "update_subscription_plan",
                    customer_id=customer_id,
                    new_plan=new_plan_type.value
                ),
                inner_error=e
            ) from e
    
    async def get_customer_invoices(
        self,
        customer_id: str,
        limit: int = 10
    ) -> List[Invoice]:
        """Get invoices for a customer."""
        try:
            # Get customer
            customer = await self.repository.get_customer_by_email(customer_id)
            if not customer:
                raise ResourceNotFoundError(
                    resource_type="customer",
                    resource_id=customer_id,
                    context=self._create_error_context(
                        "get_customer_invoices",
                        customer_id=customer_id
                    )
                )
            
            # Get invoices from repository
            invoices = await self.repository.get_customer_invoices(customer.id, limit)
            
            # If customer has Stripe ID, sync with Stripe
            if customer.stripe_customer_id and self.payment_processor.is_configured():
                try:
                    stripe_invoices = await self.payment_processor.list_customer_invoices(
                        customer.stripe_customer_id,
                        limit
                    )
                    # TODO: Sync Stripe invoices with local database
                except Exception as e:
                    logger.warning(f"Failed to sync invoices from Stripe: {e}")
            
            return invoices
            
        except ResourceNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error getting customer invoices: {e}")
            raise InternalError(
                message="Failed to retrieve invoices",
                context=self._create_error_context(
                    "get_customer_invoices",
                    customer_id=customer_id
                ),
                inner_error=e
            ) from e
    
    async def handle_webhook_event(
        self,
        event: BillingEvent
    ) -> bool:
        """Handle billing webhook events."""
        try:
            logger.info(f"Processing billing event: {event.type}")
            
            # Route to appropriate handler
            handlers = {
                "checkout.session.completed": self._handle_checkout_completed,
                "invoice.payment_succeeded": self._handle_invoice_paid,
                "invoice.payment_failed": self._handle_invoice_failed,
                "customer.subscription.updated": self._handle_subscription_updated,
                "customer.subscription.deleted": self._handle_subscription_deleted,
            }
            
            handler = handlers.get(event.type)
            if handler:
                await handler(event)
                return True
            
            logger.warning(f"No handler for event type: {event.type}")
            return False
            
        except Exception as e:
            logger.error(f"Error handling webhook event: {e}")
            raise InternalError(
                message=f"Failed to process {event.type} event",
                context=self._create_error_context(
                    "handle_webhook_event",
                    event_type=event.type,
                    event_id=event.id
                ),
                inner_error=e
            ) from e
    
    async def _handle_checkout_completed(self, event: BillingEvent) -> None:
        """Handle successful checkout session."""
        session_data = event.data.get("object", {})
        customer_email = session_data.get("customer_email")
        stripe_customer_id = session_data.get("customer")
        stripe_subscription_id = session_data.get("subscription")
        metadata = session_data.get("metadata", {})
        
        if not all([customer_email, stripe_customer_id, stripe_subscription_id]):
            logger.error(f"Missing required data in checkout.session.completed event")
            return
        
        # Create or update customer
        customer = await self.repository.get_customer_by_email(customer_email)
        if not customer:
            customer = Customer(
                id=f"cus_{datetime.now().timestamp()}",  # Generate ID
                email=customer_email,
                stripe_customer_id=stripe_customer_id,
                business_id=metadata.get("business_id")
            )
            customer = await self.repository.create_customer(customer)
        elif not customer.stripe_customer_id:
            await self.repository.update_customer(
                customer.id,
                {"stripe_customer_id": stripe_customer_id}
            )
        
        # Get subscription details from Stripe
        stripe_sub = await self.payment_processor.retrieve_subscription(
            stripe_subscription_id
        )
        if stripe_sub:
            # Create subscription record
            subscription = Subscription(
                id=f"sub_{datetime.now().timestamp()}",
                customer_id=customer.id,
                plan_type=PlanType(metadata.get("plan", "starter")),
                status=SubscriptionStatus(stripe_sub["status"]),
                current_period_start=datetime.fromtimestamp(
                    stripe_sub["current_period_start"], tz=timezone.utc
                ),
                current_period_end=datetime.fromtimestamp(
                    stripe_sub["current_period_end"], tz=timezone.utc
                ),
                stripe_subscription_id=stripe_subscription_id
            )
            await self.repository.create_subscription(subscription)
    
    async def _handle_invoice_paid(self, event: BillingEvent) -> None:
        """Handle successful invoice payment."""
        # TODO: Implement invoice payment handling
        pass
    
    async def _handle_invoice_failed(self, event: BillingEvent) -> None:
        """Handle failed invoice payment."""
        # TODO: Implement failed payment handling
        pass
    
    async def _handle_subscription_updated(self, event: BillingEvent) -> None:
        """Handle subscription updates."""
        # TODO: Implement subscription update handling
        pass
    
    async def _handle_subscription_deleted(self, event: BillingEvent) -> None:
        """Handle subscription deletion."""
        # TODO: Implement subscription deletion handling
        pass
    
    def _map_stripe_subscription_updates(
        self,
        stripe_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Map Stripe subscription data to local updates."""
        updates = {}
        
        if "status" in stripe_data:
            updates["status"] = SubscriptionStatus(stripe_data["status"])
        
        if "current_period_end" in stripe_data:
            updates["current_period_end"] = datetime.fromtimestamp(
                stripe_data["current_period_end"], tz=timezone.utc
            )
        
        if "current_period_start" in stripe_data:
            updates["current_period_start"] = datetime.fromtimestamp(
                stripe_data["current_period_start"], tz=timezone.utc
            )
        
        if "cancel_at_period_end" in stripe_data:
            updates["cancel_at_period_end"] = stripe_data["cancel_at_period_end"]
        
        if "canceled_at" in stripe_data and stripe_data["canceled_at"]:
            updates["canceled_at"] = datetime.fromtimestamp(
                stripe_data["canceled_at"], tz=timezone.utc
            )
        
        return updates