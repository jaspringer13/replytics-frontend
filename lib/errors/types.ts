/**
 * Production-grade error type system for Replytics
 * Following Next.js 14 and TypeScript best practices
 */

// Error context for debugging
export interface ErrorContext {
  userId?: string;
  tenantId?: string;
  bookingId?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

// Serialized error interface for toJSON method
export interface SerializedError {
  name: string;
  message: string;
  code: string;
  timestamp: Date;
  context?: ErrorContext;
  stack?: string;
  isOperational: boolean;
}

// Base error class with all best practices
export abstract class AppError extends Error {
  public readonly timestamp: Date;
  public readonly code: string;
  public readonly context?: ErrorContext;
  public readonly isOperational: boolean;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: string,
    isOperational: boolean = true,
    context?: ErrorContext,
    originalError?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.code = code;
    this.isOperational = isOperational;
    this.context = context;
    this.originalError = originalError;

    // Fix prototype chain for proper instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture stack trace for V8 environments (Node.js, Chrome)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Serialize for logging
  toJSON(): SerializedError {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
      isOperational: this.isOperational,
    };
  }
}

// Network Errors
export class NetworkError extends AppError {
  constructor(message: string, code: string, context?: ErrorContext, originalError?: Error) {
    super(message, code, true, context, originalError);
  }
}

export class TimeoutError extends NetworkError {
  public readonly timeoutMs: number;

  constructor(timeoutMs: number, context?: ErrorContext) {
    super(`Request timed out after ${timeoutMs}ms`, 'NETWORK_TIMEOUT', context);
    this.timeoutMs = timeoutMs;
  }
}

export class OfflineError extends NetworkError {
  constructor(context?: ErrorContext) {
    super('No internet connection', 'NETWORK_OFFLINE', context);
  }
}

export class DNSError extends NetworkError {
  public readonly hostname?: string;

  constructor(hostname?: string, context?: ErrorContext) {
    super(`DNS resolution failed${hostname ? ` for ${hostname}` : ''}`, 'NETWORK_DNS', context);
    this.hostname = hostname;
  }
}

// API Errors
export class APIError extends AppError {
  public readonly statusCode?: number;
  public readonly endpoint?: string;
  public readonly responseData?: unknown;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    endpoint?: string,
    responseData?: unknown,
    context?: ErrorContext,
    originalError?: Error
  ) {
    super(message, code, true, context, originalError);
    this.statusCode = statusCode;
    this.endpoint = endpoint;
    this.responseData = responseData;
  }
}

export class ValidationError extends APIError {
  public readonly validationErrors?: Record<string, string[]>;

  constructor(
    message: string,
    validationErrors?: Record<string, string[]>,
    endpoint?: string,
    context?: ErrorContext
  ) {
    super(message, 'API_VALIDATION_ERROR', 400, endpoint, validationErrors, context);
    this.validationErrors = validationErrors;
  }
}

export class AuthenticationError extends APIError {
  public readonly reason?: 'token_expired' | 'token_invalid' | 'no_token';

  constructor(reason?: 'token_expired' | 'token_invalid' | 'no_token', endpoint?: string, context?: ErrorContext) {
    const message = reason === 'token_expired' 
      ? 'Authentication token expired'
      : reason === 'token_invalid'
      ? 'Invalid authentication token'
      : 'Authentication required';
    
    super(message, 'API_AUTHENTICATION_ERROR', 401, endpoint, undefined, context);
    this.reason = reason;
  }
}

export class AuthorizationError extends APIError {
  public readonly requiredPermission?: string;

  constructor(requiredPermission?: string, endpoint?: string, context?: ErrorContext) {
    super(
      `Access denied${requiredPermission ? ` - requires ${requiredPermission} permission` : ''}`,
      'API_AUTHORIZATION_ERROR',
      403,
      endpoint,
      undefined,
      context
    );
    this.requiredPermission = requiredPermission;
  }
}

export class NotFoundError extends APIError {
  public readonly resourceType?: string;
  public readonly resourceId?: string;

