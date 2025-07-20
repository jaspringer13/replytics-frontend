"""
Billing repository interfaces.

This module defines abstract interfaces for billing data access and
payment processing operations.
"""

from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from datetime import datetime

from ..entities import (
    Customer, Subscription, Invoice, PaymentMethod,
    CheckoutSession, PlanType, BillingEvent
)


class IBillingRepository(ABC):
    """Interface for billing data operations."""
    
    @abstractmethod
    async def get_customer_by_email(self, email: str) -> Optional[Customer]:
        """Get customer by email address."""
        pass
    
    @abstractmethod
    async def get_customer_by_stripe_id(self, stripe_customer_id: str) -> Optional[Customer]:
        """Get customer by Stripe customer ID."""
        pass
    
    @abstractmethod
    async def create_customer(self, customer: Customer) -> Customer:
        """Create a new customer."""
        pass
    
    @abstractmethod
    async def update_customer(self, customer_id: str, updates: Dict[str, Any]) -> Optional[Customer]:
        """Update customer information."""
        pass
    
    @abstractmethod
    async def get_customer_subscription(self, customer_id: str) -> Optional[Subscription]:
        """Get active subscription for a customer."""
        pass
    
    @abstractmethod
    async def get_customer_invoices(
        self,
        customer_id: str,
        limit: int = 10
    ) -> List[Invoice]:
        """Get invoices for a customer."""
        pass
    
    @abstractmethod
    async def create_subscription(self, subscription: Subscription) -> Subscription:
        """Create a new subscription record."""
        pass
    
    @abstractmethod
    async def update_subscription(
        self,
        subscription_id: str,
        updates: Dict[str, Any]
    ) -> Optional[Subscription]:
        """Update subscription information."""
        pass
    
    @abstractmethod
    async def get_customer_payment_methods(self, customer_id: str) -> List[PaymentMethod]:
        """Get payment methods for a customer."""
        pass
    
    @abstractmethod
    async def set_default_payment_method(
        self,
        customer_id: str,
        payment_method_id: str
    ) -> bool:
        """Set default payment method for a customer."""
        pass


class IPaymentProcessor(ABC):
    """Interface for payment processing operations."""
    
    @abstractmethod
    async def create_customer(
        self,
        email: str,
        name: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Create a customer in the payment processor."""
        pass
    
    @abstractmethod
    async def create_checkout_session(
        self,
        session: CheckoutSession
    ) -> str:
        """Create a checkout session and return the URL."""
        pass
    
    @abstractmethod
    async def cancel_subscription(
        self,
        subscription_id: str,
        at_period_end: bool = True
    ) -> bool:
        """Cancel a subscription."""
        pass
    
    @abstractmethod
    async def update_subscription(
        self,
        subscription_id: str,
        plan_type: PlanType
    ) -> bool:
        """Update subscription to a different plan."""
        pass
    
    @abstractmethod
    async def retrieve_customer(self, customer_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve customer details from payment processor."""
        pass
    
    @abstractmethod
    async def retrieve_subscription(self, subscription_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve subscription details from payment processor."""
        pass
    
    @abstractmethod
    async def retrieve_invoice(self, invoice_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve invoice details from payment processor."""
        pass
    
    @abstractmethod
    async def list_customer_invoices(
        self,
        customer_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """List invoices for a customer from payment processor."""
        pass
    
    @abstractmethod
    def verify_webhook_signature(
        self,
        payload: bytes,
        signature: str
    ) -> BillingEvent:
        """Verify webhook signature and return parsed event."""
        pass
    
    @abstractmethod
    def is_configured(self) -> bool:
        """Check if payment processor is properly configured."""
        pass