"""
Supabase implementation of billing repository.

This module provides data access for billing entities using Supabase.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import logging

from supabase import Client
from postgrest.exceptions import APIError

from .interfaces import IBillingRepository
from ..entities import (
    Customer, Subscription, Invoice, PaymentMethod,
    SubscriptionStatus, InvoiceStatus, PaymentMethodType,
    PlanType, Price
)
from shared.interfaces import SupabaseRepository
from shared.errors import (
    DatabaseError, ResourceNotFoundError, ErrorContext
)


logger = logging.getLogger(__name__)


class SupabaseBillingRepository(SupabaseRepository, IBillingRepository):
    """Supabase implementation of billing repository."""
    
    def __init__(self, client: Client):
        super().__init__(client)
    
    async def get_customer_by_email(self, email: str) -> Optional[Customer]:
        """Get customer by email address."""
        try:
            response = await self._execute_query(
                self.client
                .table("customers")
                .select("*")
                .eq("email", email)
                .single()
            )
            
            return self._map_to_customer(response.data) if response.data else None
            
        except APIError as e:
            if "PGRST116" in str(e):  # No rows returned
                return None
            logger.error(f"Error getting customer by email: {e}")
            raise DatabaseError(
                message=f"Failed to get customer: {str(e)}",
                context=ErrorContext(
                    domain="billing",
                    operation="get_customer_by_email",
                    metadata={"email": email}
                ),
                inner_error=e
            ) from e
    
    async def get_customer_by_stripe_id(self, stripe_customer_id: str) -> Optional[Customer]:
        """Get customer by Stripe customer ID."""
        try:
            response = await self._execute_query(
                self.client
                .table("customers")
                .select("*")
                .eq("stripe_customer_id", stripe_customer_id)
                .single()
            )
            
            return self._map_to_customer(response.data) if response.data else None
            
        except APIError as e:
            if "PGRST116" in str(e):  # No rows returned
                return None
            logger.error(f"Error getting customer by Stripe ID: {e}")
            raise DatabaseError(
                message=f"Failed to get customer: {str(e)}",
                context=ErrorContext(
                    domain="billing",
                    operation="get_customer_by_stripe_id",
                    metadata={"stripe_customer_id": stripe_customer_id}
                ),
                inner_error=e
            ) from e
    
    async def create_customer(self, customer: Customer) -> Customer:
        """Create a new customer."""
        try:
            data = {
                "id": customer.id,
                "email": customer.email,
                "name": customer.name,
                "business_id": customer.business_id,
                "stripe_customer_id": customer.stripe_customer_id,
                "metadata": customer.metadata,
                "created_at": customer.created_at.isoformat()
            }
            
            response = await self._execute_query(
                self.client
                .table("customers")
                .insert(data)
                .single()
            )
            
            return self._map_to_customer(response.data)
            
        except APIError as e:
            logger.error(f"Error creating customer: {e}")
            raise DatabaseError(
                message=f"Failed to create customer: {str(e)}",
                context=ErrorContext(
                    domain="billing",
                    operation="create_customer",
                    metadata={"email": customer.email}
                ),
                inner_error=e
            ) from e
    
    async def update_customer(self, customer_id: str, updates: Dict[str, Any]) -> Optional[Customer]:
        """Update customer information."""
        try:
            response = await self._execute_query(
                self.client
                .table("customers")
                .update(updates)
                .eq("id", customer_id)
                .single()
            )
            
            return self._map_to_customer(response.data) if response.data else None
            
        except APIError as e:
            if "PGRST116" in str(e):  # No rows returned
                return None
            logger.error(f"Error updating customer: {e}")
            raise DatabaseError(
                message=f"Failed to update customer: {str(e)}",
                context=ErrorContext(
                    domain="billing",
                    operation="update_customer",
                    metadata={"customer_id": customer_id}
                ),
                inner_error=e
            ) from e
    
    async def get_customer_subscription(self, customer_id: str) -> Optional[Subscription]:
        """Get active subscription for a customer."""
        try:
            response = await self._execute_query(
                self.client
                .table("subscriptions")
                .select("*")
                .eq("customer_id", customer_id)
                .in_("status", ["active", "trialing", "past_due"])
                .order("created_at", desc=True)
                .limit(1)
                .single()
            )
            
            return self._map_to_subscription(response.data) if response.data else None
            
        except APIError as e:
            if "PGRST116" in str(e):  # No rows returned
                return None
            logger.error(f"Error getting customer subscription: {e}")
            raise DatabaseError(
                message=f"Failed to get subscription: {str(e)}",
                context=ErrorContext(
                    domain="billing",
                    operation="get_customer_subscription",
                    metadata={"customer_id": customer_id}
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
            response = await self._execute_query(
                self.client
                .table("invoices")
                .select("*")
                .eq("customer_id", customer_id)
                .order("created_at", desc=True)
                .limit(limit)
            )
            
            return [
                self._map_to_invoice(invoice)
                for invoice in response.data
            ] if response.data else []
            
        except APIError as e:
            logger.error(f"Error getting customer invoices: {e}")
            raise DatabaseError(
                message=f"Failed to get invoices: {str(e)}",
                context=ErrorContext(
                    domain="billing",
                    operation="get_customer_invoices",
                    metadata={"customer_id": customer_id}
                ),
                inner_error=e
            ) from e
    
    async def create_subscription(self, subscription: Subscription) -> Subscription:
        """Create a new subscription record."""
        try:
            data = {
                "id": subscription.id,
                "customer_id": subscription.customer_id,
                "plan_type": subscription.plan_type.value,
                "status": subscription.status.value,
                "current_period_start": subscription.current_period_start.isoformat(),
                "current_period_end": subscription.current_period_end.isoformat(),
                "stripe_subscription_id": subscription.stripe_subscription_id,
                "price_amount": float(subscription.price.amount) if subscription.price else None,
                "price_currency": subscription.price.currency if subscription.price else None,
                "canceled_at": subscription.canceled_at.isoformat() if subscription.canceled_at else None,
                "cancel_at_period_end": subscription.cancel_at_period_end,
                "trial_end": subscription.trial_end.isoformat() if subscription.trial_end else None
            }
            
            response = await self._execute_query(
                self.client
                .table("subscriptions")
                .insert(data)
                .single()
            )
            
            return self._map_to_subscription(response.data)
            
        except APIError as e:
            logger.error(f"Error creating subscription: {e}")
            raise DatabaseError(
                message=f"Failed to create subscription: {str(e)}",
                context=ErrorContext(
                    domain="billing",
                    operation="create_subscription",
                    metadata={"customer_id": subscription.customer_id}
                ),
                inner_error=e
            ) from e
    
    async def update_subscription(
        self,
        subscription_id: str,
        updates: Dict[str, Any]
    ) -> Optional[Subscription]:
        """Update subscription information."""
        try:
            # Convert domain enums to strings for database
            if "status" in updates and hasattr(updates["status"], "value"):
                updates["status"] = updates["status"].value
            if "plan_type" in updates and hasattr(updates["plan_type"], "value"):
                updates["plan_type"] = updates["plan_type"].value
            
            # Convert datetime objects to ISO strings
            for field in ["canceled_at", "current_period_start", "current_period_end", "trial_end"]:
                if field in updates and updates[field] is not None:
                    if hasattr(updates[field], "isoformat"):
                        updates[field] = updates[field].isoformat()
            
            response = await self._execute_query(
                self.client
                .table("subscriptions")
                .update(updates)
                .eq("id", subscription_id)
                .single()
            )
            
            return self._map_to_subscription(response.data) if response.data else None
            
        except APIError as e:
            if "PGRST116" in str(e):  # No rows returned
                return None
            logger.error(f"Error updating subscription: {e}")
            raise DatabaseError(
                message=f"Failed to update subscription: {str(e)}",
                context=ErrorContext(
                    domain="billing",
                    operation="update_subscription",
                    metadata={"subscription_id": subscription_id}
                ),
                inner_error=e
            ) from e
    
    async def get_customer_payment_methods(self, customer_id: str) -> List[PaymentMethod]:
        """Get payment methods for a customer."""
        try:
            response = await self._execute_query(
                self.client
                .table("payment_methods")
                .select("*")
                .eq("customer_id", customer_id)
                .order("is_default", desc=True)
                .order("created_at", desc=True)
            )
            
            return [
                self._map_to_payment_method(pm)
                for pm in response.data
            ] if response.data else []
            
        except APIError as e:
            logger.error(f"Error getting payment methods: {e}")
            raise DatabaseError(
                message=f"Failed to get payment methods: {str(e)}",
                context=ErrorContext(
                    domain="billing",
                    operation="get_customer_payment_methods",
                    metadata={"customer_id": customer_id}
                ),
                inner_error=e
            ) from e
    
    async def set_default_payment_method(
        self,
        customer_id: str,
        payment_method_id: str
    ) -> bool:
        """Set default payment method for a customer."""
        try:
            # First, unset all current defaults
            await self._execute_query(
                self.client
                .table("payment_methods")
                .update({"is_default": False})
                .eq("customer_id", customer_id)
            )
            
            # Then set the new default
            response = await self._execute_query(
                self.client
                .table("payment_methods")
                .update({"is_default": True})
                .eq("id", payment_method_id)
                .eq("customer_id", customer_id)
                .single()
            )
            
            return response.data is not None
            
        except APIError as e:
            logger.error(f"Error setting default payment method: {e}")
            raise DatabaseError(
                message=f"Failed to set default payment method: {str(e)}",
                context=ErrorContext(
                    domain="billing",
                    operation="set_default_payment_method",
                    metadata={
                        "customer_id": customer_id,
                        "payment_method_id": payment_method_id
                    }
                ),
                inner_error=e
            ) from e
    
    def _map_to_customer(self, data: Dict[str, Any]) -> Customer:
        """Map database record to Customer entity."""
        return Customer(
            id=data["id"],
            email=data["email"],
            name=data.get("name"),
            business_id=data.get("business_id"),
            stripe_customer_id=data.get("stripe_customer_id"),
            created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")),
            metadata=data.get("metadata", {})
        )
    
    def _map_to_subscription(self, data: Dict[str, Any]) -> Subscription:
        """Map database record to Subscription entity."""
        price = None
        if data.get("price_amount") is not None:
            price = Price(
                amount=Decimal(str(data["price_amount"])),
                currency=data.get("price_currency", "USD")
            )
        
        return Subscription(
            id=data["id"],
            customer_id=data["customer_id"],
            plan_type=PlanType(data["plan_type"]),
            status=SubscriptionStatus(data["status"]),
            current_period_start=datetime.fromisoformat(
                data["current_period_start"].replace("Z", "+00:00")
            ),
            current_period_end=datetime.fromisoformat(
                data["current_period_end"].replace("Z", "+00:00")
            ),
            stripe_subscription_id=data.get("stripe_subscription_id"),
            price=price,
            canceled_at=datetime.fromisoformat(
                data["canceled_at"].replace("Z", "+00:00")
            ) if data.get("canceled_at") else None,
            cancel_at_period_end=data.get("cancel_at_period_end", False),
            trial_end=datetime.fromisoformat(
                data["trial_end"].replace("Z", "+00:00")
            ) if data.get("trial_end") else None
        )
    
    def _map_to_invoice(self, data: Dict[str, Any]) -> Invoice:
        """Map database record to Invoice entity."""
        return Invoice(
            id=data["id"],
            customer_id=data["customer_id"],
            subscription_id=data.get("subscription_id"),
            status=InvoiceStatus(data["status"]),
            amount_due=Price(
                amount=Decimal(str(data["amount_due"])),
                currency=data.get("currency", "USD")
            ),
            amount_paid=Price(
                amount=Decimal(str(data.get("amount_paid", 0))),
                currency=data.get("currency", "USD")
            ),
            created_at=datetime.fromisoformat(
                data["created_at"].replace("Z", "+00:00")
            ),
            due_date=datetime.fromisoformat(
                data["due_date"].replace("Z", "+00:00")
            ) if data.get("due_date") else None,
            paid_at=datetime.fromisoformat(
                data["paid_at"].replace("Z", "+00:00")
            ) if data.get("paid_at") else None,
            number=data.get("number"),
            description=data.get("description"),
            stripe_invoice_id=data.get("stripe_invoice_id"),
            pdf_url=data.get("pdf_url"),
            hosted_invoice_url=data.get("hosted_invoice_url")
        )
    
    def _map_to_payment_method(self, data: Dict[str, Any]) -> PaymentMethod:
        """Map database record to PaymentMethod entity."""
        return PaymentMethod(
            id=data["id"],
            customer_id=data["customer_id"],
            type=PaymentMethodType(data["type"]),
            last4=data["last4"],
            brand=data.get("brand"),
            exp_month=data.get("exp_month"),
            exp_year=data.get("exp_year"),
            is_default=data.get("is_default", False),
            created_at=datetime.fromisoformat(
                data["created_at"].replace("Z", "+00:00")
            ),
            stripe_payment_method_id=data.get("stripe_payment_method_id")
        )