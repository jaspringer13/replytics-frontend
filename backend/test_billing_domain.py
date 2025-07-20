#!/usr/bin/env python3
"""
Test billing domain components in isolation.

This test focuses on the core domain logic without requiring
the full application stack or external dependencies.
"""

import asyncio
import sys
from pathlib import Path
from unittest.mock import Mock, AsyncMock

# Add backend directory to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))


def test_core_entities():
    """Test that core billing entities can be instantiated."""
    print("\n=== Testing Core Entities ===")
    
    from domains.billing.entities import (
        PlanType, SubscriptionStatus, InvoiceStatus,
        Customer, Subscription, Invoice, Price,
        CheckoutSession, BillingEvent
    )
    from datetime import datetime, timezone
    from decimal import Decimal
    
    # Test Price entity
    price = Price(amount=Decimal("49.99"), currency="USD")
    assert price.amount_in_cents == 4999
    print("✓ Price entity works correctly")
    
    # Test Price.from_cents
    price_from_cents = Price.from_cents(2999)
    assert price_from_cents.amount == Decimal("29.99")
    print("✓ Price.from_cents works correctly")
    
    # Test Customer entity
    customer = Customer(
        id="cus_123",
        email="test@example.com",
        name="Test User",
        business_id="bus_456",
        stripe_customer_id="stripe_cus_789"
    )
    assert customer.email == "test@example.com"
    print("✓ Customer entity created successfully")
    
    # Test Subscription entity
    subscription = Subscription(
        id="sub_123",
        customer_id="cus_123",
        plan_type=PlanType.PROFESSIONAL,
        status=SubscriptionStatus.ACTIVE,
        current_period_start=datetime.now(timezone.utc),
        current_period_end=datetime.now(timezone.utc),
        price=price
    )
    assert subscription.is_active == True
    assert subscription.plan_type == PlanType.PROFESSIONAL
    print("✓ Subscription entity created successfully")
    
    # Test CheckoutSession
    session = CheckoutSession(
        customer_email="test@example.com",
        plan_type=PlanType.STARTER,
        success_url="http://localhost:3000/success",
        cancel_url="http://localhost:3000/cancel"
    )
    assert session.plan_type == PlanType.STARTER
    print("✓ CheckoutSession entity created successfully")
    
    return True


async def test_billing_service():
    """Test billing service with mocked dependencies."""
    print("\n=== Testing Billing Service ===")
    
    from domains.billing.services import BillingService
    from domains.billing.entities import PlanType, CheckoutSession
    from shared.errors import BusinessRuleViolation
    
    # Create mock dependencies
    mock_repository = Mock()
    mock_payment_processor = Mock()
    
    # Configure mock behavior
    mock_repository.get_customer_by_email = AsyncMock(return_value=None)
    mock_repository.get_customer_subscription = AsyncMock(return_value=None)
    mock_payment_processor.create_checkout_session = AsyncMock(
        return_value="https://checkout.stripe.com/test"
    )
    
    # Create service
    service = BillingService(mock_repository, mock_payment_processor)
    
    # Test checkout session creation
    checkout_url = await service.create_checkout_session(
        email="new@example.com",
        plan_type=PlanType.PROFESSIONAL,
        success_url="http://localhost:3000/success",
        cancel_url="http://localhost:3000/cancel",
        business_id="bus_123"
    )
    
    assert checkout_url == "https://checkout.stripe.com/test"
    mock_payment_processor.create_checkout_session.assert_called_once()
    print("✓ BillingService.create_checkout_session works correctly")
    
    # Test with existing active subscription
    mock_repository.get_customer_by_email = AsyncMock(return_value=Mock(
        id="cus_123",
        stripe_customer_id="stripe_123"
    ))
    mock_repository.get_customer_subscription = AsyncMock(return_value=Mock(
        is_active=True
    ))
    
    try:
        await service.create_checkout_session(
            email="existing@example.com",
            plan_type=PlanType.PROFESSIONAL,
            success_url="http://localhost:3000/success",
            cancel_url="http://localhost:3000/cancel"
        )
        assert False, "Should have raised BusinessRuleViolation"
    except BusinessRuleViolation as e:
        assert "already has an active subscription" in str(e)
        print("✓ BillingService correctly prevents duplicate subscriptions")
    
    return True


