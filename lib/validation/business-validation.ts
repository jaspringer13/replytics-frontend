/**
 * Business Logic Validation Service
 * Implements business rule validation for analytics queries with permission enforcement
 * Based on voice-bot patterns and tenant isolation requirements
 */

import { z } from 'zod';
import { DateRangeFilter } from './date-validation';

export interface ValidatedSession {
  userId: string;
  tenantId: string;
  businessId: string;
  tier: 'free' | 'pro' | 'enterprise';
  permissions: string[];
  dataRetentionDays: number;
}

export interface AnalyticsQuery {
  businessId: string;
  tenantId: string;
  startDate?: string;
  endDate?: string;
  metrics?: string[];
  limit?: number;
  offset?: number;
  filters?: Record<string, any>;
}

export interface BusinessValidationResult {
  isValid: boolean;
  sanitizedQuery: AnalyticsQuery;
  errors: string[];
  warnings: string[];
}

export class BusinessValidationError extends Error {
  constructor(message: string, public code: string, public context?: any) {
    super(message);
    this.name = 'BusinessValidationError';
  }
}

/**
 * Business Logic Validation Service
 * Enforces business rules, permissions, and data access policies
 */
export class BusinessValidationService {
  
  // Available metrics and their required permissions
  private readonly metricPermissions: Record<string, string[]> = {
    totalRevenue: ['analytics:read', 'revenue:read'],
    totalAppointments: ['analytics:read', 'appointments:read'],
    totalCustomers: ['analytics:read', 'customers:read'],
    averageServiceValue: ['analytics:read', 'revenue:read'],
    bookingRate: ['analytics:read', 'appointments:read'],
    noShowRate: ['analytics:read', 'appointments:read'],
    revenueTrend: ['analytics:read', 'revenue:read', 'trends:read'],
    appointmentTrend: ['analytics:read', 'appointments:read', 'trends:read'],
    customerTrend: ['analytics:read', 'customers:read', 'trends:read'],
    servicePerformance: ['analytics:read', 'services:read'],
    customerSegments: ['analytics:read', 'customers:read', 'segments:read'],
    popularTimes: ['analytics:read', 'appointments:read'],
  };

  // Data retention policies by tier
  private readonly dataRetentionPolicies: Record<string, number> = {
    free: 30, // 30 days
    pro: 365, // 1 year
    enterprise: 1095 // 3 years
  };

  // Query limits by tier
  private readonly queryLimits: Record<string, { maxLimit: number; defaultLimit: number }> = {
    free: { maxLimit: 50, defaultLimit: 25 },
    pro: { maxLimit: 200, defaultLimit: 50 },
    enterprise: { maxLimit: 1000, defaultLimit: 100 }
  };

  /**
   * Validate analytics query against business rules and permissions
   */
  async validateAnalyticsQuery(
    query: AnalyticsQuery,
    session: ValidatedSession
  ): Promise<BusinessValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedQuery: AnalyticsQuery = { ...query };

    try {
      // 1. Validate business access
      await this.validateBusinessAccess(query, session);

      // 2. Validate metrics permissions
      if (query.metrics) {
        await this.validateMetricsAccess(query.metrics, session);
      }

      // 3. Validate date range against retention policy
      if (query.startDate || query.endDate) {
        await this.validateDateRangeAccess(query, session);
      }

      // 4. Validate and sanitize query limits
      sanitizedQuery.limit = this.validateQueryLimit(query.limit, session);
      sanitizedQuery.offset = this.validateQueryOffset(query.offset);

      // 5. Validate filters
      if (query.filters) {
        sanitizedQuery.filters = await this.validateQueryFilters(query.filters, session);
      }

      // 6. Apply tier-specific restrictions
      await this.applyTierRestrictions(sanitizedQuery, session, warnings);

    } catch (error) {
      if (error instanceof BusinessValidationError) {
        errors.push(error.message);
      } else {
        errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      isValid: errors.length === 0,
      sanitizedQuery,
      errors,
      warnings
    };
  }

  /**
   * Validate business access - ensure user can access the requested business
   */
  private async validateBusinessAccess(
    query: AnalyticsQuery,
    session: ValidatedSession
  ): Promise<void> {
    // Check business ID match
    if (query.businessId !== session.businessId) {
      throw new BusinessValidationError(
        'Business ID does not match session context',
        'BUSINESS_ACCESS_DENIED',
        { queryBusinessId: query.businessId, sessionBusinessId: session.businessId }
      );
    }

    // Check tenant ID match
    if (query.tenantId !== session.tenantId) {
      throw new BusinessValidationError(
        'Tenant ID does not match session context',
        'TENANT_ACCESS_DENIED',
        { queryTenantId: query.tenantId, sessionTenantId: session.tenantId }
      );
    }

    // Verify business exists and user has access
    const hasAccess = await this.verifyBusinessAccess(session.userId, query.businessId);
    if (!hasAccess) {
      throw new BusinessValidationError(
        'User does not have access to the requested business',
        'BUSINESS_ACCESS_FORBIDDEN',
        { userId: session.userId, businessId: query.businessId }
      );
    }
  }

