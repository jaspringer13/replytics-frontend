"""
Voice Bot webhook handlers for real-time data synchronization.

This module provides secure webhook endpoints for receiving events from the Voice Bot service,
enabling real-time synchronization of business data, analytics, and configuration changes
between the Voice Bot and Dashboard systems.
"""

import hashlib
import hmac
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any

from fastapi import APIRouter, HTTPException, Header, Request, BackgroundTasks
from pydantic import BaseModel, Field, validator

from config.settings import get_settings
from services.stripe_service import stripe_service
from services.supabase_service import SupabaseService

# Setup logging
logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter()


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class WebhookEvent(BaseModel):
    """Base webhook event model."""
    type: str = Field(..., description="Event type identifier")
    data: Dict[str, Any] = Field(..., description="Event payload data")
    timestamp: Optional[str] = Field(None, description="Event timestamp (ISO format)")
    business_id: Optional[str] = Field(None, description="Associated business ID")
    event_id: Optional[str] = Field(None, description="Unique event identifier")
    
    @validator('type')
    def validate_event_type(cls, v):
        """Validate event type format."""
        allowed_types = {
            'business.updated', 'business.created',
            'service.created', 'service.updated', 'service.deleted',
            'hours.updated',
            'call.completed', 'call.started', 'call.failed',
            'booking.created', 'booking.updated', 'booking.cancelled',
            'analytics.updated',
            'settings.updated',
            'integration.connected', 'integration.disconnected',
            'payment.succeeded', 'payment.failed',
            'subscription.created', 'subscription.updated', 'subscription.cancelled'
        }
        
        if v not in allowed_types:
            raise ValueError(f"Unknown webhook event type: {v}. Allowed types: {', '.join(sorted(allowed_types))}")
        
        return v

    class Config:
        schema_extra = {
            "example": {
                "type": "business.updated",
                "data": {
                    "business_id": "bus_123456",
                    "changes": ["name", "phone"],
                    "updated_data": {
                        "name": "New Business Name",
                        "phone": "+1-555-123-4567"
                    }
                },
                "timestamp": "2024-01-15T10:30:00Z",
                "business_id": "bus_123456",
                "event_id": "evt_789012"
            }
        }


