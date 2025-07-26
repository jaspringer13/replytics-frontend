/**
 * API Route Validation Middleware
 * Comprehensive validation middleware with schema validation, rate limiting, and security checks
 * Based on voice-bot patterns with bulletproof input validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateQueryDateParams, DateValidationError } from './date-validation';
import { inputSanitizer, sanitizeRequestBody } from './input-sanitization';
import { sqlInjectionPrevention, SQLInjectionError } from './sql-injection-prevention';
import { rateLimiter, extractClientId, RateLimitExceededError } from './rate-limiting';
import { businessValidator, BusinessValidationError, ValidatedSession } from './business-validation';

export interface ValidationOptions {
  requireAuth?: boolean;
  rateLimit?: {
    tier?: 'free' | 'pro' | 'enterprise';
    endpoint?: string;
  };
  sanitizeInput?: boolean;
  validateDates?: boolean;
  businessRules?: boolean;
  allowedMethods?: string[];
}

export interface ValidationContext {
  session?: ValidatedSession;
  clientId: string;
  tenantId?: string;
  sanitizedBody?: any;
  sanitizedQuery?: any;
  dateRange?: { startDate: Date; endDate: Date };
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code: string = 'VALIDATION_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Comprehensive validation middleware
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  options: ValidationOptions = {}
) {
  return function(
    handler: (
      req: NextRequest,
      context: ValidationContext,
      validated: T
    ) => Promise<NextResponse>
  ) {
    return async function(req: NextRequest): Promise<NextResponse> {
      const context: ValidationContext = {
        clientId: extractClientId(req)
      };

      try {
        // 1. Method validation
        if (options.allowedMethods && !options.allowedMethods.includes(req.method)) {
          throw new ValidationError(
            `Method ${req.method} not allowed`,
            405,
            'METHOD_NOT_ALLOWED'
          );
        }

        // 2. Extract and validate session
        if (options.requireAuth) {
          context.session = await extractAndValidateSession(req);
          context.tenantId = context.session.tenantId;
        } else {
          // Extract tenant ID from headers for non-auth endpoints
          context.tenantId = req.headers.get('X-Tenant-ID') || undefined;
        }

        // 3. Rate limiting
        if (options.rateLimit && context.tenantId) {
          await validateRateLimit(req, context, options.rateLimit);
        }

        // 4. Parse and validate request data
        const requestData = await parseRequestData(req, options);
        context.sanitizedBody = requestData.body;
        context.sanitizedQuery = requestData.query;

        // 5. Schema validation
        const validated = await validateWithSchema(schema, requestData.combined);

        // 6. Date validation
        if (options.validateDates) {
          context.dateRange = await validateDateParameters(requestData.combined);
        }

        // 7. Business rules validation
        if (options.businessRules && context.session) {
          await validateBusinessRules(validated, context.session);
        }

        // 8. SQL injection prevention
        await validateSQLSafety(requestData.combined);

        // 9. Additional security checks
        await performSecurityChecks(req, context);

        // Call the actual handler
        return await handler(req, context, validated);

      } catch (error) {
        return handleValidationError(error);
      }
    };
  };
}

/**
 * Extract and validate session from request
 */
async function extractAndValidateSession(req: NextRequest): Promise<ValidatedSession> {
  // In a real implementation, this would extract session from JWT token, cookies, etc.
  // For now, we'll use headers for demonstration
  const userId = req.headers.get('X-User-ID');
  const tenantId = req.headers.get('X-Tenant-ID');
  const businessId = req.headers.get('X-Business-ID');
  const tier = req.headers.get('X-Tier') as 'free' | 'pro' | 'enterprise' || 'free';

  if (!userId || !tenantId || !businessId) {
    throw new ValidationError(
      'Authentication required - missing session headers',
      401,
      'AUTHENTICATION_REQUIRED'
    );
  }

  // Validate UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId) || !uuidRegex.test(businessId)) {
    throw new ValidationError(
      'Invalid session identifiers',
      401,
      'INVALID_SESSION'
    );
  }

  // Get user permissions (mock implementation)
  const permissions = await businessValidator.getUserPermissions(userId, tenantId);

  return {
    userId,
    tenantId,
    businessId,
    tier,
    permissions,
    dataRetentionDays: await businessValidator.getTenantDataRetention(tenantId)
  };
}

