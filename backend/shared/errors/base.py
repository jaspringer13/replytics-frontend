"""
Base error classes for domain-driven architecture.

This module provides a standardized error hierarchy for the entire application,
ensuring consistent error handling and meaningful error messages across all domains.
"""

from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime


class ErrorSeverity(Enum):
    """Severity levels for errors."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ErrorCategory(Enum):
    """Categories for classifying errors."""
    VALIDATION = "validation"
    BUSINESS_RULE = "business_rule"
    AUTHORIZATION = "authorization"
    NOT_FOUND = "not_found"
    CONFLICT = "conflict"
    EXTERNAL_SERVICE = "external_service"
    INTERNAL = "internal"
    SYSTEM = "system"


@dataclass
class ErrorContext:
    """Context information for an error."""
    domain: str
    operation: str
    user_id: Optional[str] = None
    business_id: Optional[str] = None
    request_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)


class DomainError(Exception):
    """
    Base exception for all domain errors.
    
    This provides a consistent interface for error handling across the application.
    """
    
    def __init__(
        self,
        message: str,
        code: str,
        category: ErrorCategory,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        context: Optional[ErrorContext] = None,
        details: Optional[Dict[str, Any]] = None,
        inner_error: Optional[Exception] = None
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.category = category
        self.severity = severity
        self.context = context
        self.details = details or {}
        self.inner_error = inner_error
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary for API responses."""
        result = {
            "error": {
                "code": self.code,
                "message": self.message,
                "category": self.category.value,
                "severity": self.severity.value,
                "details": self.details
            }
        }
        
        if self.context:
            result["error"]["context"] = {
                "domain": self.context.domain,
                "operation": self.context.operation,
                "timestamp": self.context.timestamp.isoformat()
            }
            
        return result
    
    @property
    def http_status_code(self) -> int:
        """Map error category to HTTP status code."""
        status_map = {
            ErrorCategory.VALIDATION: 400,
            ErrorCategory.BUSINESS_RULE: 422,
            ErrorCategory.AUTHORIZATION: 403,
            ErrorCategory.NOT_FOUND: 404,
            ErrorCategory.CONFLICT: 409,
            ErrorCategory.EXTERNAL_SERVICE: 502,
            ErrorCategory.INTERNAL: 500,
            ErrorCategory.SYSTEM: 500
        }
        return status_map.get(self.category, 500)


class ValidationError(DomainError):
    """Raised when input validation fails."""
    
    def __init__(
        self,
        message: str,
        field_errors: Optional[Dict[str, List[str]]] = None,
        context: Optional[ErrorContext] = None
    ):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            category=ErrorCategory.VALIDATION,
            severity=ErrorSeverity.LOW,
            context=context,
            details={"field_errors": field_errors} if field_errors else {}
        )


class BusinessRuleViolation(DomainError):
    """Raised when a business rule is violated."""
    
    def __init__(
        self,
        message: str,
        rule: str,
        context: Optional[ErrorContext] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            code=f"BUSINESS_RULE_{rule.upper()}",
            category=ErrorCategory.BUSINESS_RULE,
            severity=ErrorSeverity.MEDIUM,
            context=context,
            details={"rule": rule, **(details or {})}
        )


class ResourceNotFoundError(DomainError):
    """Raised when a requested resource is not found."""
    
    def __init__(
        self,
        resource_type: str,
        resource_id: str,
        context: Optional[ErrorContext] = None
    ):
        super().__init__(
            message=f"{resource_type} with id '{resource_id}' not found",
            code=f"{resource_type.upper()}_NOT_FOUND",
            category=ErrorCategory.NOT_FOUND,
            severity=ErrorSeverity.LOW,
            context=context,
            details={"resource_type": resource_type, "resource_id": resource_id}
        )


class AuthorizationError(DomainError):
    """Raised when user lacks permission for an operation."""
    
    def __init__(
        self,
        message: str,
        required_permission: Optional[str] = None,
        context: Optional[ErrorContext] = None
    ):
        super().__init__(
            message=message,
            code="AUTHORIZATION_ERROR",
            category=ErrorCategory.AUTHORIZATION,
            severity=ErrorSeverity.HIGH,
            context=context,
            details={"required_permission": required_permission} if required_permission else {}
        )


class ConflictError(DomainError):
    """Raised when an operation would create a conflict."""
    
    def __init__(
        self,
        message: str,
        conflict_type: str,
        context: Optional[ErrorContext] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            code=f"CONFLICT_{conflict_type.upper()}",
            category=ErrorCategory.CONFLICT,
            severity=ErrorSeverity.MEDIUM,
            context=context,
            details={"conflict_type": conflict_type, **(details or {})}
        )


class ExternalServiceError(DomainError):
    """Raised when an external service fails."""
    
    def __init__(
        self,
        service_name: str,
        message: str,
        context: Optional[ErrorContext] = None,
        inner_error: Optional[Exception] = None
    ):
        super().__init__(
            message=f"{service_name} error: {message}",
            code=f"{service_name.upper()}_ERROR",
            category=ErrorCategory.EXTERNAL_SERVICE,
            severity=ErrorSeverity.HIGH,
            context=context,
            details={"service": service_name},
            inner_error=inner_error
        )


class InternalError(DomainError):
    """Raised for unexpected internal errors."""
    
    def __init__(
        self,
        message: str = "An unexpected error occurred",
        context: Optional[ErrorContext] = None,
        inner_error: Optional[Exception] = None
    ):
        super().__init__(
            message=message,
            code="INTERNAL_ERROR",
            category=ErrorCategory.INTERNAL,
            severity=ErrorSeverity.CRITICAL,
            context=context,
            inner_error=inner_error
        )


class DatabaseError(DomainError):
    """Database operation error."""
    
    def __init__(
        self,
        message: str = "Database operation failed",
        context: Optional[ErrorContext] = None,
        inner_error: Optional[Exception] = None
    ):
        super().__init__(
            message=message,
            code="DATABASE_ERROR",
            category=ErrorCategory.SYSTEM,
            severity=ErrorSeverity.HIGH,
            context=context,
            inner_error=inner_error
        )