  constructor(resourceType?: string, resourceId?: string, endpoint?: string, context?: ErrorContext) {
    const message = resourceType
      ? `${resourceType}${resourceId ? ` with id ${resourceId}` : ''} not found`
      : 'Resource not found';
    
    super(message, 'API_NOT_FOUND', 404, endpoint, undefined, context);
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

export class RateLimitError extends APIError {
  public readonly retryAfter?: number;
  public readonly limit?: number;

  constructor(retryAfter?: number, limit?: number, endpoint?: string, context?: ErrorContext) {
    super(
      `Rate limit exceeded${limit ? ` (limit: ${limit})` : ''}${retryAfter ? `, retry after ${retryAfter}s` : ''}`,
      'API_RATE_LIMIT',
      429,
      endpoint,
      undefined,
      context
    );
    this.retryAfter = retryAfter;
    this.limit = limit;
  }
}

export class ServerError extends APIError {
  constructor(
    message: string = 'Internal server error', 
    statusCode: number = 500, 
    endpoint?: string, 
    context?: ErrorContext, 
    originalError?: Error
  ) {
    super(message, 'API_SERVER_ERROR', statusCode, endpoint, undefined, context, originalError);
  }
}

export class BusinessLogicError extends APIError {
  public readonly businessCode: string;

  constructor(
    message: string, 
    businessCode: string, 
    endpoint?: string, 
    context?: ErrorContext, 
    originalError?: Error
  ) {
    super(message, `BUSINESS_${businessCode}`, 422, endpoint, undefined, context, originalError);
    this.businessCode = businessCode;
  }
}


// Calendar Errors
export class CalendarError extends AppError {
  constructor(message: string, code: string, context?: ErrorContext, originalError?: Error) {
    super(message, code, true, context, originalError);
  }
}

export class GoogleAuthError extends CalendarError {
  public readonly authStep?: 'consent' | 'token' | 'refresh';

  constructor(authStep?: GoogleAuthError['authStep'], context?: ErrorContext, originalError?: Error) {
    super(
      `Google Calendar authentication failed${authStep ? ` at ${authStep} step` : ''}`,
      'CALENDAR_GOOGLE_AUTH',
      context,
      originalError
    );
    this.authStep = authStep;
  }
}

export class BookingConflictError extends CalendarError {
  public readonly conflictingSlots?: Array<{ start: Date; end: Date }>;

  constructor(
    conflictingSlots?: BookingConflictError['conflictingSlots'],
    context?: ErrorContext
  ) {
    super('Booking conflict detected', 'CALENDAR_BOOKING_CONFLICT', context);
    this.conflictingSlots = conflictingSlots;
  }
}

export class CalendarSyncError extends CalendarError {
  public readonly provider: 'google' | 'outlook' | 'ical';

  constructor(provider: CalendarSyncError['provider'], context?: ErrorContext, originalError?: Error) {
    super(`Calendar sync failed with ${provider}`, 'CALENDAR_SYNC', context, originalError);
    this.provider = provider;
  }
}

// Messaging Errors
export class MessagingError extends AppError {
  constructor(message: string, code: string, context?: ErrorContext, originalError?: Error) {
    super(message, code, true, context, originalError);
  }
}

export class SMSDeliveryError extends MessagingError {
  public readonly phoneNumber?: string;
  public readonly carrier?: string;

  constructor(phoneNumber?: string, carrier?: string, context?: ErrorContext, originalError?: Error) {
    super(
      `SMS delivery failed${phoneNumber ? ` to ${phoneNumber}` : ''}`,
      'MESSAGING_SMS_DELIVERY',
      context,
      originalError
    );
    this.phoneNumber = phoneNumber;
    this.carrier = carrier;
  }
}

export class NotificationError extends MessagingError {
  public readonly channel: 'push' | 'email' | 'in-app';

  constructor(channel: NotificationError['channel'], context?: ErrorContext, originalError?: Error) {
    super(`${channel} notification failed`, 'MESSAGING_NOTIFICATION', context, originalError);
    this.channel = channel;
  }
}

// UI Errors
export class UIError extends AppError {
  constructor(message: string, code: string, context?: ErrorContext, originalError?: Error) {
    super(message, code, true, context, originalError);
  }
}

export class RenderError extends UIError {
  public readonly componentName?: string;

  constructor(componentName?: string, context?: ErrorContext, originalError?: Error) {
    super(
      `Component render failed${componentName ? ` in ${componentName}` : ''}`,
      'UI_RENDER',
      context,
      originalError
    );
    this.componentName = componentName;
  }
}

export class HydrationError extends UIError {
  public readonly mismatchDetails?: string;

  constructor(mismatchDetails?: string, context?: ErrorContext, originalError?: Error) {
    super('Hydration mismatch detected', 'UI_HYDRATION', context, originalError);
    this.mismatchDetails = mismatchDetails;
  }
}

export class AssetLoadError extends UIError {
  public readonly assetUrl?: string;
  public readonly assetType?: 'script' | 'stylesheet' | 'image' | 'font';

  constructor(
    assetUrl?: string,
    assetType?: AssetLoadError['assetType'],
    context?: ErrorContext,
    originalError?: Error
  ) {
    super(
      `Failed to load ${assetType || 'asset'}${assetUrl ? `: ${assetUrl}` : ''}`,
      'UI_ASSET_LOAD',
      context,
      originalError
    );
    this.assetUrl = assetUrl;
    this.assetType = assetType;
  }
}

// Integration Errors
export class IntegrationError extends AppError {
  public readonly service: string;

  constructor(
    service: string,
    message: string,
    code: string,
    context?: ErrorContext,
    originalError?: Error
  ) {
    super(message, code, true, context, originalError);
    this.service = service;
  }
}


export class ThirdPartyError extends IntegrationError {
  constructor(
    service: string,
    message: string,
    context?: ErrorContext,
    originalError?: Error
  ) {
    super(service, message, 'INTEGRATION_THIRD_PARTY', context, originalError);
  }
}

export class PaymentError extends IntegrationError {
  public readonly paymentProvider: 'stripe' | 'paypal' | 'square';
  public readonly paymentMethod?: string;

  constructor(
    paymentProvider: PaymentError['paymentProvider'],
    message: string,
    paymentMethod?: string,
    context?: ErrorContext,
    originalError?: Error
  ) {
    super(paymentProvider, message, 'INTEGRATION_PAYMENT', context, originalError);
    this.paymentProvider = paymentProvider;
    this.paymentMethod = paymentMethod;
  }
}

// Helper function to check if an error is retryable
export function isRetryableError(error: unknown): boolean {
  if (error instanceof TimeoutError) {
    // Timeouts are retryable
    return true;
  }
  
  if (error instanceof ServerError) {
    // 5xx errors are typically retryable
    return true;
  }
  
  if (error instanceof RateLimitError) {
    // Rate limits can be retried after delay
    return true;
  }
  
  if (error instanceof NetworkError) {
    // Network errors are generally retryable
    return true;
  }
  
  // Most other errors (auth, validation, etc.) are not retryable
  return false;
}