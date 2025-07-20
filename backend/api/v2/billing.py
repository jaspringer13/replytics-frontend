"""
Billing API routes for v2.

This module properly integrates the billing domain controller into the FastAPI app,
handling the dependency injection that the domain layer shouldn't know about.
"""

# Import the billing controller when needed for web layer
# This keeps the import dependencies at the edge of the system
from domains.billing.controllers import router as billing_router

# Re-export for convenience
__all__ = ["billing_router"]