def test_repository_interfaces():
    """Test that repository interfaces are properly defined."""
    print("\n=== Testing Repository Interfaces ===")
    
    from domains.billing.repositories.interfaces import (
        IBillingRepository, IPaymentProcessor
    )
    import inspect
    
    # Check IBillingRepository has required methods
    required_billing_methods = [
        'get_customer_by_email',
        'get_customer_by_stripe_id',
        'create_customer',
        'update_customer',
        'get_customer_subscription',
        'get_customer_invoices',
        'create_subscription',
        'update_subscription'
    ]
    
    # Get all abstract methods from the interface
    billing_methods = [
        name for name, method in inspect.getmembers(IBillingRepository)
        if hasattr(method, '__isabstractmethod__') and method.__isabstractmethod__
    ]
    
    for method in required_billing_methods:
        assert method in billing_methods, f"Missing method: {method}"
    print("✓ IBillingRepository interface is complete")
    
    # Check IPaymentProcessor has required methods
    required_payment_methods = [
        'create_customer',
        'create_checkout_session',
        'cancel_subscription',
        'update_subscription',
        'verify_webhook_signature',
        'is_configured'
    ]
    
    # Get all abstract methods from the interface
    payment_methods = [
        name for name, method in inspect.getmembers(IPaymentProcessor)
        if hasattr(method, '__isabstractmethod__') and method.__isabstractmethod__
    ]
    
    for method in required_payment_methods:
        assert method in payment_methods, f"Missing method: {method}"
    print("✓ IPaymentProcessor interface is complete")
    
    return True


def test_error_handling():
    """Test that error handling is properly structured."""
    print("\n=== Testing Error Handling ===")
    
    from shared.errors import (
        BusinessRuleViolation, ExternalServiceError,
        ValidationError, ResourceNotFoundError,
        DatabaseError, ErrorContext
    )
    
    # Test error context
    context = ErrorContext(
        domain="billing",
        operation="create_checkout",
        user_id="user_123",
        business_id="bus_456"
    )
    assert context.domain == "billing"
    print("✓ ErrorContext created successfully")
    
    # Test BusinessRuleViolation
    error = BusinessRuleViolation(
        message="Invalid operation",
        rule="duplicate_subscription",
        context=context
    )
    assert error.http_status_code == 422
    assert "BUSINESS_RULE_DUPLICATE_SUBSCRIPTION" in error.code
    print("✓ BusinessRuleViolation works correctly")
    
    # Test ExternalServiceError
    error = ExternalServiceError(
        service_name="Stripe",
        message="API rate limit exceeded",
        context=context
    )
    assert error.http_status_code == 502
    assert "STRIPE_ERROR" in error.code
    print("✓ ExternalServiceError works correctly")
    
    # Test DatabaseError
    error = DatabaseError(
        message="Connection timeout",
        context=context
    )
    assert error.http_status_code == 500
    assert error.code == "DATABASE_ERROR"
    print("✓ DatabaseError works correctly")
    
    return True


async def main():
    """Run all tests."""
    print("Testing Billing Domain Components")
    print("=" * 50)
    
    # Test core components without external dependencies
    success = True
    
    try:
        success &= test_core_entities()
        success &= await test_billing_service()
        success &= test_repository_interfaces()
        success &= test_error_handling()
    except Exception as e:
        print(f"\n✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        success = False
    
    print("\n" + "=" * 50)
    if success:
        print("✅ All tests passed! The billing domain is properly structured.")
    else:
        print("❌ Some tests failed. Please check the output above.")
    
    return success


if __name__ == "__main__":
    result = asyncio.run(main())
    sys.exit(0 if result else 1)