  /**
   * Validate metrics access based on user permissions
   */
  private async validateMetricsAccess(
    requestedMetrics: string[],
    session: ValidatedSession
  ): Promise<void> {
    const deniedMetrics: string[] = [];

    for (const metric of requestedMetrics) {
      const requiredPermissions = this.metricPermissions[metric];
      
      if (!requiredPermissions) {
        throw new BusinessValidationError(
          `Unknown metric: ${metric}`,
          'UNKNOWN_METRIC',
          { metric }
        );
      }

      // Check if user has all required permissions for this metric
      const hasAllPermissions = requiredPermissions.every(permission =>
        session.permissions.includes(permission)
      );

      if (!hasAllPermissions) {
        const missingPermissions = requiredPermissions.filter(permission =>
          !session.permissions.includes(permission)
        );
        deniedMetrics.push(`${metric} (missing: ${missingPermissions.join(', ')})`);
      }
    }

    if (deniedMetrics.length > 0) {
      throw new BusinessValidationError(
        `Access denied to metrics: ${deniedMetrics.join(', ')}`,
        'METRICS_ACCESS_DENIED',
        { deniedMetrics, userPermissions: session.permissions }
      );
    }
  }

  /**
   * Validate date range access against data retention policy
   */
  private async validateDateRangeAccess(
    query: AnalyticsQuery,
    session: ValidatedSession
  ): Promise<void> {
    if (!query.startDate && !query.endDate) {
      return; // No date range specified, use defaults
    }

    const maxRetentionDays = session.dataRetentionDays || this.dataRetentionPolicies[session.tier];
    const earliestAllowed = new Date();
    earliestAllowed.setDate(earliestAllowed.getDate() - maxRetentionDays);

    if (query.startDate) {
      const startDate = new Date(query.startDate);
      if (startDate < earliestAllowed) {
        throw new BusinessValidationError(
          `Historical data access limited to ${maxRetentionDays} days for ${session.tier} tier`,
          'HISTORICAL_LIMIT_EXCEEDED',
          { 
            requestedDate: query.startDate,
            earliestAllowed: earliestAllowed.toISOString().split('T')[0],
            maxRetentionDays,
            tier: session.tier
          }
        );
      }
    }

    // Additional validation for free tier - no more than 30 days range
    if (session.tier === 'free' && query.startDate && query.endDate) {
      const start = new Date(query.startDate);
      const end = new Date(query.endDate);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 30) {
        throw new BusinessValidationError(
          'Free tier is limited to 30-day date ranges',
          'FREE_TIER_RANGE_LIMIT',
          { requestedDays: daysDiff, maxDays: 30 }
        );
      }
    }
  }

  /**
   * Validate and sanitize query limit
   */
  private validateQueryLimit(limit: number | undefined, session: ValidatedSession): number {
    const tierLimits = this.queryLimits[session.tier];
    
    if (!limit) {
      return tierLimits.defaultLimit;
    }

    if (limit < 1) {
      return 1;
    }

    if (limit > tierLimits.maxLimit) {
      return tierLimits.maxLimit;
    }

    return Math.floor(limit);
  }

  /**
   * Validate and sanitize query offset
   */
  private validateQueryOffset(offset: number | undefined): number {
    if (!offset || offset < 0) {
      return 0;
    }

    // Prevent excessive offset to avoid performance issues
    if (offset > 10000) {
      return 10000;
    }

    return Math.floor(offset);
  }

  /**
   * Validate query filters
   */
  private async validateQueryFilters(
    filters: Record<string, any>,
    session: ValidatedSession
  ): Promise<Record<string, any>> {
    const sanitizedFilters: Record<string, any> = {};
    const allowedFilters = await this.getAllowedFilters(session);

    for (const [key, value] of Object.entries(filters)) {
      if (!allowedFilters.includes(key)) {
        throw new BusinessValidationError(
          `Filter '${key}' is not allowed for your permission level`,
          'FILTER_NOT_ALLOWED',
          { filter: key, allowedFilters }
        );
      }

      // Sanitize filter values
      sanitizedFilters[key] = this.sanitizeFilterValue(value);
    }

    return sanitizedFilters;
  }

  /**
   * Apply tier-specific restrictions
   */
  private async applyTierRestrictions(
    query: AnalyticsQuery,
    session: ValidatedSession,
    warnings: string[]
  ): Promise<void> {
    switch (session.tier) {
      case 'free':
        // Free tier restrictions
        if (query.metrics && query.metrics.length > 5) {
          query.metrics = query.metrics.slice(0, 5);
          warnings.push('Free tier limited to 5 metrics per query');
        }
        break;

      case 'pro':
        // Pro tier restrictions
        if (query.metrics && query.metrics.length > 15) {
          query.metrics = query.metrics.slice(0, 15);
          warnings.push('Pro tier limited to 15 metrics per query');
        }
        break;

      case 'enterprise':
        // Enterprise has no additional restrictions
        break;
    }
  }

  /**
   * Get allowed filters for a session
   */
  private async getAllowedFilters(session: ValidatedSession): Promise<string[]> {
    const baseFilters = ['status', 'dateRange'];
    
    if (session.permissions.includes('services:read')) {
      baseFilters.push('serviceId', 'serviceType');
    }
    
    if (session.permissions.includes('customers:read')) {
      baseFilters.push('customerId', 'customerSegment');
    }
    
    if (session.permissions.includes('staff:read')) {
      baseFilters.push('staffId');
    }
    
    return baseFilters;
  }

  /**
   * Sanitize filter values
   */
  private sanitizeFilterValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      // Remove potentially dangerous characters
      return value.replace(/[<>'"&]/g, '').trim();
    }

    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeFilterValue(item)).slice(0, 50); // Limit array size
    }

    if (typeof value === 'object') {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        if (key.length <= 50) { // Limit key length
          sanitized[key] = this.sanitizeFilterValue(val);
        }
      }
      return sanitized;
    }

    return value;
  }

  /**
   * Verify business access (mock implementation)
   */
  private async verifyBusinessAccess(userId: string, businessId: string): Promise<boolean> {
    // In a real implementation, this would check the database
    // For now, we assume access is valid if we reach this point
    return true;
  }

  /**
   * Get user permissions for analytics
   */
  async getUserPermissions(userId: string, tenantId: string): Promise<string[]> {
    // Mock implementation - in reality, this would fetch from database
    const defaultPermissions = [
      'analytics:read',
      'appointments:read',
      'customers:read',
      'revenue:read'
    ];

    return defaultPermissions;
  }

  /**
   * Get tenant data retention policy
   */
  async getTenantDataRetention(tenantId: string): Promise<number> {
    // Mock implementation - would fetch from database
    return this.dataRetentionPolicies.pro; // Default to pro tier
  }

  /**
   * Validate session context
   */
  validateSessionContext(session: any): ValidatedSession {
    if (!session?.userId || !session?.tenantId || !session?.businessId) {
      throw new BusinessValidationError(
        'Invalid session context - missing required fields',
        'INVALID_SESSION',
        { session }
      );
    }

    const tier = session.tier || 'free';
    if (!['free', 'pro', 'enterprise'].includes(tier)) {
      throw new BusinessValidationError(
        'Invalid tier in session context',
        'INVALID_TIER',
        { tier }
      );
    }

    return {
      userId: session.userId,
      tenantId: session.tenantId,
      businessId: session.businessId,
      tier: tier as 'free' | 'pro' | 'enterprise',
      permissions: session.permissions || [],
      dataRetentionDays: session.dataRetentionDays || this.dataRetentionPolicies[tier]
    };
  }
}

