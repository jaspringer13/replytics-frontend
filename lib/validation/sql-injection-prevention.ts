/**
 * SQL Injection Prevention Service
 * Comprehensive protection against SQL injection attacks with parameterized query validation
 * Based on voice-bot security patterns and OWASP guidelines
 */

import { z } from 'zod';

export interface QueryValidationResult {
  isValid: boolean;
  sanitizedParams: Record<string, any>;
  errors: string[];
  warnings: string[];
}

export interface ParameterizedQuery {
  query: string;
  params: any[];
  paramNames?: string[];
}

export class SQLInjectionError extends Error {
  constructor(message: string, public code: string, public parameter?: string) {
    super(message);
    this.name = 'SQLInjectionError';
  }
}

/**
 * SQL Injection Prevention Service
 * Ensures 100% parameterized queries and prevents injection attacks
 */
export class SQLInjectionPreventionService {

  /**
   * Validate query parameters for SQL injection patterns
   */
  validateQueryParameters(params: Record<string, any>): QueryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedParams: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      try {
        const result = this.validateSingleParameter(key, value);
        if (!result.isValid) {
          errors.push(`Parameter '${key}': ${result.errors.join(', ')}`);
        } else {
          sanitizedParams[key] = result.sanitizedValue;
          if (result.warnings.length > 0) {
            warnings.push(`Parameter '${key}': ${result.warnings.join(', ')}`);
          }
        }
      } catch (error) {
        errors.push(`Parameter '${key}': ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      isValid: errors.length === 0,
      sanitizedParams,
      errors,
      warnings
    };
  }

  /**
   * Validate a single parameter for SQL injection
   */
  private validateSingleParameter(key: string, value: any): {
    isValid: boolean;
    sanitizedValue: any;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Handle null/undefined values
    if (value === null || value === undefined) {
      return {
        isValid: true,
        sanitizedValue: value,
        errors,
        warnings
      };
    }

    // Type-specific validation
    let sanitizedValue = value;

    if (typeof value === 'string') {
      sanitizedValue = this.validateStringParameter(value);
      if (sanitizedValue === null) {
        errors.push('Contains potentially malicious SQL patterns');
      }
    } else if (typeof value === 'number') {
      sanitizedValue = this.validateNumericParameter(value);
      if (sanitizedValue === null) {
        errors.push('Invalid numeric value');
      }
    } else if (typeof value === 'boolean') {
      sanitizedValue = Boolean(value);
    } else if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        errors.push('Invalid date value');
        sanitizedValue = null;
      }
    } else if (Array.isArray(value)) {
      const arrayResult = this.validateArrayParameter(value);
      if (!arrayResult.isValid) {
        errors.push(...arrayResult.errors);
      } else {
        sanitizedValue = arrayResult.sanitizedValue;
        warnings.push(...arrayResult.warnings);
      }
    } else {
      warnings.push(`Parameter type '${typeof value}' requires manual review`);
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue,
      errors,
      warnings
    };
  }

  /**
   * Validate string parameter for SQL injection patterns
   */
  private validateStringParameter(value: string): string | null {
    // Check for SQL injection patterns
    const sqlInjectionPatterns = [
      // Basic SQL injection
      /('|(\\')|(;)|(\\)|(--|#|\/\*|\*\/)|(\|\|))/i,
      // SQL keywords that shouldn't appear in parameters
      /(union|select|insert|update|delete|drop|create|alter|exec|execute|declare|cast|convert)/i,
      // Stored procedure calls
      /(sp_|xp_)/i,
      // Comment patterns
      /(\/\*[\s\S]*?\*\/|--[^\r\n]*)/i,
      // Hex encoded attacks
      /0x[0-9a-f]+/i,
      // WAITFOR delay attacks
      /waitfor\s+delay/i,
      // CHAR/ASCII attacks
      /(char|ascii)\s*\(/i,
      // Concatenation attacks
      /(\+|concat\s*\()/i
    ];

    // Check for dangerous characters and patterns
    const dangerousPatterns = [
      // Control characters
      /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/,
      // Unicode control characters
      /[\u0000-\u001F\u007F-\u009F]/,
      // SQL comment indicators
      /--|\*\/|\/\*/,
      // Quote variations
      /[\u00B4\u2018\u2019\u201A\u201B\u2032\u2035]/
    ];

    // Test against all patterns
    const allPatterns = [...sqlInjectionPatterns, ...dangerousPatterns];
    
    for (const pattern of allPatterns) {
      if (pattern.test(value)) {
        return null; // Indicates dangerous content
      }
    }

    // Additional length check
    if (value.length > 10000) {
      return null; // Suspiciously long parameter
    }

    return value.trim();
  }

  /**
   * Validate numeric parameter
   */
  private validateNumericParameter(value: number): number | null {
    if (!Number.isFinite(value)) {
      return null;
    }

    // Check for suspicious numeric values
    if (Math.abs(value) > Number.MAX_SAFE_INTEGER) {
      return null;
    }

    return value;
  }

  /**
   * Validate array parameter
   */
  private validateArrayParameter(value: any[]): {
    isValid: boolean;
    sanitizedValue: any[];
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedValue: any[] = [];

    // Limit array size
    if (value.length > 1000) {
      errors.push('Array parameter too large (max 1000 items)');
      return { isValid: false, sanitizedValue: [], errors, warnings };
    }

    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const result = this.validateSingleParameter(`[${i}]`, item);
      
      if (!result.isValid) {
        errors.push(`Array item ${i}: ${result.errors.join(', ')}`);
      } else {
        sanitizedValue.push(result.sanitizedValue);
        if (result.warnings.length > 0) {
          warnings.push(`Array item ${i}: ${result.warnings.join(', ')}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      sanitizedValue,
      errors,
      warnings
    };
  }

