"""
Standardized error handling for the application.

This module exports all error classes and handlers for easy importing.
"""

from .base import (
    DomainError,
    ValidationError,
    BusinessRuleViolation,
    ResourceNotFoundError,
    AuthorizationError,
    ConflictError,
    ExternalServiceError,
    InternalError,
    DatabaseError,
    ErrorContext,
    ErrorSeverity,
    ErrorCategory
)

# Alias for compatibility
BusinessLogicError = BusinessRuleViolation

from .handlers import (
    domain_error_handler,
    validation_error_handler,
    http_exception_handler,
    general_exception_handler,
    register_error_handlers
)

__all__ = [
    # Base errors
    "DomainError",
    "ValidationError",
    "BusinessRuleViolation",
    "BusinessLogicError",  # Alias
    "ResourceNotFoundError",
    "AuthorizationError",
    "ConflictError",
    "ExternalServiceError",
    "InternalError",
    "DatabaseError",
    
    # Context and enums
    "ErrorContext",
    "ErrorSeverity",
    "ErrorCategory",
    
    # Handlers
    "domain_error_handler",
    "validation_error_handler",
    "http_exception_handler",
    "general_exception_handler",
    "register_error_handlers"
]