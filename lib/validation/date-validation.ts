/**
 * Comprehensive Date Validation Service
 * Implements bulletproof date validation with range limits and timezone handling
 * Based on voice-bot patterns with SQL injection prevention
 */

import { z } from 'zod';

export interface DateRangeFilter {
  startDate: Date;
  endDate: Date;
}

export interface DateValidationOptions {
  maxRangeDays?: number;
  allowFutureDates?: boolean;
  maxHistoryDays?: number;
  timezone?: string;
}

export class DateValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'DateValidationError';
  }
}

/**
 * Comprehensive date validation schema with security constraints
 */
export const DateRangeSchema = z.object({
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
    .refine((date) => {
      const parsed = new Date(date + 'T00:00:00.000Z');
      return !isNaN(parsed.getTime()) && parsed.toISOString().startsWith(date);
    }, 'Invalid date value')
    .optional(),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')  
    .refine((date) => {
      const parsed = new Date(date + 'T00:00:00.000Z');
      return !isNaN(parsed.getTime()) && parsed.toISOString().startsWith(date);
    }, 'Invalid date value')
    .optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate + 'T00:00:00.000Z');
    const end = new Date(data.endDate + 'T23:59:59.999Z');
    
    // Validate date range constraints
    if (start >= end) {
      return false; // Start must be before end
    }
    
    // Prevent excessive date ranges (performance protection)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      return false; // Max 1 year range by default
    }
  }
  return true;
}, {
  message: "Invalid date range: start must be before end and range cannot exceed 365 days"
});

/**
 * Parse and validate date range from strings with comprehensive security checks
 * Prevents Invalid Date objects and SQL injection
 */
export function parseDateRangeFilter(
  startDate: string | null, 
  endDate: string | null, 
  options: DateValidationOptions = {}
): DateRangeFilter {
  const {
    maxRangeDays = 365,
    allowFutureDates = false,
    maxHistoryDays = 1095, // 3 years
    timezone = 'UTC'
  } = options;

  // Input sanitization - prevent SQL injection in date parameters
  if (startDate && !isValidDateString(startDate)) {
    throw new DateValidationError('Invalid start date format or potential injection attempt', 'INVALID_START_DATE');
  }
  
  if (endDate && !isValidDateString(endDate)) {
    throw new DateValidationError('Invalid end date format or potential injection attempt', 'INVALID_END_DATE');
  }

  let start: Date;
  let end: Date;

  if (startDate && endDate) {
    // Parse dates with timezone handling and validation
    start = parseSecureDate(startDate, timezone);
    end = parseSecureDate(endDate, timezone);
    
    // Set end date to end of day
    end.setHours(23, 59, 59, 999);
  } else {
    // Use default range (last 30 days)
    end = new Date();
    end.setHours(23, 59, 59, 999);
    
    start = new Date(end);
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
  }

  // Validate date range constraints
  validateDateRange(start, end, {
    maxRangeDays,
    allowFutureDates,
    maxHistoryDays
  });

  return { startDate: start, endDate: end };
}

/**
 * Validate date string format and prevent injection attacks
 */
function isValidDateString(dateStr: string): boolean {
  // Strict format validation - only allow YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return false;
  }

  // Check for SQL injection patterns in date strings
  const suspiciousPatterns = [
    /('|(\\')|(;)|(\\)|(--|#|\/\*|\*\/))/i,
    /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i,
    /(script|javascript|vbscript|onload|onerror)/i,
    /[<>]/,
    /\x00/
  ];

  return !suspiciousPatterns.some(pattern => pattern.test(dateStr));
}

/**
 * Securely parse date string with comprehensive validation
 */
function parseSecureDate(dateStr: string, timezone: string = 'UTC'): Date {
  // Parse date in UTC to prevent timezone issues
  const date = new Date(dateStr + 'T00:00:00.000Z');
  
  if (isNaN(date.getTime())) {
    throw new DateValidationError(`Invalid date: ${dateStr}`, 'INVALID_DATE_VALUE');
  }

  // Validate date components match input (prevents date rollover)
  const isoString = date.toISOString();
  if (!isoString.startsWith(dateStr)) {
    throw new DateValidationError(`Date validation failed for: ${dateStr}`, 'DATE_ROLLOVER_DETECTED');
  }

  return date;
}

/**
 * Validate date range against business constraints
 */
function validateDateRange(
  start: Date, 
  end: Date, 
  options: Required<Pick<DateValidationOptions, 'maxRangeDays' | 'allowFutureDates' | 'maxHistoryDays'>>
): void {
  const now = new Date();
  
  // Check if start is before end
  if (start >= end) {
    throw new DateValidationError('Start date must be before end date', 'INVALID_DATE_ORDER');
  }

  // Check maximum range
  const rangeDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (rangeDays > options.maxRangeDays) {
    throw new DateValidationError(
      `Date range cannot exceed ${options.maxRangeDays} days (requested: ${rangeDays} days)`, 
      'RANGE_TOO_LARGE'
    );
  }

  // Check future dates if not allowed
  if (!options.allowFutureDates && end > now) {
    throw new DateValidationError('Future dates are not allowed', 'FUTURE_DATE_NOT_ALLOWED');
  }

  // Check historical data limits
  const maxHistoryDate = new Date(now);
  maxHistoryDate.setDate(maxHistoryDate.getDate() - options.maxHistoryDays);
  
  if (start < maxHistoryDate) {
    throw new DateValidationError(
      `Historical data access limited to ${options.maxHistoryDays} days`, 
      'HISTORICAL_LIMIT_EXCEEDED'
    );
  }
}

/**
 * Format date for SQL queries with parameterization support
 */
export function formatDateForQuery(date: Date): string {
  return date.toISOString();
}

/**
 * Create date range for database queries with proper parameterization
 */
export function createQueryDateRange(dateRange: DateRangeFilter): {
  startParam: string;
  endParam: string;
} {
  return {
    startParam: formatDateForQuery(dateRange.startDate),
    endParam: formatDateForQuery(dateRange.endDate)
  };
}

/**
 * Validate and normalize date query parameters
 */
export function validateQueryDateParams(params: {
  startDate?: string | null;
  endDate?: string | null;
  maxRangeDays?: number;
}): DateRangeFilter {
  try {
    const { startDate, endDate, maxRangeDays = 365 } = params;
    
    return parseDateRangeFilter(startDate || null, endDate || null, {
      maxRangeDays,
      allowFutureDates: false,
      maxHistoryDays: 1095 // 3 years
    });
  } catch (error) {
    if (error instanceof DateValidationError) {
      throw error;
    }
    throw new DateValidationError(
      `Date parameter validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'VALIDATION_ERROR'
    );
  }
}

/**
 * Get default date range (last 30 days)
 */
export function getDefaultDateRange(): DateRangeFilter {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  start.setHours(0, 0, 0, 0);
  
  return { startDate: start, endDate: end };
}

/**
 * Timezone-aware date parsing with validation
 */
export function parseTimezoneAwareDate(
  dateStr: string, 
  timezone: string = 'UTC'
): Date {
  if (!isValidDateString(dateStr)) {
    throw new DateValidationError('Invalid date format', 'INVALID_FORMAT');
  }
  
  // For security, we only support UTC for now
  // In production, you might want to add proper timezone support
  if (timezone !== 'UTC') {
    console.warn(`Timezone ${timezone} not supported, using UTC`);
  }
  
  return parseSecureDate(dateStr, 'UTC');
}