"""
Billing domain entities.

This module defines the core business objects for the billing domain,
representing subscriptions, invoices, and payment-related data.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from decimal import Decimal


class PlanType(Enum):
    """Subscription plan types."""
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(Enum):
    """Subscription status."""
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    INCOMPLETE = "incomplete"
    INCOMPLETE_EXPIRED = "incomplete_expired"
    TRIALING = "trialing"
    UNPAID = "unpaid"


class InvoiceStatus(Enum):
    """Invoice status."""
    DRAFT = "draft"
    OPEN = "open"
    PAID = "paid"
    UNCOLLECTIBLE = "uncollectible"
    VOID = "void"


class PaymentMethodType(Enum):
    """Payment method types."""
    CARD = "card"
    BANK_ACCOUNT = "bank_account"
    PAYPAL = "paypal"


@dataclass
class Price:
    """Price information."""
    amount: Decimal
    currency: str = "USD"
    
    @property
    def amount_in_cents(self) -> int:
        """Get amount in cents for Stripe."""
        return int(self.amount * 100)
    
    @classmethod
    def from_cents(cls, cents: int, currency: str = "USD") -> "Price":
        """Create Price from cents value."""
        return cls(amount=Decimal(cents) / 100, currency=currency)


@dataclass
class PlanConfig:
    """Configuration for a subscription plan."""
    plan_type: PlanType
    name: str
    price: Price
    features: List[str]
    limits: Dict[str, int]  # e.g., {"max_calls": 1000, "max_sms": 500}
    stripe_price_id: Optional[str] = None


@dataclass
class Customer:
    """Billing customer entity."""
    id: str
    email: str
    name: Optional[str] = None
    business_id: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Subscription:
    """Subscription entity."""
    id: str
    customer_id: str
    plan_type: PlanType
    status: SubscriptionStatus
    current_period_start: datetime
    current_period_end: datetime
    stripe_subscription_id: Optional[str] = None
    price: Optional[Price] = None
    canceled_at: Optional[datetime] = None
    cancel_at_period_end: bool = False
    trial_end: Optional[datetime] = None
    
    @property
    def is_active(self) -> bool:
        """Check if subscription is active."""
        return self.status in [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.TRIALING
        ]
    
    @property
    def is_canceled(self) -> bool:
        """Check if subscription is canceled."""
        return self.status == SubscriptionStatus.CANCELED or self.canceled_at is not None
    
    @property
    def days_until_renewal(self) -> int:
        """Calculate days until renewal."""
        if not self.is_active:
            return 0
        delta = self.current_period_end - datetime.utcnow()
        return max(0, delta.days)


@dataclass
class Invoice:
    """Invoice entity."""
    id: str
    customer_id: str
    subscription_id: Optional[str]
    status: InvoiceStatus
    amount_due: Price
    amount_paid: Price
    created_at: datetime
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    number: Optional[str] = None
    description: Optional[str] = None
    stripe_invoice_id: Optional[str] = None
    pdf_url: Optional[str] = None
    hosted_invoice_url: Optional[str] = None
    
    @property
    def is_paid(self) -> bool:
        """Check if invoice is paid."""
        return self.status == InvoiceStatus.PAID
    
    @property
    def amount_outstanding(self) -> Decimal:
        """Calculate outstanding amount."""
        return self.amount_due.amount - self.amount_paid.amount


@dataclass
class PaymentMethod:
    """Payment method entity."""
    id: str
    customer_id: str
    type: PaymentMethodType
    last4: str
    brand: Optional[str] = None  # For cards
    exp_month: Optional[int] = None  # For cards
    exp_year: Optional[int] = None  # For cards
    is_default: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)
    stripe_payment_method_id: Optional[str] = None


@dataclass
class CheckoutSession:
    """Checkout session for creating subscriptions."""
    customer_email: str
    plan_type: PlanType
    success_url: str
    cancel_url: str
    business_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BillingEvent:
    """Billing-related event."""
    id: str
    type: str  # e.g., "invoice.payment_succeeded", "subscription.updated"
    data: Dict[str, Any]
    created_at: datetime
    stripe_event_id: Optional[str] = None