// Export singleton instance
export const businessValidator = new BusinessValidationService();

/**
 * Zod schemas for business validation
 */
export const AnalyticsQuerySchema = z.object({
  businessId: z.string().uuid('Invalid business ID format'),
  tenantId: z.string().min(1, 'Tenant ID is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  metrics: z.array(z.string()).optional(),
  limit: z.number().min(1).max(1000).optional(),
  offset: z.number().min(0).optional(),
  filters: z.record(z.string(), z.any()).optional()
});

export const SessionContextSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  tenantId: z.string().min(1, 'Tenant ID is required'),
  businessId: z.string().uuid('Invalid business ID'),
  tier: z.enum(['free', 'pro', 'enterprise']).default('free'),
  permissions: z.array(z.string()).default([]),
  dataRetentionDays: z.number().positive().optional()
});

/**
 * Helper function to create mock session for testing
 */
export function createMockSession(overrides: Partial<ValidatedSession> = {}): ValidatedSession {
  return {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    tenantId: 'test-tenant',
    businessId: '550e8400-e29b-41d4-a716-446655440001',
    tier: 'pro',
    permissions: [
      'analytics:read',
      'appointments:read',
      'customers:read',
      'revenue:read',
      'trends:read'
    ],
    dataRetentionDays: 365,
    ...overrides
  };
}