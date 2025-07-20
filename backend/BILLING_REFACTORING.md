# Billing Domain Refactoring

## Overview

The billing module has been refactored to follow Domain-Driven Design (DDD) principles, abstracting Stripe behind a repository pattern and maintaining backward compatibility with existing code.

## Architecture

```
backend/
├── domains/
│   └── billing/
│       ├── entities.py              # Core domain objects
│       ├── repositories/            # Data access abstractions
│       │   ├── interfaces.py        # Repository contracts
│       │   ├── stripe_processor.py  # Stripe implementation
│       │   └── supabase_repository.py # Database implementation
│       ├── services/                # Business logic
│       │   └── billing_service.py   # Billing operations
│       ├── controllers/             # HTTP layer
│       │   └── billing_controller.py # FastAPI routes
│       └── schemas.py               # API models
└── services/
    └── stripe_service.py           # Legacy compatibility layer
```

## Key Design Decisions

### 1. Repository Pattern
- `IPaymentProcessor` interface abstracts payment processing
- `IBillingRepository` interface abstracts data persistence
- Allows swapping Stripe for another provider without changing business logic

### 2. Clean Error Handling
- Proper use of domain errors (`BusinessRuleViolation`, `ExternalServiceError`, etc.)
- Consistent error context with domain and operation tracking
- HTTP status codes derived from error categories

### 3. Dependency Injection
- Services receive repositories through constructor injection
- Controllers use FastAPI's dependency injection
- No hard dependencies on external services in domain layer

### 4. Backward Compatibility
- Legacy `stripe_service` maintained as adapter
- Existing API endpoints continue to work
- Gradual migration path for existing code

## Testing

### Unit Tests
```bash
python3 test_billing_domain.py
```
Tests core domain logic without external dependencies.

### Integration Tests
```bash
python3 test_stripe_compatibility.py
```
Ensures backward compatibility with existing code.

## Migration Guide

### For New Code
Use the new domain structure:
```python
from domains.billing import BillingService, PlanType
from domains.billing.repositories import SupabaseBillingRepository, StripePaymentProcessor

# In your FastAPI dependency
def get_billing_service(supabase=Depends(get_supabase_client)):
    repository = SupabaseBillingRepository(supabase)
    payment_processor = StripePaymentProcessor()
    return BillingService(repository, payment_processor)
```

### For Existing Code
The legacy `stripe_service` continues to work:
```python
from services.stripe_service import stripe_service

# Still works as before
checkout_url = await stripe_service.create_checkout_session(...)
```

## Benefits

1. **Testability**: Domain logic can be tested without Stripe or database
2. **Flexibility**: Easy to swap payment providers or add new ones
3. **Maintainability**: Clear separation of concerns
4. **Type Safety**: Strong typing with Pydantic models and enums
5. **Error Handling**: Consistent, meaningful errors across the domain

## Future Improvements

1. Add caching layer in repository
2. Implement event sourcing for billing events
3. Add comprehensive integration tests
4. Create billing dashboard components using the new API