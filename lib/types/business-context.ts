/**
 * Business Context Types
 * Unified business ID mapping and context management for voice-bot integration
 */

import { BusinessIdentifier, BusinessContext } from './integration';

// ============================================================================
// BUSINESS ID RESOLUTION TYPES
// ============================================================================

/**
 * Business ID resolver configuration
 */
export interface BusinessIdResolverConfig {
  cacheEnabled: boolean;
  cacheTTL: number;        // Cache time-to-live in milliseconds
  maxCacheSize: number;    // Maximum number of cached entries
  retryAttempts: number;   // Number of retry attempts for failed resolutions
  timeoutMs: number;       // Query timeout in milliseconds
}

/**
 * Business resolution result with detailed status
 */
export interface BusinessResolutionResult {
  success: boolean;
  business?: BusinessResolution;
  error?: string;
  fromCache: boolean;
  executionTime: number;
  retryCount?: number;
}

/**
 * Complete business resolution data
 */
export interface BusinessResolution {
  uuid: string;            // Internal UUID for website operations
  external_id: string;     // External ID from voice-bot system
  name: string;           // Business name
  active: boolean;        // Active status
  tenant_id: string;      // Tenant identifier
  created_at: Date;       // Creation timestamp
  updated_at: Date;       // Last update timestamp
}

/**
 * Business access validation result
 */
export interface BusinessAccessResult {
  hasAccess: boolean;
  role?: 'owner' | 'manager' | 'staff';
  permissions?: string[];
  businessContext?: BusinessContext;
}

// ============================================================================
// CACHE MANAGEMENT TYPES
// ============================================================================

/**
 * Cache entry for business ID mappings
 */
export interface BusinessCacheEntry {
  uuid: string;
  external_id: string;
  name: string;
  active: boolean;
  tenant_id: string;
  timestamp: number;       // Cache timestamp
  hits: number;           // Cache hit count
  expires_at: number;     // Expiration timestamp
}

/**
 * Cache statistics for monitoring
 */
export interface BusinessCacheStats {
  size: number;           // Current cache size
  hitRate: number;        // Cache hit rate percentage
  missRate: number;       // Cache miss rate percentage
  totalRequests: number;  // Total requests processed
  totalHits: number;      // Total cache hits
  totalMisses: number;    // Total cache misses
  averageResponseTime: number; // Average response time in ms
  oldestEntry?: Date;     // Oldest cache entry timestamp
  newestEntry?: Date;     // Newest cache entry timestamp
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Business ID validation rules
 */
export interface BusinessIdValidation {
  minLength: number;
  maxLength: number;
  allowedCharacters: RegExp;
  required: boolean;
}

/**
 * Business context validation result
 */
export interface BusinessContextValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  businessContext?: BusinessContext;
}

/**
 * Validates business identifier format
 */
export function validateBusinessId(businessId: string | undefined | null): businessId is string {
  if (!businessId || typeof businessId !== 'string') {
    return false;
  }
  
  // Check for valid UUID format or valid external ID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const externalIdRegex = /^[a-zA-Z0-9_-]{1,50}$/;
  
  return uuidRegex.test(businessId) || externalIdRegex.test(businessId);
}

/**
 * Validates complete business context
 */
export function validateBusinessContext(context: any): BusinessContextValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!context || typeof context !== 'object') {
    errors.push('Business context must be an object');
    return { valid: false, errors, warnings };
  }
  
  if (!validateBusinessId(context.businessId)) {
    errors.push('Invalid businessId format');
  }
  
  if (!validateBusinessId(context.externalId)) {
    errors.push('Invalid externalId format');
  }
  
  if (!context.tenantId || typeof context.tenantId !== 'string') {
    errors.push('tenantId is required and must be a string');
  }
  
  if (typeof context.active !== 'boolean') {
    warnings.push('active status should be boolean, defaulting to true');
    context.active = true;
  }
  
  const valid = errors.length === 0;
  const businessContext = valid ? context as BusinessContext : undefined;
  
  return { valid, errors, warnings, businessContext };
}

