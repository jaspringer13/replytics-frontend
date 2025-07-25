/**
 * Unified Analytics Types
 * Resolves type mismatches between voice-bot database results and website UI expectations
 * Provides conversion utilities for seamless integration
 */

import { TrendDataPoint } from './integration';

// ============================================================================
// TREND DATA ALIGNMENT
// ============================================================================

/**
 * Raw trend data from database queries (voice-bot format)
 */
export interface DatabaseTrendResult {
  date: string;           // ISO date string
  value: number;          // Primary metric value
  count?: number;         // Optional count metric
  revenue?: number;       // Optional revenue metric
  appointments?: number;  // Optional appointment count
}

/**
 * Website dashboard trend data format (existing format)
 */
export interface DashboardTrendData {
  current: number;
  previous: number;
  percentChange: number;
  dataPoints: { date: string; value: number }[];
}

/**
 * Convert database trend results to dashboard format
 */
export function convertToDashboardTrend(
  currentData: DatabaseTrendResult[],
  previousData: DatabaseTrendResult[],
  metric: 'value' | 'revenue' | 'count' | 'appointments' = 'value'
): DashboardTrendData {
  // Calculate totals for current and previous periods
  const currentTotal = currentData.reduce((sum, item) => {
    const value = item[metric] || item.value || 0;
    return sum + value;
  }, 0);

  const previousTotal = previousData.reduce((sum, item) => {
    const value = item[metric] || item.value || 0;
    return sum + value;
  }, 0);

  // Calculate percent change
  const percentChange = previousTotal === 0 
    ? (currentTotal > 0 ? 100 : 0)
    : Math.round(((currentTotal - previousTotal) / previousTotal) * 100);

  // Convert data points to dashboard format
  const dataPoints = currentData.map(item => ({
    date: item.date,
    value: item[metric] || item.value || 0
  }));

  return {
    current: currentTotal,
    previous: previousTotal,
    percentChange,
    dataPoints
  };
}

/**
 * Convert dashboard trend data to unified trend points
 */
export function convertFromDashboardTrend(dashboardData: DashboardTrendData): TrendDataPoint[] {
  return dashboardData.dataPoints.map(point => ({
    date: point.date,
    value: point.value
  }));
}

// ============================================================================
// ANALYTICS METRICS ALIGNMENT
// ============================================================================

/**
 * Voice-bot database metrics structure
 */
export interface DatabaseMetricsResult {
  total_revenue?: string | number;
  total_appointments?: string | number;
  unique_customers?: string | number;
  avg_service_value?: string | number;
  booking_rate?: string | number;
  no_show_rate?: string | number;
}

/**
 * Website dashboard metrics structure (existing)
 */
export interface DashboardMetrics {
  totalRevenue: number;
  totalAppointments: number;
  totalCustomers: number;
  averageServiceValue: number;
  bookingRate: number;
  noShowRate: number;
}

/**
 * Convert database metrics to dashboard format with proper type casting
 */
export function convertToDashboardMetrics(dbMetrics: DatabaseMetricsResult): DashboardMetrics {
  return {
    totalRevenue: parseFloat(String(dbMetrics.total_revenue || '0')),
    totalAppointments: parseInt(String(dbMetrics.total_appointments || '0')),
    totalCustomers: parseInt(String(dbMetrics.unique_customers || '0')),
    averageServiceValue: parseFloat(String(dbMetrics.avg_service_value || '0')),
    bookingRate: parseFloat(String(dbMetrics.booking_rate || '0')),
    noShowRate: parseFloat(String(dbMetrics.no_show_rate || '0'))
  };
}

// ============================================================================
// SERVICE PERFORMANCE ALIGNMENT
// ============================================================================

/**
 * Voice-bot service performance result
 */
export interface DatabaseServiceResult {
  service_id: string;
  service_name?: string;
  revenue: number | string;
  appointment_count: number | string;
  avg_price?: number | string;
  utilization?: number | string;
}

/**
 * Website service performance format (existing)
 */
export interface DashboardServicePerformance {
  serviceId: string;
  serviceName: string;
  revenue: number;
  appointmentCount: number;
  averagePrice: number;
  utilization: number;
}

/**
 * Convert database service results to dashboard format
 */
export function convertToDashboardServices(dbServices: DatabaseServiceResult[]): DashboardServicePerformance[] {
  return dbServices.map(service => ({
    serviceId: service.service_id,
    serviceName: service.service_name || 'Unknown Service',
    revenue: parseFloat(String(service.revenue || '0')),
    appointmentCount: parseInt(String(service.appointment_count || '0')),
    averagePrice: parseFloat(String(service.avg_price || '0')),
    utilization: parseFloat(String(service.utilization || '0'))
  }));
}

// ============================================================================
// CUSTOMER SEGMENT ALIGNMENT
// ============================================================================

/**
 * Voice-bot customer segment result
 */
export interface DatabaseSegmentResult {
  vip_customers?: string | number;
  regular_customers?: string | number;
  at_risk_customers?: string | number;
  new_customers?: string | number;
  dormant_customers?: string | number;
}

/**
 * Website segment distribution format (existing)
 */
export interface DashboardSegmentDistribution {
  vip: number;
  regular: number;
  atRisk: number;
  new: number;
  dormant: number;
}

