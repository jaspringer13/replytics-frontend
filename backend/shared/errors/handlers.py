"""
FastAPI error handlers for domain errors.

This module provides centralized error handling for FastAPI applications,
converting domain errors into appropriate HTTP responses.
"""

import logging
import traceback
from typing import Dict, Any
from uuid import uuid4

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError, HTTPException
from starlette.exceptions import HTTPException as StarletteHTTPException

from .base import DomainError, ErrorContext, ErrorSeverity, InternalError


logger = logging.getLogger(__name__)


async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    """Handle domain errors and convert to JSON response."""
    # Generate request ID if not present
    request_id = getattr(request.state, "request_id", str(uuid4()))
    
    # Log error based on severity
    log_error(exc, request_id)
    
    # Add request context if not present
    if not exc.context:
        exc.context = ErrorContext(
            domain="unknown",
            operation=f"{request.method} {request.url.path}",
            request_id=request_id
        )
    elif not exc.context.request_id:
        exc.context.request_id = request_id
    
    # Create response
    response_data = exc.to_dict()
    response_data["request_id"] = request_id
    
    return JSONResponse(
        status_code=exc.http_status_code,
        content=response_data,
        headers={"X-Request-ID": request_id}
    )


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle Pydantic validation errors."""
    request_id = getattr(request.state, "request_id", str(uuid4()))
    
    # Convert Pydantic errors to our format
    field_errors: Dict[str, list] = {}
    for error in exc.errors():
        field_path = ".".join(str(loc) for loc in error["loc"])
        if field_path not in field_errors:
            field_errors[field_path] = []
        field_errors[field_path].append(error["msg"])
    
    response_data = {
        "error": {
            "code": "VALIDATION_ERROR",
            "message": "Invalid request data",
            "category": "validation",
            "severity": "low",
            "details": {"field_errors": field_errors}
        },
        "request_id": request_id
    }
    
    logger.warning(
        f"Validation error on {request.method} {request.url.path}",
        extra={
            "request_id": request_id,
            "field_errors": field_errors
        }
    )
    
    return JSONResponse(
        status_code=422,
        content=response_data,
        headers={"X-Request-ID": request_id}
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTP exceptions."""
    request_id = getattr(request.state, "request_id", str(uuid4()))
    
    response_data = {
        "error": {
            "code": f"HTTP_{exc.status_code}",
            "message": exc.detail,
            "category": "http_error",
            "severity": "medium" if exc.status_code < 500 else "high"
        },
        "request_id": request_id
    }
    
    if exc.status_code >= 500:
        logger.error(
            f"HTTP {exc.status_code} on {request.method} {request.url.path}: {exc.detail}",
            extra={"request_id": request_id}
        )
    else:
        logger.warning(
            f"HTTP {exc.status_code} on {request.method} {request.url.path}: {exc.detail}",
            extra={"request_id": request_id}
        )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=response_data,
        headers={"X-Request-ID": request_id}
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    request_id = getattr(request.state, "request_id", str(uuid4()))
    
    # Log full traceback
    logger.error(
        f"Unexpected error on {request.method} {request.url.path}",
        extra={
            "request_id": request_id,
            "exception_type": type(exc).__name__,
            "exception_message": str(exc),
            "traceback": traceback.format_exc()
        }
    )
    
    # Create internal error
    internal_error = InternalError(
        context=ErrorContext(
            domain="unknown",
            operation=f"{request.method} {request.url.path}",
            request_id=request_id
        ),
        inner_error=exc
    )
    
    response_data = internal_error.to_dict()
    response_data["request_id"] = request_id
    
    # Don't expose internal details in production
    if not getattr(request.app.state, "debug", False):
        response_data["error"]["message"] = "An unexpected error occurred"
        response_data["error"]["details"] = {}
    
    return JSONResponse(
        status_code=500,
        content=response_data,
        headers={"X-Request-ID": request_id}
    )


def log_error(error: DomainError, request_id: str) -> None:
    """Log error based on severity."""
    log_data = {
        "request_id": request_id,
        "error_code": error.code,
        "error_category": error.category.value,
        "error_severity": error.severity.value,
        "error_details": error.details
    }
    
    if error.context:
        log_data.update({
            "domain": error.context.domain,
            "operation": error.context.operation,
            "user_id": error.context.user_id,
            "business_id": error.context.business_id
        })
    
    # Log with appropriate level
    if error.severity == ErrorSeverity.CRITICAL:
        logger.critical(error.message, extra=log_data, exc_info=error.inner_error)
    elif error.severity == ErrorSeverity.HIGH:
        logger.error(error.message, extra=log_data, exc_info=error.inner_error)
    elif error.severity == ErrorSeverity.MEDIUM:
        logger.warning(error.message, extra=log_data)
    else:
        logger.info(error.message, extra=log_data)


def register_error_handlers(app):
    """Register all error handlers with a FastAPI app."""
    app.add_exception_handler(DomainError, domain_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)