/**
 * Unified Integration Types
 * Provides type-safe integration between voice-bot PostgreSQL backend and website Supabase frontend
 * Resolves type mismatches between systems while maintaining compatibility
 */

// ============================================================================
// BUSINESS IDENTIFICATION SYSTEM
// ============================================================================

/**
 * Unified business identifier that handles both string external_ids and UUID internal_ids
 */
export interface BusinessIdentifier {
  external_id: string;      // Voice-bot identifier (always string)
  business_uuid: string;    // Internal UUID (website standard)
  tenant_id: string;        // Tenant context (consistent across systems)
}

/**
 * Business context for cross-system operations
 * Ensures consistent business identification across voice-bot and website
 */
export interface BusinessContext {
  businessId: string;       // Always UUID in website context
  externalId: string;       // Always string from voice-bot context
  tenantId: string;         // Consistent tenant identifier
  name?: string;            // Optional business name
  active: boolean;          // Business active status
}

/**
 * Type guard to validate business context
 */
export function isValidBusinessContext(context: any): context is BusinessContext {
  return (
    typeof context === 'object' &&
    typeof context.businessId === 'string' &&
    typeof context.externalId === 'string' &&
    typeof context.tenantId === 'string' &&
    typeof context.active === 'boolean'
  );
}

// ============================================================================
// ANALYTICS DATA TYPES
// ============================================================================

/**
 * Unified trend data point structure
 * Compatible with both voice-bot query results and website chart requirements
 */
export interface TrendDataPoint {
  date: string;    // ISO date string (YYYY-MM-DD)
  value: number;   // Numeric value (revenue, count, etc.)
  count?: number;  // Optional count data for additional context
}

/**
 * Unified analytics response structure
 * Aligns voice-bot database results with website UI expectations
 */
export interface UnifiedAnalyticsResponse {
  metrics: {
    totalRevenue: number;
    totalAppointments: number;
    totalCustomers: number;
    averageServiceValue: number;
    bookingRate: number;
    noShowRate: number;
  };
  trends: {
    revenue: TrendDataPoint[];
    customers: TrendDataPoint[];
    appointments: TrendDataPoint[];
  };
  segments: {
    vip: number;
    regular: number;
    atRisk: number;
    new: number;
    dormant: number;
  };
}

/**
 * Customer analytics result from voice-bot database
 * Structured for type-safe integration with website
 */
export interface CustomerAnalyticsResult {
  customer_id: string;
  segment: 'vip' | 'regular' | 'at_risk' | 'new' | 'dormant';
  total_appointments: number;
  lifetime_value: number;
  last_appointment: string | null;
  no_show_count: number;
  avg_service_value: number;
}

/**
 * Revenue analytics result from voice-bot database
 * Compatible with website trend visualization
 */
export interface RevenueAnalyticsResult {
  date: string;           // ISO date string
  revenue: number;        // Daily revenue total
  appointments: number;   // Daily appointment count
  avg_value: number;      // Average appointment value
}

// ============================================================================
// DATABASE QUERY INTEGRATION
// ============================================================================

/**
 * Unified query result wrapper
 * Provides consistent error handling across database systems
 */
export interface QueryResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
  fromCache: boolean;
  executionTime: number;
}

/**
 * Database connection interface
 * Abstracts differences between PostgreSQL and Supabase clients
 */
export interface DatabaseConnection {
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T[]>>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  close(): Promise<void>;
}

/**
 * Query options for cross-system compatibility
 */
export interface QueryOptions {
  timeout?: number;
  retryAttempts?: number;
  cacheKey?: string;
  cacheTTL?: number;
}

// ============================================================================
// SESSION AND AUTHENTICATION TYPES
// ============================================================================

/**
 * Unified session context
 * Bridges NextAuth sessions with voice-bot JWT tokens
 */
export interface UnifiedSession {
  userId: string;
  businessId: string;      // Always UUID
  externalId: string;      // Voice-bot external ID
  tenantId: string;
  role: string;
  permissions: string[];
  expires: Date;
}

/**
 * Authentication context for cross-system operations
 */
export interface AuthContext {
  session: UnifiedSession;
  businessContext: BusinessContext;
  validatedAt: Date;
}

// ============================================================================
// TYPE CONVERSION UTILITIES
// ============================================================================

/**
 * Convert voice-bot external_id to website business UUID
 */
export interface BusinessIdMapping {
  external_id: string;
  business_uuid: string;
  cached_at: Date;
  expires_at: Date;
}

/**
 * Converts voice-bot trend data to website format
 */
export function convertToTrendDataPoints(voiceBotData: any[]): TrendDataPoint[] {
  return voiceBotData.map(item => ({
    date: item.date || item.appointment_date || item.day,
    value: item.value || item.revenue || item.count || 0,
    count: item.appointment_count || item.total_count
  }));
}

/**
 * Converts website TrendData format to unified format
 */
export function convertFromTrendData(websiteTrendData: {
  current: number;
  previous: number;
  percentChange: number;
  dataPoints: { date: string; value: number }[];
}): TrendDataPoint[] {
  return websiteTrendData.dataPoints.map(point => ({
    date: point.date,
    value: point.value
  }));
}

// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

/**
 * Integration error for cross-system issues
 */
export interface IntegrationError {
  code: string;
  message: string;
  system: 'voice-bot' | 'website' | 'integration';
  context?: Record<string, any>;
  timestamp: Date;
}

/**
 * Creates standardized error for integration issues
 */
export function createIntegrationError(
  code: string,
  message: string,
  system: 'voice-bot' | 'website' | 'integration',
  context?: Record<string, any>
): IntegrationError {
  return {
    code,
    message,
    system,
    context,
    timestamp: new Date()
  };
}

// ============================================================================
// COMPATIBILITY TYPES
// ============================================================================

/**
 * Ensures compatibility with existing dashboard models
 */
export type CompatibleTrendData = {
  current: number;
  previous: number;
  percentChange: number;
  dataPoints: TrendDataPoint[];
};

/**
 * Service performance data compatible across systems
 */
export interface UnifiedServicePerformance {
  serviceId: string;
  serviceName: string;
  revenue: number;
  appointmentCount: number;
  averagePrice: number;
  utilization: number;
}

/**
 * Customer segment distribution compatible across systems
 */
export interface UnifiedSegmentDistribution {
  vip: number;
  regular: number;
  atRisk: number;
  new: number;
  dormant: number;
}