class WebhookResponse(BaseModel):
    """Standard webhook response model."""
    status: str = Field(..., description="Processing status")
    message: Optional[str] = Field(None, description="Response message")
    processed_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    event_id: Optional[str] = Field(None, description="Event ID that was processed")


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def verify_webhook_signature(
    payload: bytes,
    signature: str,
    secret: str
) -> bool:
    """
    Verify webhook signature using HMAC-SHA256.
    
    Args:
        payload: Raw request payload bytes
        signature: Provided signature from headers
        secret: Webhook secret for verification
        
    Returns:
        bool: True if signature is valid, False otherwise
    """
    try:
        # Remove any 'sha256=' prefix from signature
        if signature.startswith('sha256='):
            signature = signature[7:]
        
        # Generate expected signature
        expected = hmac.new(
            secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        # Use constant-time comparison to prevent timing attacks
        return hmac.compare_digest(expected, signature)
        
    except Exception as e:
        logger.error(f"Error verifying webhook signature: {e}")
        return False


async def process_business_event(event: WebhookEvent) -> Dict[str, Any]:
    """
    Process business-related webhook events.
    
    Args:
        event: The webhook event to process
        
    Returns:
        Processing result dictionary
    """
    event_type = event.type
    data = event.data
    business_id = data.get('business_id') or event.business_id
    
    logger.info(f"Processing business event: {event_type} for business {business_id}")
    
    try:
        if event_type == 'business.updated':
            # Handle business profile updates
            changes = data.get('changes', [])
            updated_data = data.get('updated_data', {})
            
            logger.info(f"Business {business_id} updated fields: {changes}")
            
            # TODO: Sync changes to Dashboard database
            # This would involve updating the business profile in Supabase
            # await sync_business_profile_to_dashboard(business_id, updated_data)
            
            return {
                "action": "business_profile_synced",
                "business_id": business_id,
                "updated_fields": changes
            }
            
        elif event_type == 'business.created':
            # Handle new business creation
            business_data = data.get('business_data', {})
            
            logger.info(f"New business created: {business_id}")
            
            # TODO: Create business profile in Dashboard database
            # await create_business_profile_in_dashboard(business_id, business_data)
            
            return {
                "action": "business_profile_created",
                "business_id": business_id
            }
        
        else:
            logger.warning(f"Unhandled business event type: {event_type}")
            return {
                "action": "ignored",
                "reason": f"Unhandled event type: {event_type}"
            }
            
    except Exception as e:
        logger.error(f"Error processing business event {event_type}: {e}")
        raise


async def process_service_event(event: WebhookEvent) -> Dict[str, Any]:
    """
    Process service-related webhook events.
    
    Args:
        event: The webhook event to process
        
    Returns:
        Processing result dictionary
    """
    event_type = event.type
    data = event.data
    business_id = data.get('business_id') or event.business_id
    service_id = data.get('service_id')
    
    logger.info(f"Processing service event: {event_type} for business {business_id}, service {service_id}")
    
    try:
        if event_type == 'service.created':
            service_data = data.get('service_data', {})
            
            logger.info(f"New service created: {service_id} for business {business_id}")
            
            # TODO: Add service to Dashboard database
            # await create_service_in_dashboard(business_id, service_id, service_data)
            
            return {
                "action": "service_created",
                "business_id": business_id,
                "service_id": service_id
            }
            
        elif event_type == 'service.updated':
            changes = data.get('changes', [])
            updated_data = data.get('updated_data', {})
            
            logger.info(f"Service {service_id} updated for business {business_id}")
            
            # TODO: Update service in Dashboard database
            # await update_service_in_dashboard(business_id, service_id, updated_data)
            
            return {
                "action": "service_updated",
                "business_id": business_id,
                "service_id": service_id,
                "updated_fields": changes
            }
            
        elif event_type == 'service.deleted':
            logger.info(f"Service {service_id} deleted for business {business_id}")
            
            # TODO: Mark service as deleted in Dashboard database
            # await delete_service_in_dashboard(business_id, service_id)
            
            return {
                "action": "service_deleted",
                "business_id": business_id,
                "service_id": service_id
            }
        
        else:
            logger.warning(f"Unhandled service event type: {event_type}")
            return {
                "action": "ignored",
                "reason": f"Unhandled event type: {event_type}"
            }
            
    except Exception as e:
        logger.error(f"Error processing service event {event_type}: {e}")
        raise


async def process_call_event(event: WebhookEvent) -> Dict[str, Any]:
    """
    Process call-related webhook events for analytics updates.
    
    Args:
        event: The webhook event to process
        
    Returns:
        Processing result dictionary
    """
    event_type = event.type
    data = event.data
    business_id = data.get('business_id') or event.business_id
    call_id = data.get('call_id')
    
    logger.info(f"Processing call event: {event_type} for business {business_id}, call {call_id}")
    
    try:
        if event_type == 'call.completed':
            call_data = data.get('call_data', {})
            duration = call_data.get('duration')
            outcome = call_data.get('outcome')  # e.g., 'booking', 'inquiry', 'transfer'
            
            logger.info(f"Call {call_id} completed for business {business_id} with outcome: {outcome}")
            
            # TODO: Update analytics in Dashboard database
            # await update_call_analytics(business_id, call_data)
            
            return {
                "action": "call_analytics_updated",
                "business_id": business_id,
                "call_id": call_id,
                "outcome": outcome
            }
            
        elif event_type == 'call.started':
            logger.info(f"Call {call_id} started for business {business_id}")
            
            # TODO: Track active call metrics
            # await track_active_call(business_id, call_id)
            
            return {
                "action": "call_tracked",
                "business_id": business_id,
                "call_id": call_id
            }
            
        elif event_type == 'call.failed':
            failure_reason = data.get('failure_reason', 'unknown')
            
            logger.warning(f"Call {call_id} failed for business {business_id}: {failure_reason}")
            
            # TODO: Track call failure metrics
            # await track_call_failure(business_id, call_id, failure_reason)
            
            return {
                "action": "call_failure_tracked",
                "business_id": business_id,
                "call_id": call_id,
                "failure_reason": failure_reason
            }
        
        else:
            logger.warning(f"Unhandled call event type: {event_type}")
            return {
                "action": "ignored",
                "reason": f"Unhandled event type: {event_type}"
            }
            
    except Exception as e:
        logger.error(f"Error processing call event {event_type}: {e}")
        raise


async def process_booking_event(event: WebhookEvent) -> Dict[str, Any]:
    """
    Process booking-related webhook events.
    
    Args:
        event: The webhook event to process
        
    Returns:
        Processing result dictionary
    """
    event_type = event.type
    data = event.data
    business_id = data.get('business_id') or event.business_id
    booking_id = data.get('booking_id')
    
    logger.info(f"Processing booking event: {event_type} for business {business_id}, booking {booking_id}")
    
    try:
        if event_type == 'booking.created':
            booking_data = data.get('booking_data', {})
            service_id = booking_data.get('service_id')
            customer_info = booking_data.get('customer_info', {})
            
            logger.info(f"New booking {booking_id} created for business {business_id}, service {service_id}")
            
            # TODO: Create booking record in Dashboard database
            # await create_booking_in_dashboard(business_id, booking_id, booking_data)
            
            return {
                "action": "booking_created",
                "business_id": business_id,
                "booking_id": booking_id,
                "service_id": service_id
            }
            
        elif event_type == 'booking.updated':
            changes = data.get('changes', [])
            updated_data = data.get('updated_data', {})
            
            logger.info(f"Booking {booking_id} updated for business {business_id}")
            
            # TODO: Update booking in Dashboard database
            # await update_booking_in_dashboard(business_id, booking_id, updated_data)
            
            return {
                "action": "booking_updated",
                "business_id": business_id,
                "booking_id": booking_id,
                "updated_fields": changes
            }
            
        elif event_type == 'booking.cancelled':
            cancellation_reason = data.get('cancellation_reason', 'unknown')
            
            logger.info(f"Booking {booking_id} cancelled for business {business_id}: {cancellation_reason}")
            
            # TODO: Update booking status in Dashboard database
            # await cancel_booking_in_dashboard(business_id, booking_id, cancellation_reason)
            
            return {
                "action": "booking_cancelled",
                "business_id": business_id,
                "booking_id": booking_id,
                "cancellation_reason": cancellation_reason
            }
        
        else:
            logger.warning(f"Unhandled booking event type: {event_type}")
            return {
                "action": "ignored",
                "reason": f"Unhandled event type: {event_type}"
            }
            
    except Exception as e:
        logger.error(f"Error processing booking event {event_type}: {e}")
        raise


# =============================================================================
# WEBHOOK ENDPOINTS
# =============================================================================

@router.post("/voice-bot", response_model=WebhookResponse)
async def handle_voice_bot_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_webhook_signature: Optional[str] = Header(None, alias="X-Webhook-Signature"),
    x_webhook_event: Optional[str] = Header(None, alias="X-Webhook-Event")
):
    """
    Handle incoming webhooks from Voice Bot service.
    
    Processes real-time events from the Voice Bot service including business updates,
    service changes, call analytics, and booking notifications. Events are verified
    using HMAC-SHA256 signatures and processed asynchronously.
    
    Headers:
        X-Webhook-Signature: HMAC-SHA256 signature for payload verification
        X-Webhook-Event: Optional event type hint for routing
        
    Returns:
        WebhookResponse with processing status and metadata
    """
    start_time = datetime.utcnow()
    
    try:
        # Get raw payload for signature verification
        payload = await request.body()
        
        # Verify webhook signature if configured
        if settings.VOICE_BOT_WEBHOOK_SECRET and x_webhook_signature:
            if not verify_webhook_signature(
                payload,
                x_webhook_signature,
                settings.VOICE_BOT_WEBHOOK_SECRET
            ):
                logger.warning(f"Invalid webhook signature from {request.client.host}")
                raise HTTPException(
                    status_code=403,
                    detail="Invalid webhook signature"
                )
            logger.debug("Webhook signature verified successfully")
        elif settings.VOICE_BOT_WEBHOOK_SECRET:
            logger.warning("Webhook signature verification is configured but no signature provided")
            raise HTTPException(
                status_code=401,
                detail="Webhook signature required"
            )
        
        # Parse the webhook event
        try:
            event_data = json.loads(payload.decode('utf-8'))
            event = WebhookEvent(**event_data)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON payload: {e}")
            raise HTTPException(
                status_code=400,
                detail="Invalid JSON payload"
            ) from e
        except Exception as e:
            logger.error(f"Invalid event structure: {e}")
            raise HTTPException(
                status_code=400,
                detail="Invalid webhook event structure"
            ) from e
        
        # Log the received event
        logger.info(
            f"Received webhook event: {event.type} "
            f"(ID: {event.event_id}, Business: {event.business_id})"
        )
        
        # Route event to appropriate processor based on event type
        processing_result = None
        
        if event.type.startswith('business.'):
            processing_result = await process_business_event(event)
            
        elif event.type.startswith('service.'):
            processing_result = await process_service_event(event)
            
        elif event.type.startswith('call.'):
            processing_result = await process_call_event(event)
            
        elif event.type.startswith('booking.'):
            processing_result = await process_booking_event(event)
            
        elif event.type == 'hours.updated':
            # Handle business hours updates
            business_id = event.data.get('business_id') or event.business_id
            logger.info(f"Business hours updated for business {business_id}")
            
            # TODO: Sync hours to Dashboard database
            # await sync_business_hours_to_dashboard(business_id, event.data)
            
            processing_result = {
                "action": "business_hours_synced",
                "business_id": business_id
            }
            
        elif event.type == 'analytics.updated':
            # Handle analytics data updates
            business_id = event.data.get('business_id') or event.business_id
            logger.info(f"Analytics updated for business {business_id}")
            
            # TODO: Update analytics cache/dashboard
            # await refresh_analytics_cache(business_id)
            
            processing_result = {
                "action": "analytics_refreshed",
                "business_id": business_id
            }
            
        elif event.type == 'settings.updated':
            # Handle settings updates
            business_id = event.data.get('business_id') or event.business_id
            settings_type = event.data.get('settings_type', 'unknown')
            logger.info(f"Settings {settings_type} updated for business {business_id}")
            
            # TODO: Sync settings to Dashboard
            # await sync_settings_to_dashboard(business_id, event.data)
            
            processing_result = {
                "action": "settings_synced",
                "business_id": business_id,
                "settings_type": settings_type
            }
            
        elif event.type.startswith('integration.'):
            # Handle integration status changes
            business_id = event.data.get('business_id') or event.business_id
            integration_name = event.data.get('integration_name', 'unknown')
            logger.info(f"Integration {integration_name} event: {event.type} for business {business_id}")
            
            # TODO: Update integration status in Dashboard
            # await update_integration_status(business_id, integration_name, event.type)
            
            processing_result = {
                "action": "integration_status_updated",
                "business_id": business_id,
                "integration_name": integration_name,
                "status": event.type.split('.')[1]  # connected/disconnected
            }
            
        else:
            logger.warning(f"Unhandled webhook event type: {event.type}")
            processing_result = {
                "action": "ignored",
                "reason": f"Unhandled event type: {event.type}"
            }
        
        # Calculate processing time
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        logger.info(
            f"Webhook event {event.type} processed successfully in {processing_time:.3f}s "
            f"(Action: {processing_result.get('action', 'unknown')})"
        )
        
        # Return success response
        return WebhookResponse(
            status="success",
            message=f"Event {event.type} processed successfully",
            event_id=event.event_id
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
        
    except Exception as e:
        # Log unexpected errors and return 500
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        logger.error(
            f"Unexpected error processing webhook after {processing_time:.3f}s: {e}",
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error processing webhook"
        ) from e


@router.get("/health")
async def webhook_health_check():
    """
    Health check endpoint for webhook service.
    
    Returns the current status of the webhook service including
    configuration status and readiness to receive events.
    """
    try:
        health_status = {
            "status": "healthy",
            "service": "webhook_handler",
            "timestamp": datetime.utcnow().isoformat(),
            "configuration": {
                "signature_verification": bool(settings.VOICE_BOT_WEBHOOK_SECRET),
                "supported_events": [
                    "business.*", "service.*", "call.*", "booking.*",
                    "hours.updated", "analytics.updated", "settings.updated",
                    "integration.*"
                ]
            }
        }
        
        return health_status
        
    except Exception as e:
        logger.error(f"Webhook health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@router.post("/test")
async def test_webhook_endpoint(
    event: WebhookEvent,
    x_webhook_signature: Optional[str] = Header(None, alias="X-Webhook-Signature")
):
    """
    Test endpoint for webhook development and debugging.
    
    Accepts webhook events for testing without requiring proper signatures
    in development environments. Should be disabled in production.
    """
    if not settings.DEBUG:
        raise HTTPException(
            status_code=404,
            detail="Test endpoint not available in production"
        )
    
    logger.info(f"Test webhook received: {event.type}")
    
    return WebhookResponse(
        status="success",
        message=f"Test event {event.type} received successfully",
        event_id=event.event_id
    )


@router.post("/stripe")
async def handle_stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="stripe-signature")
):
    """
    Handle incoming webhooks from Stripe for payment events.
    
    Processes payment-related events including subscription changes,
    invoice payments, and billing updates. Events are verified using
    Stripe's webhook signature verification.
    
    Headers:
        stripe-signature: Stripe webhook signature for payload verification
        
    Returns:
        Success response for valid webhook events
    """
    start_time = datetime.utcnow()
    
    try:
        # Get raw payload for signature verification
        payload = await request.body()
        
        # Verify webhook signature
        if not stripe_signature:
            logger.warning("Stripe webhook signature missing")
            raise HTTPException(
                status_code=400,
                detail="Stripe webhook signature required"
            )
        
        # Verify and parse the event
        try:
            event = stripe_service.verify_webhook_signature(payload, stripe_signature)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error verifying Stripe webhook: {e}")
            raise HTTPException(
                status_code=400,
                detail="Invalid webhook signature or payload"
            )
        
        event_type = event['type']
        event_data = event['data']['object']
        
        logger.info(f"Received Stripe webhook: {event_type} (ID: {event['id']})")
        
        # Initialize Supabase service for database updates
        supabase = SupabaseService()
        
        # Process different event types
        if event_type == 'invoice.payment_succeeded':
            # Handle successful payment
            customer_id = event_data.get('customer')
            subscription_id = event_data.get('subscription')
            amount_paid = event_data.get('amount_paid', 0) / 100  # Convert from cents
            
            logger.info(f"Payment succeeded: ${amount_paid} for customer {customer_id}")
            
            # TODO: Update business subscription status and billing history
            # if customer_id:
            #     await update_subscription_status(supabase, customer_id, 'active')
            #     await record_payment(supabase, customer_id, event_data)
            
        elif event_type == 'invoice.payment_failed':
            # Handle failed payment
            customer_id = event_data.get('customer')
            attempt_count = event_data.get('attempt_count', 0)
            
            logger.warning(f"Payment failed for customer {customer_id} (attempt {attempt_count})")
            
            # TODO: Update subscription status and send notifications
            # if customer_id:
            #     await handle_payment_failure(supabase, customer_id, attempt_count)
            
        elif event_type == 'customer.subscription.created':
            # Handle new subscription
            customer_id = event_data.get('customer')
            subscription_id = event_data.get('id')
            status = event_data.get('status')
            
            logger.info(f"New subscription {subscription_id} created for customer {customer_id}")
            
            # TODO: Update business plan and limits
            # if customer_id:
            #     plan_name = await get_plan_from_subscription(event_data)
            #     await update_business_plan(supabase, customer_id, plan_name, subscription_id)
            
        elif event_type == 'customer.subscription.updated':
            # Handle subscription changes
            customer_id = event_data.get('customer')
            subscription_id = event_data.get('id')
            status = event_data.get('status')
            
            logger.info(f"Subscription {subscription_id} updated for customer {customer_id}: {status}")
            
            # TODO: Update subscription status and plan if changed
            # if customer_id:
            #     await sync_subscription_changes(supabase, customer_id, event_data)
            
        elif event_type == 'customer.subscription.deleted':
            # Handle subscription cancellation
            customer_id = event_data.get('customer')
            subscription_id = event_data.get('id')
            
            logger.info(f"Subscription {subscription_id} cancelled for customer {customer_id}")
            
            # TODO: Downgrade plan and update access
            # if customer_id:
            #     await handle_subscription_cancellation(supabase, customer_id, subscription_id)
            
        elif event_type == 'checkout.session.completed':
            # Handle successful checkout
            customer_id = event_data.get('customer')
            subscription_id = event_data.get('subscription')
            metadata = event_data.get('metadata', {})
            business_id = metadata.get('business_id')
            
            logger.info(f"Checkout completed for customer {customer_id}, business {business_id}")
            
            # TODO: Activate subscription and update business
            # if customer_id and business_id:
            #     await activate_subscription(supabase, customer_id, business_id, subscription_id)
            
        else:
            logger.info(f"Unhandled Stripe event type: {event_type}")
        
        # Calculate processing time
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        logger.info(f"Stripe webhook {event_type} processed in {processing_time:.3f}s")
        
        return {"received": True}
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
        
    except Exception as e:
        # Log unexpected errors and return 500
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        logger.error(
            f"Unexpected error processing Stripe webhook after {processing_time:.3f}s: {e}",
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="Internal server error processing webhook"
        ) from e