/**
 * Convert database segment results to dashboard format
 */
export function convertToDashboardSegments(dbSegments: DatabaseSegmentResult): DashboardSegmentDistribution {
  return {
    vip: parseInt(String(dbSegments.vip_customers || '0')),
    regular: parseInt(String(dbSegments.regular_customers || '0')),
    atRisk: parseInt(String(dbSegments.at_risk_customers || '0')),
    new: parseInt(String(dbSegments.new_customers || '0')),
    dormant: parseInt(String(dbSegments.dormant_customers || '0'))
  };
}

// ============================================================================
// COMPLETE ANALYTICS RESPONSE CONVERSION
// ============================================================================

/**
 * Complete voice-bot analytics response
 */
export interface DatabaseAnalyticsResponse {
  metrics: DatabaseMetricsResult;
  revenue_trend: DatabaseTrendResult[];
  appointment_trend: DatabaseTrendResult[];
  customer_trend: DatabaseTrendResult[];
  service_performance: DatabaseServiceResult[];
  customer_segments: DatabaseSegmentResult;
}

/**
 * Complete website dashboard response (existing)
 */
export interface DashboardAnalyticsResponse {
  metrics: DashboardMetrics;
  trends: {
    revenue: DashboardTrendData;
    appointments: DashboardTrendData;
    newCustomers: DashboardTrendData;
  };
  topServices: DashboardServicePerformance[];
  customerSegments: DashboardSegmentDistribution;
}

/**
 * Convert complete database response to dashboard format
 */
export function convertToDashboardAnalytics(
  dbResponse: DatabaseAnalyticsResponse,
  previousMetrics: DatabaseMetricsResult,
  previousTrends: {
    revenue: DatabaseTrendResult[];
    appointments: DatabaseTrendResult[];
    customers: DatabaseTrendResult[];
  }
): DashboardAnalyticsResponse {
  return {
    metrics: convertToDashboardMetrics(dbResponse.metrics),
    trends: {
      revenue: convertToDashboardTrend(dbResponse.revenue_trend, previousTrends.revenue, 'revenue'),
      appointments: convertToDashboardTrend(dbResponse.appointment_trend, previousTrends.appointments, 'appointments'),
      newCustomers: convertToDashboardTrend(dbResponse.customer_trend, previousTrends.customers, 'count')
    },
    topServices: convertToDashboardServices(dbResponse.service_performance),
    customerSegments: convertToDashboardSegments(dbResponse.customer_segments)
  };
}

// ============================================================================
// TYPE GUARDS AND VALIDATION
// ============================================================================

/**
 * Type guard for database trend result
 */
export function isDatabaseTrendResult(data: any): data is DatabaseTrendResult {
  return (
    typeof data === 'object' &&
    typeof data.date === 'string' &&
    typeof data.value === 'number'
  );
}

/**
 * Type guard for dashboard trend data
 */
export function isDashboardTrendData(data: any): data is DashboardTrendData {
  return (
    typeof data === 'object' &&
    typeof data.current === 'number' &&
    typeof data.previous === 'number' &&
    typeof data.percentChange === 'number' &&
    Array.isArray(data.dataPoints)
  );
}

/**
 * Validate trend data array
 */
export function validateTrendDataArray(data: any[]): data is DatabaseTrendResult[] {
  return data.every(isDatabaseTrendResult);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Fill missing dates in trend data with zero values
 */
export function fillMissingDates(
  trendData: DatabaseTrendResult[],
  startDate: Date,
  endDate: Date
): DatabaseTrendResult[] {
  const filled: DatabaseTrendResult[] = [];
  const dataMap = new Map(trendData.map(item => [item.date, item]));
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    const existing = dataMap.get(dateKey);
    
    filled.push(existing || {
      date: dateKey,
      value: 0,
      count: 0,
      revenue: 0,
      appointments: 0
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return filled;
}

/**
 * Calculate percentage change between two periods
 */
export function calculatePercentChange(previous: number, current: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Aggregate trend data by period (daily, weekly, monthly)
 */
export function aggregateTrendData(
  data: DatabaseTrendResult[],
  period: 'daily' | 'weekly' | 'monthly'
): DatabaseTrendResult[] {
  if (period === 'daily') {
    return data; // Already daily
  }
  
  const aggregated = new Map<string, DatabaseTrendResult>();
  
  data.forEach(item => {
    const date = new Date(item.date);
    let groupKey: string;
    
    if (period === 'weekly') {
      // Group by week start (Monday)
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1);
      groupKey = weekStart.toISOString().split('T')[0];
    } else {
      // Group by month
      groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    }
    
    const existing = aggregated.get(groupKey) || {
      date: groupKey,
      value: 0,
      count: 0,
      revenue: 0,
      appointments: 0
    };
    
    existing.value += item.value;
    existing.count = (existing.count || 0) + (item.count || 0);
    existing.revenue = (existing.revenue || 0) + (item.revenue || 0);
    existing.appointments = (existing.appointments || 0) + (item.appointments || 0);
    
    aggregated.set(groupKey, existing);
  });
  
  return Array.from(aggregated.values()).sort((a, b) => a.date.localeCompare(b.date));
}