/**
 * Validate rate limiting
 */
async function validateRateLimit(
  req: NextRequest,
  context: ValidationContext,
  rateLimitOptions: { tier?: 'free' | 'pro' | 'enterprise'; endpoint?: string }
): Promise<void> {
  if (!context.tenantId) {
    throw new ValidationError(
      'Tenant ID required for rate limiting',
      400,
      'TENANT_ID_REQUIRED'
    );
  }

  const endpoint = rateLimitOptions.endpoint || new URL(req.url).pathname;
  const tier = rateLimitOptions.tier || context.session?.tier || 'free';

  try {
    await rateLimiter.validateRateLimit(
      context.clientId,
      context.tenantId,
      endpoint,
      tier
    );
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      throw new ValidationError(
        error.message,
        429,
        'RATE_LIMIT_EXCEEDED',
        {
          retryAfter: error.retryAfter,
          resetTime: error.resetTime
        }
      );
    }
    throw error;
  }
}

/**
 * Parse and sanitize request data
 */
async function parseRequestData(
  req: NextRequest,
  options: ValidationOptions
): Promise<{ body: any; query: any; combined: any }> {
  // Parse query parameters
  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams);

  // Parse body for POST/PUT requests
  let body = {};
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try {
      const contentType = req.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        body = await req.json();
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await req.formData();
        body = Object.fromEntries(formData);
      }
    } catch (error) {
      throw new ValidationError(
        'Invalid request body format',
        400,
        'INVALID_BODY_FORMAT'
      );
    }
  }

  // Sanitize inputs if requested
  const sanitizedBody = options.sanitizeInput ? sanitizeRequestBody(body) : body;
  const sanitizedQuery = options.sanitizeInput ? sanitizeRequestBody(query) : query;

  return {
    body: sanitizedBody,
    query: sanitizedQuery,
    combined: { ...sanitizedQuery, ...sanitizedBody }
  };
}

/**
 * Validate data against Zod schema
 */
async function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: any
): Promise<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorDetails = error.issues.map((err: any) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code
      }));

      throw new ValidationError(
        'Schema validation failed',
        400,
        'SCHEMA_VALIDATION_FAILED',
        { errors: errorDetails }
      );
    }
    throw error;
  }
}

/**
 * Validate date parameters
 */
async function validateDateParameters(data: any): Promise<{ startDate: Date; endDate: Date }> {
  try {
    return validateQueryDateParams({
      startDate: data.startDate,
      endDate: data.endDate,
      maxRangeDays: 365
    });
  } catch (error) {
    if (error instanceof DateValidationError) {
      throw new ValidationError(
        error.message,
        400,
        error.code
      );
    }
    throw error;
  }
}

/**
 * Validate business rules
 */
async function validateBusinessRules(
  data: any,
  session: ValidatedSession
): Promise<void> {
  try {
    const query = {
      businessId: data.businessId || session.businessId,
      tenantId: data.tenantId || session.tenantId,
      startDate: data.startDate,
      endDate: data.endDate,
      metrics: data.metrics,
      limit: data.limit,
      offset: data.offset,
      filters: data.filters
    };

    const result = await businessValidator.validateAnalyticsQuery(query, session);
    
    if (!result.isValid) {
      throw new ValidationError(
        'Business rule validation failed',
        403,
        'BUSINESS_RULE_VIOLATION',
        { errors: result.errors, warnings: result.warnings }
      );
    }
  } catch (error) {
    if (error instanceof BusinessValidationError) {
      throw new ValidationError(
        error.message,
        403,
        error.code,
        error.context
      );
    }
    throw error;
  }
}

/**
 * Validate SQL safety
 */
