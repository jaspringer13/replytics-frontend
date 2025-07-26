/**
 * Validation System Index
 * Central export point for all validation services and utilities
 */

// Core validation services
export * from './date-validation';
export * from './input-sanitization';
export * from './sql-injection-prevention';
export * from './rate-limiting';
export * from './business-validation';
export * from './middleware';

// Re-export commonly used items for convenience
export {
  // Date validation
  parseDateRangeFilter,
  validateQueryDateParams,
  getDefaultDateRange,
  DateValidationError
} from './date-validation';

export {
  // Input sanitization
  inputSanitizer,
  sanitizeRequestBody,
  SafeStringSchema,
  SafeEmailSchema,
  SafePhoneSchema
} from './input-sanitization';

export {
  // SQL injection prevention
  sqlInjectionPrevention,
  validateDatabaseParams,
  createSafeSupabaseParams,
  BusinessIdSchema,
  TenantIdSchema,
  SQLInjectionError
} from './sql-injection-prevention';

export {
  // Rate limiting
  rateLimiter,
  extractClientId,
  withRateLimit,
  RateLimitExceededError
} from './rate-limiting';

export {
  // Business validation
  businessValidator,
  createMockSession,
  AnalyticsQuerySchema,
  SessionContextSchema,
  BusinessValidationError
} from './business-validation';

export {
  // Middleware
  withValidation,
  withBasicValidation,
  withPerformanceMonitoring,
  CommonSchemas,
  ValidationError
} from './middleware';

/**
 * Quick validation helpers for common use cases
 */
export const ValidationHelpers = {
  /**
   * Validate analytics request parameters
   */
  validateAnalyticsRequest: (params: {
    startDate?: string;
    endDate?: string;
    tenantId: string;
    limit?: number;
    offset?: number;
  }) => {
    // Import functions locally to avoid circular dependencies
    const { createSafeSupabaseParams } = require('./sql-injection-prevention');
    const { validateQueryDateParams } = require('./date-validation');
    
    const safeParams = createSafeSupabaseParams(params);
    const dateRange = validateQueryDateParams({
      startDate: params.startDate,
      endDate: params.endDate
    });
    
    return { ...safeParams, dateRange };
  },

  /**
   * Sanitize and validate user input
   */
  sanitizeUserInput: (input: string, options?: {
    maxLength?: number;
    allowHtml?: boolean;
    allowUrls?: boolean;
  }) => {
    const { inputSanitizer } = require('./input-sanitization');
    return inputSanitizer.validateTextInput(input, options);
  },

  /**
   * Validate database query parameters
   */
  validateDbParams: (params: Record<string, any>) => {
    const { sqlInjectionPrevention } = require('./sql-injection-prevention');
    return sqlInjectionPrevention.validateQueryParameters(params);
  }
};

/**
 * Validation configuration constants
 */
export const ValidationConfig = {
  // Default date range limits
  DEFAULT_MAX_DATE_RANGE_DAYS: 365,
  DEFAULT_HISTORICAL_LIMIT_DAYS: 1095,
  
  // Input length limits
  DEFAULT_MAX_INPUT_LENGTH: 10000,
  DEFAULT_MAX_ARRAY_SIZE: 1000,
  
  // Rate limiting defaults
  DEFAULT_RATE_LIMITS: {
    free: { requestsPerMinute: 10, requestsPerHour: 100 },
    pro: { requestsPerMinute: 60, requestsPerHour: 1000 },
    enterprise: { requestsPerMinute: 300, requestsPerHour: 5000 }
  },
  
  // Query limits
  DEFAULT_QUERY_LIMITS: {
    free: { maxLimit: 50, defaultLimit: 25 },
    pro: { maxLimit: 200, defaultLimit: 50 },
    enterprise: { maxLimit: 1000, defaultLimit: 100 }
  }
} as const;