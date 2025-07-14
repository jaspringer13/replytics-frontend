/**
 * Error factory for converting third-party errors to our domain errors
 * Supports error cause chains for better debugging
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
  WebSocketError,
  ThirdPartyError,
  ErrorContext,
} from './types';
import { isAxiosError, isErrorLike } from './guards';

// Helper to extract error message from various formats
function extractErrorMessage(data: any): string | undefined {
  if (typeof data === 'string') return data;
  if (data?.message) return data.message;
  if (data?.error?.message) return data.error.message;
  if (data?.error && typeof data.error === 'string') return data.error;
  if (data?.errors && Array.isArray(data.errors)) {
    return data.errors.map((e: any) => e.message || e).join(', ');
  }
  return undefined;
}

// Helper to extract validation errors
function extractValidationErrors(data: any): Record<string, string[]> | undefined {
  if (data?.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
    return data.errors;
  }
  if (data?.validationErrors) {
    return data.validationErrors;
  }
  if (data?.details && typeof data.details === 'object') {
    return data.details;
  }
  return undefined;
}

// Helper to add context to error
function withContext<T extends AppError>(error: T, context?: ErrorContext): T {
  if (context && Object.keys(context).length > 0) {
    // Merge contexts if error already has one
    const mergedContext = { ...error.context, ...context };
    // We need to recreate the error to add context since properties are readonly
    const ErrorClass = error.constructor as new (...args: any[]) => T;
    const newError = Object.create(ErrorClass.prototype);
    Object.assign(newError, error, { context: mergedContext });
    return newError;
  }
  return error;
}

export class ErrorFactory {
  /**
   * Convert API response to our domain error
   */
  static fromAPIResponse(status: number, data: any, context?: ErrorContext): AppError {
    const message = extractErrorMessage(data) || `HTTP ${status} error`;
    const endpoint = context?.metadata?.endpoint as string | undefined;

    // Map status codes to specific error types
    switch (status) {
      case 400: {
        const validationErrors = extractValidationErrors(data);
        return new ValidationError(
          message,
          validationErrors,
          endpoint,
          context
        );
      }

      case 401: {
        const reason = data?.reason || 
          (message.includes('expired') ? 'token_expired' : 
           message.includes('invalid') ? 'token_invalid' : 
           undefined);
        return new AuthenticationError(
          reason as any,
          endpoint,
          context
        );
      }

      case 403: {
        return new AuthorizationError(
          data?.requiredPermission,
          endpoint,
          context
        );
      }

      case 404: {
        return new NotFoundError(
          data?.resourceType,
          data?.resourceId,
          endpoint,
          context
        );
      }

      case 429: {
        return new RateLimitError(
          data?.retryAfter,
          data?.limit,
          endpoint,
          context
        );
      }

      case 408:
      case 504:
      case 524: {
        return new TimeoutError(
          30000,
          context
        );
      }

      case 500:
      case 502:
      case 503: {
        return new ServerError(
          message,
          status,
          endpoint,
          context
        );
      }

      default: {
        // Check if it's a business logic error (4xx range)
        if (status >= 400 && status < 500 && data?.businessCode) {
          return new BusinessLogicError(
            message,
            data.businessCode,
            endpoint,
            context
          );
        }
        
        // Generic API error
        return new APIError(
          message,
          `HTTP_${status}`,
          status,
          endpoint,
          data,
          context
        );
      }
    }
  }

  /**
   * Convert Axios error to our domain error
   */
  static fromAxiosError(axiosError: any, context?: ErrorContext): AppError {
    // Type guard check
    if (!isAxiosError(axiosError)) {
      return new ThirdPartyError(
        'axios',
        'Invalid axios error format',
        context,
        axiosError instanceof Error ? axiosError : undefined
      );
    }

    const config = axiosError.config;
    const response = axiosError.response;
    const request = axiosError.request;

    // Network error - no response received
    if (!response) {
      if (axiosError.code === 'ECONNABORTED' || (axiosError.message && axiosError.message.includes('timeout'))) {
        return new TimeoutError(
          config?.timeout || 0,
          context
        );
      }
      
      if (axiosError.code === 'ENOTFOUND') {
        return new DNSError(
          config?.url,
          context
        );
      }
      
      if (!navigator.onLine) {
        return new OfflineError(context);
      }
      
      return new NetworkError(
        axiosError.message || 'Network request failed',
        'NETWORK_ERROR',
        context,
        axiosError as Error
      );
    }

    // Extract error details from response
    const status = response.status;
    const data = response.data;
    const message = extractErrorMessage(data) || axiosError.message || `HTTP ${status} error`;
    const endpoint = config?.url;

    // Map status codes to specific error types
    switch (status) {
      case 400: {
        const validationErrors = extractValidationErrors(data);
        return new ValidationError(
          message,
          validationErrors,
          endpoint,
          context
        );
      }

      case 422: {
        // Check if it's a business logic error
        if (data?.businessCode) {
          return new BusinessLogicError(
            message,
            data.businessCode,
            endpoint,
            context
          );
        }
        // Otherwise treat as validation error
        const validationErrors = extractValidationErrors(data);
        return new ValidationError(
          message,
          validationErrors,
          endpoint,
          context
        );
      }

      case 401: {
        const reason = data?.reason || 
          (message.includes('expired') ? 'token_expired' : 
           message.includes('invalid') ? 'token_invalid' : 
           undefined);
        return new AuthenticationError(
          reason as any,
          endpoint,
          context
        );
      }

      case 403: {
        return new AuthorizationError(
          data?.requiredPermission,
          endpoint,
          context
        );
      }

      case 404: {
        return new NotFoundError(
          data?.resourceType,
          data?.resourceId,
          endpoint,
          context
        );
      }

      case 429: {
        const retryAfter = response.headers['retry-after'] 
          ? parseInt(response.headers['retry-after']) 
          : data?.retryAfter;
        const limit = response.headers['x-rate-limit-limit'] 
          ? parseInt(response.headers['x-rate-limit-limit'])
          : data?.limit;
        
        return new RateLimitError(
          retryAfter,
          limit,
          endpoint,
          context
        );
      }

      case 408:
      case 504:
      case 524: {
        return new TimeoutError(
          config?.timeout || 30000,
          context
        );
      }

      case 500:
      case 502:
      case 503: {
        return new ServerError(
          message,
          status,
          endpoint,
          context
        );
      }

      default: {
        // Check if it's a business logic error (4xx range)
        if (status >= 400 && status < 500 && data?.businessCode) {
          return new BusinessLogicError(
            message,
            data.businessCode,
            endpoint,
            context
          );
        }
        
        // Generic API error
        return new APIError(
          message,
          `HTTP_${status}`,
          status,
          endpoint,
          data,
          context,
          axiosError as Error
        );
      }
    }
  }

  /**
   * Convert Twilio error to our domain error
   */
  static fromTwilioError(twilioError: any, callState?: VoiceCallError['callState'], context?: ErrorContext): VoiceCallError {
    const message = twilioError?.message || twilioError?.toString() || 'Twilio error';
    const code = twilioError?.code || twilioError?.status;

    // Map Twilio error codes to our error types
    if (code >= 31000 && code < 32000) {
      // Connection errors
      if (code === 31005 || code === 31009) {
        // Connection timeout or failed
        return new CallDroppedError(
          'network',
          callState,
          context
        );
      }
      
      // Audio quality issues
      if (code === 31201 || code === 31202) {
        return new AudioQualityError(
          {
            jitter: twilioError.jitter,
            packetLoss: twilioError.packetLoss,
            latency: twilioError.latency,
          },
          callState,
          context
        );
      }
    }

    // Webhook errors
    if (message.includes('webhook') || code >= 11200 && code < 11300) {
      return new TwilioWebhookError(
        twilioError.webhookType || 'unknown',
        callState,
        context,
        twilioError instanceof Error ? twilioError : undefined
      );
    }

    // Default to generic voice call error
    return new VoiceCallError(
      message,
      `TWILIO_${code || 'UNKNOWN'}`,
      callState,
      context,
      twilioError instanceof Error ? twilioError : undefined
    );
  }

  /**
   * Convert WebSocket error to our domain error
   */
  static fromWebSocketError(wsError: any, context?: ErrorContext): WebSocketError {
    let eventType: string | undefined;
    let closeCode: number | undefined;
    let originalError: Error | undefined;

    // Handle CloseEvent
    if (wsError?.type === 'close' && typeof wsError.code === 'number') {
      eventType = 'close';
      closeCode = wsError.code;
    }
    // Handle Event
    else if (wsError?.type) {
      eventType = wsError.type;
    }
    // Handle Error object
    else if (wsError instanceof Error) {
      originalError = wsError;
    }

    return new WebSocketError(
      eventType,
      closeCode,
      context,
      originalError || (isErrorLike(wsError) ? wsError as Error : undefined)
    );
  }

  /**
   * Convert Deepgram/transcription error
   */
  static fromTranscriptionError(
    error: any, 
    provider: 'deepgram' | 'fallback',
    callState?: VoiceCallError['callState'],
    context?: ErrorContext
  ): TranscriptionError {
    const originalError = error instanceof Error ? error : 
                         isErrorLike(error) ? new Error(error.message) : 
                         undefined;

    return new TranscriptionError(
      provider,
      callState,
      context,
      originalError
    );
  }

  /**
   * Convert a standard Error to AppError
   */
  static fromError(error: Error, context?: ErrorContext): AppError {
    // If already an AppError, return with additional context if provided
    if (error instanceof AppError) {
      return withContext(error, context);
    }

    // Check for specific error patterns
    if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
      return new NetworkError(error.message, 'NETWORK_UNKNOWN', context, error);
    }

    if (error.name === 'AbortError') {
      return new TimeoutError(0, context);
    }

    // Default to ThirdPartyError
    return new ThirdPartyError(
      'unknown',
      error.message,
      context,
      error
    );
  }

  /**
   * Convert any unknown error to AppError
   */
  static fromUnknown(error: unknown, defaultMessage: string = 'An error occurred', context?: ErrorContext): AppError {
    // Already our error type
    if (error instanceof AppError) {
      return withContext(error, context);
    }

    // Standard Error
    if (error instanceof Error) {
      // Check for specific error types by message/properties
      if (error.message.includes('Network request failed')) {
        return new NetworkError(error.message, 'NETWORK_UNKNOWN', context, error);
      }
      
      if (error.name === 'AbortError') {
        return new TimeoutError(0, context);
      }

      // Generic third-party error
      return new ThirdPartyError(
        'unknown',
        error.message,
        context,
        error
      );
    }

    // Error-like object
    if (isErrorLike(error)) {
      return new ThirdPartyError(
        'unknown',
        error.message,
        context,
        new Error(error.message)
      );
    }

    // String error
    if (typeof error === 'string') {
      return new ThirdPartyError('unknown', error, context);
    }

    // Completely unknown
    return new ThirdPartyError('unknown', defaultMessage, context);
  }

  /**
   * Helper to create error with additional context
   */
  static withContext<T extends AppError>(error: T, context: ErrorContext): T {
    return withContext(error, context);
  }

  /**
   * Create a composite error that preserves multiple causes
   */
  static createComposite(
    message: string,
    errors: Error[],
    context?: ErrorContext
  ): ThirdPartyError {
    const causes = errors.map(e => e.message).join('; ');
    const compositeError = new ThirdPartyError(
      'composite',
      `${message}: ${causes}`,
      context,
      errors[0] // Use first error as primary cause
    );

    // Store all errors for later inspection
    (compositeError as any).allCauses = errors;
    
    return compositeError;
  }

  /**
   * Extract root cause from error chain
   */
  static getRootCause(error: Error): Error {
    let current = error;
    while ((current as any).originalError || (current as any).cause) {
      current = (current as any).originalError || (current as any).cause;
    }
    return current;
  }

  /**
   * Get full error chain for debugging
   */
  static getErrorChain(error: Error): Error[] {
    const chain: Error[] = [];
    let current: Error | undefined = error;
    
    while (current) {
      chain.push(current);
      current = (current as any).originalError || (current as any).cause;
    }
    
    return chain;
  }

  /**
   * Format error chain for logging
   */
  static formatErrorChain(error: Error): string {
    const chain = this.getErrorChain(error);
    return chain.map((e, i) => {
      const indent = '  '.repeat(i);
      return `${indent}${i > 0 ? '↳ ' : ''}${e.name}: ${e.message}`;
    }).join('\n');
  }
}