// ============================================================================
// MAPPING UTILITY TYPES
// ============================================================================

/**
 * Business ID mapping entry for database storage
 */
export interface BusinessIdMappingEntry {
  id: string;              // Primary key
  external_id: string;     // Voice-bot external ID
  business_uuid: string;   // Website UUID
  tenant_id: string;       // Tenant context
  name: string;           // Business name
  active: boolean;        // Active status
  created_at: Date;       // Creation timestamp
  updated_at: Date;       // Last update timestamp
  last_validated: Date;   // Last validation timestamp
}

/**
 * Batch mapping request
 */
export interface BatchMappingRequest {
  external_ids: string[];
  include_inactive?: boolean;
  cache_results?: boolean;
}

/**
 * Batch mapping response
 */
export interface BatchMappingResponse {
  mappings: Map<string, BusinessResolution>;
  errors: Map<string, string>;
  stats: {
    requested: number;
    resolved: number;
    cached: number;
    errors: number;
    executionTime: number;
  };
}

// ============================================================================
// TENANT ISOLATION TYPES
// ============================================================================

/**
 * Tenant context for multi-tenant operations
 */
export interface TenantContext {
  tenantId: string;
  businessIds: string[];  // All business IDs in this tenant
  permissions: string[];  // Tenant-level permissions
  restrictions: string[]; // Tenant-level restrictions
}

/**
 * Multi-tenant business resolution
 */
export interface MultiTenantBusinessResolution {
  tenantContext: TenantContext;
  businessResolutions: Map<string, BusinessResolution>;
  accessValidations: Map<string, BusinessAccessResult>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Business resolution error codes
 */
export enum BusinessResolutionErrorCode {
  INVALID_EXTERNAL_ID = 'INVALID_EXTERNAL_ID',
  BUSINESS_NOT_FOUND = 'BUSINESS_NOT_FOUND',
  BUSINESS_INACTIVE = 'BUSINESS_INACTIVE',
  ACCESS_DENIED = 'ACCESS_DENIED',
  CACHE_ERROR = 'CACHE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

/**
 * Detailed business resolution error
 */
export interface BusinessResolutionError {
  code: BusinessResolutionErrorCode;
  message: string;
  external_id?: string;
  business_uuid?: string;
  tenant_id?: string;
  details?: Record<string, any>;
  timestamp: Date;
  retryable: boolean;
}

/**
 * Creates a standardized business resolution error
 */
export function createBusinessResolutionError(
  code: BusinessResolutionErrorCode,
  message: string,
  details?: {
    external_id?: string;
    business_uuid?: string;
    tenant_id?: string;
    retryable?: boolean;
    [key: string]: any;
  }
): BusinessResolutionError {
  return {
    code,
    message,
    external_id: details?.external_id,
    business_uuid: details?.business_uuid,
    tenant_id: details?.tenant_id,
    details,
    timestamp: new Date(),
    retryable: details?.retryable ?? false
  };
}

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/**
 * Type guard for business resolution result
 */
export function isSuccessfulResolution(result: BusinessResolutionResult): result is BusinessResolutionResult & { business: BusinessResolution } {
  return result.success && result.business !== undefined;
}

/**
 * Type guard for business cache entry
 */
export function isValidCacheEntry(entry: any): entry is BusinessCacheEntry {
  return (
    typeof entry === 'object' &&
    typeof entry.uuid === 'string' &&
    typeof entry.external_id === 'string' &&
    typeof entry.timestamp === 'number' &&
    typeof entry.expires_at === 'number'
  );
}

/**
 * Converts external ID to internal UUID format if needed
 */
export function normalizeBusinessId(id: string): string {
  // If it's already a UUID, return as-is
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id;
  }
  
  // For external IDs, we'll need to resolve them through the mapping service
  // This is a placeholder - actual resolution happens in the service layer
  return id;
}