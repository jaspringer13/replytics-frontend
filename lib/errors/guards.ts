/**
 * Type guards for runtime error checking
 * Following TypeScript best practices for type predicates
 */

import {
  AppError,
  NetworkError,
  TimeoutError,
  OfflineError,
  DNSError,
  APIError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ServerError,
  BusinessLogicError,
  VoiceCallError,
  CallDroppedError,
  AudioQualityError,
  TranscriptionError,
  TwilioWebhookError,
  CalendarError,
  GoogleAuthError,
  BookingConflictError,
  CalendarSyncError,
  MessagingError,
  SMSDeliveryError,
  NotificationError,
  UIError,
  RenderError,
  HydrationError,
  AssetLoadError,
  IntegrationError,
  WebSocketError,
  ThirdPartyError,
  PaymentError,
} from './types';

// Helper to check if value is an object (not null)
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// Base error guard
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

// Network error guards
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

export function isOfflineError(error: unknown): error is OfflineError {
  return error instanceof OfflineError;
}

export function isDNSError(error: unknown): error is DNSError {
  return error instanceof DNSError;
}

// API error guards
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

export function isServerError(error: unknown): error is ServerError {
  return error instanceof ServerError;
}

export function isBusinessLogicError(error: unknown): error is BusinessLogicError {
  return error instanceof BusinessLogicError;
}

// Voice call error guards
export function isVoiceCallError(error: unknown): error is VoiceCallError {
  return error instanceof VoiceCallError;
}

export function isCallDroppedError(error: unknown): error is CallDroppedError {
  return error instanceof CallDroppedError;
}

export function isAudioQualityError(error: unknown): error is AudioQualityError {
  return error instanceof AudioQualityError;
}

export function isTranscriptionError(error: unknown): error is TranscriptionError {
  return error instanceof TranscriptionError;
}

export function isTwilioWebhookError(error: unknown): error is TwilioWebhookError {
  return error instanceof TwilioWebhookError;
}

// Calendar error guards
export function isCalendarError(error: unknown): error is CalendarError {
  return error instanceof CalendarError;
}

export function isGoogleAuthError(error: unknown): error is GoogleAuthError {
  return error instanceof GoogleAuthError;
}

export function isBookingConflictError(error: unknown): error is BookingConflictError {
  return error instanceof BookingConflictError;
}

export function isCalendarSyncError(error: unknown): error is CalendarSyncError {
  return error instanceof CalendarSyncError;
}

// Messaging error guards
export function isMessagingError(error: unknown): error is MessagingError {
  return error instanceof MessagingError;
}

export function isSMSDeliveryError(error: unknown): error is SMSDeliveryError {
  return error instanceof SMSDeliveryError;
}

export function isNotificationError(error: unknown): error is NotificationError {
  return error instanceof NotificationError;
}

// UI error guards
export function isUIError(error: unknown): error is UIError {
  return error instanceof UIError;
}

export function isRenderError(error: unknown): error is RenderError {
  return error instanceof RenderError;
}

export function isHydrationError(error: unknown): error is HydrationError {
  return error instanceof HydrationError;
}

export function isAssetLoadError(error: unknown): error is AssetLoadError {
  return error instanceof AssetLoadError;
}

// Integration error guards
export function isIntegrationError(error: unknown): error is IntegrationError {
  return error instanceof IntegrationError;
}

export function isWebSocketError(error: unknown): error is WebSocketError {
  return error instanceof WebSocketError;
}

export function isThirdPartyError(error: unknown): error is ThirdPartyError {
  return error instanceof ThirdPartyError;
}

export function isPaymentError(error: unknown): error is PaymentError {
  return error instanceof PaymentError;
}

// Composite guards for error categories
export function isNetworkRelated(error: unknown): error is NetworkError | WebSocketError {
  return isNetworkError(error) || isWebSocketError(error);
}

export function isAuthRelated(error: unknown): error is AuthenticationError | AuthorizationError | GoogleAuthError {
  return isAuthenticationError(error) || isAuthorizationError(error) || isGoogleAuthError(error);
}

export function isUserFacing(error: unknown): error is ValidationError | BusinessLogicError | BookingConflictError {
  return isValidationError(error) || isBusinessLogicError(error) || isBookingConflictError(error);
}

export function isRetryable(error: unknown): error is TimeoutError | ServerError | RateLimitError | NetworkError {
  if (isTimeoutError(error) || isServerError(error) || isNetworkRelated(error)) {
    return true;
  }
  
  if (isRateLimitError(error)) {
    // Only retry if we have a retryAfter value
    return error.retryAfter !== undefined && error.retryAfter > 0;
  }
  
  return false;
}

// Special guard for call-critical errors that must preserve call state
export function isCallCritical(error: unknown): error is VoiceCallError {
  if (!isVoiceCallError(error)) {
    return false;
  }
  
  // Check if call state exists and call is still active
  return error.callState !== undefined && error.callState.isActive === true;
}

// Guard to check if error requires immediate user action
export function requiresUserAction(error: unknown): boolean {
  return isAuthenticationError(error) || 
         isAuthorizationError(error) || 
         isValidationError(error) || 
         isBookingConflictError(error) ||
         isPaymentError(error);
}

// Guard to check if error should be logged to external service
export function shouldLogExternally(error: unknown): boolean {
  if (!isAppError(error)) {
    // Always log non-app errors (unexpected errors)
    return true;
  }
  
  // Log server errors, critical voice errors, and payment errors
  return isServerError(error) || 
         isCallCritical(error) || 
         isPaymentError(error) ||
         !error.isOperational;
}

// Type guard for errors with status codes
export function hasStatusCode(error: unknown): error is APIError & { statusCode: number } {
  return isAPIError(error) && typeof error.statusCode === 'number';
}

// Type guard for errors with retry information
export function hasRetryInfo(error: unknown): error is RateLimitError & { retryAfter: number } {
  return isRateLimitError(error) && typeof error.retryAfter === 'number';
}

// Guard to check if error is from external service
export function isExternalServiceError(error: unknown): boolean {
  return isIntegrationError(error) || 
         isCalendarSyncError(error) || 
         isMessagingError(error);
}

// Guard for checking if error has call state that needs preservation
export function hasCallState(error: unknown): error is VoiceCallError & { callState: NonNullable<VoiceCallError['callState']> } {
  return isVoiceCallError(error) && error.callState !== undefined;
}

// Guard for plain Error objects (not our custom errors)
export function isPlainError(error: unknown): error is Error {
  return error instanceof Error && !(error instanceof AppError);
}

// Utility type guard for error-like objects (duck typing)
export function isErrorLike(value: unknown): value is { message: string; name?: string; stack?: string } {
  if (!isObject(value)) {
    return false;
  }
  
  return typeof value.message === 'string' &&
         (value.name === undefined || typeof value.name === 'string') &&
         (value.stack === undefined || typeof value.stack === 'string');
}

// Guard for Axios errors (common in API calls)
export function isAxiosError(error: unknown): error is { 
  isAxiosError: true; 
  response?: { 
    status: number; 
    data: any;
    headers?: any;
  };
  config?: {
    url?: string;
    timeout?: number;
  };
  request?: any;
  code?: string;
  message?: string;
  name?: string;
  stack?: string;
} {
  return isObject(error) && error.isAxiosError === true;
}