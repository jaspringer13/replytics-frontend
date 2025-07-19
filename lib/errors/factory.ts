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
  ThirdPartyError,
  ErrorContext,
} from './types';

interface CompositeError extends ThirdPartyError {
  allCauses?: Error[];
}
import { isAxiosError, isErrorLike } from './guards';

// Helper to extract error message from various formats
function extractErrorMessage(data: unknown): string | undefined {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
    return data.message;
  }
  if (data && typeof data === 'object' && 'error' in data) {
    const error = data.error;
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      return error.message;
    }
    if (typeof error === 'string') return error;
  }
  if (data && typeof data === 'object' && 'errors' in data && Array.isArray(data.errors)) {
    return data.errors.map((e: unknown) => {
      if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
        return e.message;
      }
      return String(e);
    }).join(', ');
  }
  return undefined;
}

// Helper to extract validation errors
function extractValidationErrors(data: unknown): Record<string, string[]> | undefined {
  if (data && typeof data === 'object') {
    if ('errors' in data && data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
      return data.errors as Record<string, string[]>;
    }
    if ('validationErrors' in data && data.validationErrors && typeof data.validationErrors === 'object') {
      return data.validationErrors as Record<string, string[]>;
    }
    if ('details' in data && data.details && typeof data.details === 'object') {
      return data.details as Record<string, string[]>;
    }
  }
  return undefined;
}

// Helper to add context to error
function withContext<T extends AppError>(error: T, context?: ErrorContext): T {
  if (context && Object.keys(context).length > 0) {
    // Merge contexts if error already has one
    const mergedContext = { ...error.context, ...context };
    // We need to recreate the error to add context since properties are readonly
    const ErrorClass = error.constructor as new (...args: unknown[]) => T;
    const newError = Object.create(ErrorClass.prototype);
    Object.assign(newError, error, { context: mergedContext });
    return newError;
  }
  return error;
}

/**
 * Map HTTP status codes to specific error types
 */
function mapStatusToError(
  status: number,
  message: string,
  data: unknown,
  endpoint: string | undefined,
  context?: ErrorContext,
  originalError?: Error,
  response?: { headers?: Record<string, string>; config?: { timeout?: number } }
): AppError {
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
      // Check if it's a business logic error (Axios-specific)
      const businessCode = data && typeof data === 'object' && 'businessCode' in data
        ? (data as any).businessCode
        : undefined;
      if (businessCode) {
        return new BusinessLogicError(
          message,
          businessCode,
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
      const reason = (data && typeof data === 'object' && 'reason' in data ? data.reason : undefined) || 
        (message.includes('expired') ? 'token_expired' : 
         message.includes('invalid') ? 'token_invalid' : 
         undefined);
      return new AuthenticationError(
        reason as 'token_expired' | 'token_invalid' | undefined,
        endpoint,
        context
      );
    }

    case 403: {
      const requiredPermission = data && typeof data === 'object' && 'requiredPermission' in data
        ? (data as any).requiredPermission
        : undefined;
      return new AuthorizationError(
        requiredPermission,
        endpoint,
        context
      );
    }

    case 404: {
      const resourceType = data && typeof data === 'object' && 'resourceType' in data
        ? (data as any).resourceType
        : undefined;
      const resourceId = data && typeof data === 'object' && 'resourceId' in data
        ? (data as any).resourceId
        : undefined;
      return new NotFoundError(
        resourceType,
        resourceId,
        endpoint,
        context
      );
    }

    case 429: {
      // Handle both direct data and Axios headers
      const retryAfterHeader = response?.headers?.['retry-after'];
      const dataRetryAfter = data && typeof data === 'object' && 'retryAfter' in data
        ? (data as any).retryAfter
        : undefined;
      const retryAfter = retryAfterHeader 
        ? (isNaN(parseInt(retryAfterHeader)) ? undefined : parseInt(retryAfterHeader))
        : dataRetryAfter;
      
      const limitHeader = response?.headers?.['x-rate-limit-limit'];
      const dataLimit = data && typeof data === 'object' && 'limit' in data
        ? (data as any).limit
        : undefined;
      const limit = limitHeader
        ? (isNaN(parseInt(limitHeader)) ? undefined : parseInt(limitHeader))
        : dataLimit;
      
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
        response?.config?.timeout || 30000,
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
      const businessCode = data && typeof data === 'object' && 'businessCode' in data
        ? (data as any).businessCode
        : undefined;
      if (status >= 400 && status < 500 && businessCode) {
        return new BusinessLogicError(
          message,
          businessCode,
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
        originalError
      );
    }
  }
}

/**
 * Convert API response to our domain error
 */
export function fromAPIResponse(status: number, data: unknown, context?: ErrorContext): AppError {
    const message = extractErrorMessage(data) || `HTTP ${status} error`;
    const endpoint = context?.metadata?.endpoint as string | undefined;
    
    return mapStatusToError(status, message, data, endpoint, context);
  }

/**
 * Convert Axios error to our domain error
 */
export function fromAxiosError(axiosError: unknown, context?: ErrorContext): AppError {
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
      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
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

    // Convert headers to Record<string, string>
    const headers: Record<string, string> = {};
    if (response.headers) {
      Object.entries(response.headers).forEach(([key, value]) => {
        headers[key] = Array.isArray(value) ? value.join(', ') : String(value);
      });
    }
    
    // Use shared status mapping function
    return mapStatusToError(status, message, data, endpoint, context, axiosError as Error, { headers, config });
  }


/**
 * Convert a standard Error to AppError
 */
export function fromError(error: Error, context?: ErrorContext): AppError {
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
export function fromUnknown(error: unknown, defaultMessage: string = 'An error occurred', context?: ErrorContext): AppError {
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
export function withErrorContext<T extends AppError>(error: T, context: ErrorContext): T {
  return withContext(error, context);
}

/**
 * Create a composite error that preserves multiple causes
 */
export function createComposite(
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
    (compositeError as CompositeError).allCauses = errors;
    
    return compositeError;
  }

interface ErrorWithCause {
  originalError?: Error;
  cause?: Error;
}

/**
 * Extract root cause from error chain
 */
export function getRootCause(error: Error): Error {
    let current = error;
    while ((current as ErrorWithCause).originalError || (current as ErrorWithCause).cause) {
      current = (current as ErrorWithCause).originalError || (current as ErrorWithCause).cause!;
    }
    return current;
  }

/**
 * Get full error chain for debugging
 */
export function getErrorChain(error: Error): Error[] {
    const chain: Error[] = [];
    let current: Error | undefined = error;
    
    while (current) {
      chain.push(current);
      const errorWithCause = current as ErrorWithCause;
      current = errorWithCause.originalError || errorWithCause.cause;
    }
    
    return chain;
  }

/**
 * Format error chain for logging
 */
export function formatErrorChain(error: Error): string {
    const chain = getErrorChain(error);
    return chain.map((e, i) => {
      const indent = '  '.repeat(i);
      return `${indent}${i > 0 ? '↳ ' : ''}${e.name}: ${e.message}`;
    }).join('\n');
}