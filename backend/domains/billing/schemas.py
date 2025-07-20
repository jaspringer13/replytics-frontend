"""
Billing API schemas.

This module defines request and response models for billing endpoints.
"""

from pydantic import BaseModel, Field, HttpUrl, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

from .entities import (
    PlanType, SubscriptionStatus, InvoiceStatus,
    Subscription, Invoice, Customer, PaymentMethod
)


class CreateCheckoutRequest(BaseModel):
    """Request for creating checkout session."""
    email: str = Field(..., description="Customer email address")
    plan_type: PlanType = Field(..., description="Subscription plan to purchase")
    success_url: HttpUrl = Field(..., description="URL to redirect after successful payment")
    cancel_url: HttpUrl = Field(..., description="URL to redirect if payment is canceled")


class CreateCheckoutResponse(BaseModel):
    """Response for checkout session creation."""
    checkout_url: str = Field(..., description="URL to redirect customer for payment")
    success: bool = Field(True, description="Whether session was created successfully")


class UpdateSubscriptionRequest(BaseModel):
    """Request for updating subscription plan."""
    plan_type: PlanType = Field(..., description="New subscription plan")


class CancelSubscriptionRequest(BaseModel):
    """Request for canceling subscription."""
    at_period_end: bool = Field(
        True,
        description="Whether to cancel at end of billing period"
    )


class PriceResponse(BaseModel):
    """Price information response."""
    amount: Decimal = Field(..., description="Price amount")
    currency: str = Field("USD", description="Currency code")
    
    model_config = ConfigDict(from_attributes=True)


class SubscriptionResponse(BaseModel):
    """Subscription information response."""
    id: str
    plan_type: PlanType
    status: SubscriptionStatus
    current_period_start: datetime
    current_period_end: datetime
    price: Optional[PriceResponse] = None
    canceled_at: Optional[datetime] = None
    cancel_at_period_end: bool = False
    trial_end: Optional[datetime] = None
    is_active: bool
    is_canceled: bool
    days_until_renewal: int
    
    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def from_entity(cls, subscription: Subscription) -> "SubscriptionResponse":
        """Create response from subscription entity."""
        return cls(
            id=subscription.id,
            plan_type=subscription.plan_type,
            status=subscription.status,
            current_period_start=subscription.current_period_start,
            current_period_end=subscription.current_period_end,
            price=PriceResponse.model_validate(subscription.price) if subscription.price else None,
            canceled_at=subscription.canceled_at,
            cancel_at_period_end=subscription.cancel_at_period_end,
            trial_end=subscription.trial_end,
            is_active=subscription.is_active,
            is_canceled=subscription.is_canceled,
            days_until_renewal=subscription.days_until_renewal
        )


class InvoiceResponse(BaseModel):
    """Invoice information response."""
    id: str
    status: InvoiceStatus
    amount_due: PriceResponse
    amount_paid: PriceResponse
    created_at: datetime
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    number: Optional[str] = None
    description: Optional[str] = None
    pdf_url: Optional[str] = None
    hosted_invoice_url: Optional[str] = None
    is_paid: bool
    amount_outstanding: Decimal
    
    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def from_entity(cls, invoice: Invoice) -> "InvoiceResponse":
        """Create response from invoice entity."""
        return cls(
            id=invoice.id,
            status=invoice.status,
            amount_due=PriceResponse.model_validate(invoice.amount_due),
            amount_paid=PriceResponse.model_validate(invoice.amount_paid),
            created_at=invoice.created_at,
            due_date=invoice.due_date,
            paid_at=invoice.paid_at,
            number=invoice.number,
            description=invoice.description,
            pdf_url=invoice.pdf_url,
            hosted_invoice_url=invoice.hosted_invoice_url,
            is_paid=invoice.is_paid,
            amount_outstanding=invoice.amount_outstanding
        )


class CustomerResponse(BaseModel):
    """Customer information response."""
    id: str
    email: str
    name: Optional[str] = None
    business_id: Optional[str] = None
    created_at: datetime
    has_payment_method: bool = False
    
    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def from_entity(cls, customer: Customer) -> "CustomerResponse":
        """Create response from customer entity."""
        return cls(
            id=customer.id,
            email=customer.email,
            name=customer.name,
            business_id=customer.business_id,
            created_at=customer.created_at,
            has_payment_method=bool(customer.stripe_customer_id)
        )


class BillingOverviewResponse(BaseModel):
    """Complete billing overview response."""
    customer: Optional[CustomerResponse] = None
    subscription: Optional[SubscriptionResponse] = None
    recent_invoices: List[InvoiceResponse] = Field(default_factory=list)
    has_payment_method: bool = False


class WebhookEventResponse(BaseModel):
    """Response for webhook processing."""
    success: bool
    event_id: str
    message: Optional[str] = None