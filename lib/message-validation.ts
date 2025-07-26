/**
 * Message validation and rate limiting utilities for SMS messaging
 */

export interface MessageValidationOptions {
  maxLength?: number;
  allowHtml?: boolean;
  allowUrls?: boolean;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedMessage?: string;
}

/**
 * Validates and sanitizes SMS message content
 */
export function validateMessage(
  message: string,
  options: MessageValidationOptions = {}
): ValidationResult {
  const {
    maxLength = 160, // Standard SMS length
    allowHtml = false,
    allowUrls = true
  } = options;

  const errors: string[] = [];

  // Check if message is empty
  if (!message || message.trim().length === 0) {
    errors.push('Message cannot be empty');
    return { isValid: false, errors };
  }

  // Check message length
  if (message.length > maxLength) {
    errors.push(`Message exceeds maximum length of ${maxLength} characters`);
  }

  // Sanitize message
  let sanitizedMessage = message.trim();

  // Remove/escape HTML if not allowed
  if (!allowHtml) {
    sanitizedMessage = sanitizedMessage
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Check for suspicious patterns that might indicate injection attempts
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitizedMessage)) {
      errors.push('Message contains potentially malicious content');
      break;
    }
  }

  // Remove excessive whitespace and normalize
  sanitizedMessage = sanitizedMessage.replace(/\s+/g, ' ').trim();

  // Validate URLs if they're allowed
  if (!allowUrls) {
    const urlPattern = /https?:\/\/[^\s]+/gi;
    if (urlPattern.test(sanitizedMessage)) {
      errors.push('URLs are not allowed in messages');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedMessage
  };
}

/**
 * Rate limiting implementation using in-memory storage
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get existing requests for this key
    const keyRequests = this.requests.get(key) || [];

    // Filter out old requests outside the window
    const validRequests = keyRequests.filter(timestamp => timestamp > windowStart);

    // Check if we're within the rate limit
    if (validRequests.length >= config.maxRequests) {
      // Update the map with cleaned requests
      this.requests.set(key, validRequests);
      return false;
    }

    // Add current request and update map
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }

  getRemainingRequests(key: string, config: RateLimitConfig): number {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const keyRequests = this.requests.get(key) || [];
    const validRequests = keyRequests.filter(timestamp => timestamp > windowStart);

    return Math.max(0, config.maxRequests - validRequests.length);
  }

  getTimeUntilReset(key: string, config: RateLimitConfig): number {
    const keyRequests = this.requests.get(key) || [];
    if (keyRequests.length === 0) return 0;

    const oldestRequest = Math.min(...keyRequests);
    const resetTime = oldestRequest + config.windowMs;
    
    return Math.max(0, resetTime - Date.now());
  }

  // Clean up old entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, requests] of Array.from(this.requests.entries())) {
      const validRequests = requests.filter((timestamp: number) => timestamp > now - 300000); // Keep last 5 minutes
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

// Global rate limiter instance
export const messageLimiter = new RateLimiter();

// Clean up rate limiter every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    messageLimiter.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Default rate limiting configuration for SMS messages
 */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10, // Max 10 messages
  windowMs: 60 * 1000 // Per minute
};

/**
 * Validates payload before sending to API
 */
export function validateSMSPayload(data: {
  conversationId: string;
  message: string;
  direction: 'outbound' | 'inbound';
}): ValidationResult {
  const errors: string[] = [];

  // Validate conversation ID
  if (!data.conversationId || typeof data.conversationId !== 'string') {
    errors.push('Valid conversation ID is required');
  }

  // Validate direction
  if (!data.direction || !['outbound', 'inbound'].includes(data.direction)) {
    errors.push('Valid direction (outbound/inbound) is required');
  }

  // Validate message
  const messageValidation = validateMessage(data.message);
  if (!messageValidation.isValid) {
    errors.push(...messageValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedMessage: messageValidation.sanitizedMessage
  };
}