async function validateSQLSafety(data: any): Promise<void> {
  try {
    const result = sqlInjectionPrevention.validateQueryParameters(data);
    
    if (!result.isValid) {
      throw new ValidationError(
        'SQL injection validation failed',
        400,
        'SQL_INJECTION_DETECTED',
        { errors: result.errors }
      );
    }
  } catch (error) {
    if (error instanceof SQLInjectionError) {
      throw new ValidationError(
        error.message,
        400,
        error.code,
        { parameter: error.parameter }
      );
    }
    throw error;
  }
}

/**
 * Perform additional security checks
 */
async function performSecurityChecks(
  req: NextRequest,
  context: ValidationContext
): Promise<void> {
  // Check for suspicious headers
  const suspiciousHeaders = [
    'x-forwarded-host',
    'x-real-ip',
    'x-forwarded-for'
  ];

  for (const header of suspiciousHeaders) {
    const value = req.headers.get(header);
    if (value && !inputSanitizer.validateQueryParameter(value)) {
      throw new ValidationError(
        `Suspicious header detected: ${header}`,
        400,
        'SUSPICIOUS_HEADER'
      );
    }
  }

  // Validate request size
  const contentLength = parseInt(req.headers.get('content-length') || '0');
  if (contentLength > 10 * 1024 * 1024) { // 10MB limit
    throw new ValidationError(
      'Request too large',
      413,
      'REQUEST_TOO_LARGE'
    );
  }

  // Check for bot/crawler patterns in user agent
  const userAgent = req.headers.get('user-agent') || '';
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i
  ];
  
  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    // Log bot access but don't block (might be legitimate)
    console.log('Bot access detected', {
      userAgent,
      clientId: context.clientId,
      url: req.url
    });
  }
}

/**
 * Handle validation errors
 */
function handleValidationError(error: unknown): NextResponse {
  console.error('Validation error:', error);

  if (error instanceof ValidationError) {
    const response = {
      error: error.message,
      code: error.code,
      ...(error.details && { details: error.details })
    };

    // Add retry-after header for rate limiting
    const headers: HeadersInit = {};
    if (error.code === 'RATE_LIMIT_EXCEEDED' && error.details?.retryAfter) {
      headers['Retry-After'] = error.details.retryAfter.toString();
    }

    return NextResponse.json(response, {
      status: error.statusCode,
      headers
    });
  }

  // Generic error response
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    },
    { status: 500 }
  );
}

/**
 * Simplified validation for basic endpoints
 */
export function withBasicValidation(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: Pick<ValidationOptions, 'allowedMethods' | 'sanitizeInput'> = {}
) {
  return async function(req: NextRequest): Promise<NextResponse> {
    try {
      // Method validation
      if (options.allowedMethods && !options.allowedMethods.includes(req.method)) {
        throw new ValidationError(
          `Method ${req.method} not allowed`,
          405,
          'METHOD_NOT_ALLOWED'
        );
      }

      // Basic security checks
      const clientId = extractClientId(req);
      await performSecurityChecks(req, { clientId });

      return await handler(req);

    } catch (error) {
      return handleValidationError(error);
    }
  };
}

/**
 * Export validation schemas for common use cases
 */
export const CommonSchemas = {
  // Analytics query schema
  AnalyticsQuery: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    limit: z.number().min(1).max(1000).optional(),
    offset: z.number().min(0).optional(),
    metrics: z.array(z.string()).optional()
  }),

  // Tenant validation
  TenantHeaders: z.object({
    tenantId: z.string().min(1)
  }),

  // Pagination
  Pagination: z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20)
  })
};

/**
 * Performance monitoring wrapper
 */
export function withPerformanceMonitoring<T>(
  validationFn: (req: NextRequest) => Promise<T>
) {
  return async function(req: NextRequest): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await validationFn(req);
      const duration = performance.now() - start;
      
      // Log slow validations
      if (duration > 100) { // 100ms threshold
        console.warn('Slow validation detected', {
          url: req.url,
          method: req.method,
          duration: `${duration.toFixed(2)}ms`
        });
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error('Validation failed', {
        url: req.url,
        method: req.method,
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };
}