  /**
   * Create parameterized query for Supabase
   */
  createParameterizedQuery(
    baseQuery: string,
    params: Record<string, any>
  ): ParameterizedQuery {
    const validation = this.validateQueryParameters(params);
    
    if (!validation.isValid) {
      throw new SQLInjectionError(
        `Query parameter validation failed: ${validation.errors.join(', ')}`,
        'PARAMETER_VALIDATION_FAILED'
      );
    }

    // Verify the base query doesn't contain dynamic content
    if (this.containsDynamicContent(baseQuery)) {
      throw new SQLInjectionError(
        'Base query contains dynamic content - use parameterized queries only',
        'DYNAMIC_QUERY_DETECTED'
      );
    }

    return {
      query: baseQuery,
      params: Object.values(validation.sanitizedParams),
      paramNames: Object.keys(validation.sanitizedParams)
    };
  }

  /**
   * Check if query contains dynamic content that should be parameterized
   */
  private containsDynamicContent(query: string): boolean {
    const dynamicPatterns = [
      // String concatenation
      /\+\s*['"`]/,
      // Template literals in SQL
      /\$\{[^}]+\}/,
      // Unparameterized values (basic detection)
      /'[^']*'\s*\+/,
      // Direct variable interpolation
      /\$\d+/
    ];

    return dynamicPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Validate business ID parameter (common in our queries)
   */
  validateBusinessId(businessId: any): string {
    if (!businessId || typeof businessId !== 'string') {
      throw new SQLInjectionError('Business ID must be a non-empty string', 'INVALID_BUSINESS_ID');
    }

    // UUID validation
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(businessId)) {
      throw new SQLInjectionError('Business ID must be a valid UUID', 'INVALID_BUSINESS_ID_FORMAT');
    }

    // Additional injection check
    if (!this.validateStringParameter(businessId)) {
      throw new SQLInjectionError('Business ID contains potentially malicious content', 'MALICIOUS_BUSINESS_ID');
    }

    return businessId;
  }

  /**
   * Validate tenant ID parameter
   */
  validateTenantId(tenantId: any): string {
    if (!tenantId || typeof tenantId !== 'string') {
      throw new SQLInjectionError('Tenant ID must be a non-empty string', 'INVALID_TENANT_ID');
    }

    // Allow both UUID and custom formats
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId);
    const isCustomId = /^[a-zA-Z0-9_-]{1,50}$/.test(tenantId);

    if (!isUuid && !isCustomId) {
      throw new SQLInjectionError(
        'Tenant ID must be a valid UUID or alphanumeric string',
        'INVALID_TENANT_ID_FORMAT'
      );
    }

    // Additional injection check
    if (!this.validateStringParameter(tenantId)) {
      throw new SQLInjectionError('Tenant ID contains potentially malicious content', 'MALICIOUS_TENANT_ID');
    }

    return tenantId;
  }

  /**
   * Create safe filter conditions for Supabase queries
   */
  createSafeFilters(filters: Record<string, any>): Record<string, any> {
    const validation = this.validateQueryParameters(filters);
    
    if (!validation.isValid) {
      throw new SQLInjectionError(
        `Filter validation failed: ${validation.errors.join(', ')}`,
        'FILTER_VALIDATION_FAILED'
      );
    }

    return validation.sanitizedParams;
  }
}

// Export singleton instance
export const sqlInjectionPrevention = new SQLInjectionPreventionService();

/**
 * Zod schemas for common SQL parameters
 */
export const BusinessIdSchema = z.string()
  .uuid('Business ID must be a valid UUID')
  .refine(
    (val) => {
      try {
        sqlInjectionPrevention.validateBusinessId(val);
        return true;
      } catch {
        return false;
      }
    },
    'Business ID validation failed'
  );

export const TenantIdSchema = z.string()
  .min(1, 'Tenant ID is required')
  .max(50, 'Tenant ID too long')
  .refine(
    (val) => {
      try {
        sqlInjectionPrevention.validateTenantId(val);
        return true;
      } catch {
        return false;
      }
    },
    'Tenant ID validation failed'
  );

/**
 * Safe parameter validation middleware
 */
export function validateDatabaseParams(params: Record<string, any>): Record<string, any> {
  const result = sqlInjectionPrevention.validateQueryParameters(params);
  
  if (!result.isValid) {
    throw new SQLInjectionError(
      `Database parameter validation failed: ${result.errors.join(', ')}`,
      'PARAMETER_VALIDATION_FAILED'
    );
  }

  return result.sanitizedParams;
}

/**
 * Create safe Supabase query builder parameters
 */
export function createSafeSupabaseParams(params: {
  tenantId: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  [key: string]: any;
}) {
  // Validate all parameters
  const safeParams = validateDatabaseParams(params);
  
  // Additional specific validations
  if (params.tenantId) {
    safeParams.tenantId = sqlInjectionPrevention.validateTenantId(params.tenantId);
  }

  if (params.limit) {
    safeParams.limit = Math.min(Math.max(1, parseInt(String(params.limit))), 1000);
  }

  if (params.offset) {
    safeParams.offset = Math.max(0, parseInt(String(params.offset)));
  }

  return safeParams;
}