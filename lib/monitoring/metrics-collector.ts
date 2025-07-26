/**
 * Replytics Voice-Bot Integration - Metrics Collection System
 * 
 * Comprehensive metrics collection for production monitoring
 * Includes application, business, security, and infrastructure metrics
 */

import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Initialize default Node.js metrics collection
collectDefaultMetrics({ 
  register,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  eventLoopMonitoringPrecision: 5
});

// ===== HTTP REQUEST METRICS =====

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'user_agent'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 1.0, 2.0, 5.0, 10.0],
  registers: [register]
});

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'business_id'],
  registers: [register]
});

export const httpRequestSize = new Histogram({
  name: 'http_request_size_bytes',
  help: 'Size of HTTP requests in bytes',
  labelNames: ['method', 'route'],
  buckets: [10, 100, 1000, 10000, 100000, 1000000],
  registers: [register]
});

export const httpResponseSize = new Histogram({
  name: 'http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 100, 1000, 10000, 100000, 1000000, 10000000],
  registers: [register]
});

// ===== AUTHENTICATION METRICS =====

export const authenticationAttempts = new Counter({
  name: 'authentication_attempts_total',
  help: 'Total authentication attempts',
  labelNames: ['result', 'method', 'provider'],
  registers: [register]
});

export const authenticationFailures = new Counter({
  name: 'authentication_failures_total',
  help: 'Total authentication failures',
  labelNames: ['reason', 'ip_address', 'user_agent'],
  registers: [register]
});

export const sessionDuration = new Histogram({
  name: 'user_session_duration_seconds',
  help: 'Duration of user sessions',
  labelNames: ['business_id'],
  buckets: [60, 300, 900, 1800, 3600, 7200, 14400, 28800],
  registers: [register]
});

export const activeUserSessions = new Gauge({
  name: 'active_user_sessions',
  help: 'Number of active user sessions',
  labelNames: ['business_id'],
  registers: [register]
});

// ===== BUSINESS ANALYTICS METRICS =====

export const analyticsQueriesTotal = new Counter({
  name: 'analytics_queries_total',
  help: 'Total analytics queries executed',
  labelNames: ['query_type', 'business_id', 'status'],
  registers: [register]
});

export const analyticsQueryDuration = new Histogram({
  name: 'analytics_query_duration_seconds',
  help: 'Analytics query execution time',
  labelNames: ['query_type', 'complexity'],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0],
  registers: [register]
});

export const analyticsDataAccuracy = new Gauge({
  name: 'analytics_data_accuracy_ratio',
  help: 'Analytics data accuracy ratio',
  labelNames: ['business_id', 'data_type'],
  registers: [register]
});

export const businessIdResolutionDuration = new Histogram({
  name: 'business_id_resolution_duration_seconds',
  help: 'Business ID resolution time',
  labelNames: ['cache_status', 'resolution_method'],
  buckets: [0.001, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5],
  registers: [register]
});

export const customerSegmentCounts = new Gauge({
  name: 'customer_segment_count',
  help: 'Number of customers per segment',
  labelNames: ['business_id', 'segment_type'],
  registers: [register]
});

// ===== CACHING METRICS =====

export const cacheHitRatio = new Gauge({
  name: 'cache_hit_ratio',
  help: 'Cache hit ratio',
  labelNames: ['cache_type', 'business_id'],
  registers: [register]
});

export const cacheOperations = new Counter({
  name: 'cache_operations_total',
  help: 'Total cache operations',
  labelNames: ['operation', 'cache_type', 'result'],
  registers: [register]
});

export const cacheSize = new Gauge({
  name: 'cache_size_bytes',
  help: 'Cache size in bytes',
  labelNames: ['cache_type'],
  registers: [register]
});

// ===== SECURITY METRICS =====

export const securityViolations = new Counter({
  name: 'security_violations_total',
  help: 'Total security violations detected',
  labelNames: ['type', 'severity', 'user_id', 'business_id'],
  registers: [register]
});

export const rateLimitViolations = new Counter({
  name: 'rate_limit_violations_total',
  help: 'Total rate limit violations',
  labelNames: ['endpoint', 'ip_address', 'user_id'],
  registers: [register]
});

export const suspiciousActivities = new Counter({
  name: 'suspicious_activities_total',
  help: 'Total suspicious activities detected',
  labelNames: ['activity_type', 'risk_level', 'user_id'],
  registers: [register]
});

// ===== VOICE SERVICE METRICS =====

export const voiceCallsTotal = new Counter({
  name: 'voice_calls_total',
  help: 'Total voice calls processed',
  labelNames: ['status', 'business_id', 'call_type'],
  registers: [register]
});

export const voiceCallsFailed = new Counter({
  name: 'voice_calls_failed_total',
  help: 'Total failed voice calls',
  labelNames: ['failure_reason', 'business_id'],
  registers: [register]
});

export const voiceCallDuration = new Histogram({
  name: 'voice_call_duration_seconds',
  help: 'Voice call duration',
  labelNames: ['business_id', 'call_outcome'],
  buckets: [1, 5, 10, 30, 60, 120, 300, 600, 1200],
  registers: [register]
});

export const voiceCallQuality = new Gauge({
  name: 'voice_call_quality_score',
  help: 'Voice call quality score (1-5)',
  labelNames: ['business_id'],
  registers: [register]
});

export const voiceProcessingLatency = new Histogram({
  name: 'voice_processing_latency_seconds',
  help: 'Voice processing latency',
  labelNames: ['processing_stage'],
  buckets: [0.1, 0.2, 0.5, 1.0, 2.0, 5.0],
  registers: [register]
});

// ===== DATABASE METRICS =====

export const databaseConnectionsActive = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
  labelNames: ['database_name'],
  registers: [register]
});

export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Database query execution time',
  labelNames: ['query_type', 'table_name'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0],
  registers: [register]
});

export const databaseTransactions = new Counter({
  name: 'database_transactions_total',
  help: 'Total database transactions',
  labelNames: ['status', 'operation_type'],
  registers: [register]
});

// ===== REALTIME/WEBSOCKET METRICS =====

export const websocketConnections = new Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
  labelNames: ['business_id', 'connection_type'],
  registers: [register]
});

export const websocketMessages = new Counter({
  name: 'websocket_messages_total',
  help: 'Total WebSocket messages',
  labelNames: ['direction', 'message_type', 'business_id'],
  registers: [register]
});

export const realtimeUpdates = new Counter({
  name: 'realtime_updates_total',
  help: 'Total realtime updates sent',
  labelNames: ['update_type', 'business_id'],
  registers: [register]
});

// ===== BUSINESS PERFORMANCE METRICS =====

export const customerInteractions = new Counter({
  name: 'customer_interactions_total',
  help: 'Total customer interactions',
  labelNames: ['interaction_type', 'business_id', 'outcome'],
  registers: [register]
});

export const bookingConversions = new Counter({
  name: 'booking_conversions_total',
  help: 'Total booking conversions',
  labelNames: ['business_id', 'service_type'],
  registers: [register]
});

export const customerSatisfactionScore = new Gauge({
  name: 'customer_satisfaction_score',
  help: 'Customer satisfaction score',
  labelNames: ['business_id'],
  registers: [register]
});

// ===== METRICS COLLECTION UTILITIES =====

/**
 * Middleware to collect HTTP request metrics
 */
export function createMetricsMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const route = req.route?.path || req.url || 'unknown';
    const method = req.method;
    const businessId = req.headers['x-business-id'] || req.query.businessId || 'unknown';
    
    // Track request size
    const requestSize = parseInt(req.headers['content-length'] || '0', 10);
    if (requestSize > 0) {
      httpRequestSize.observe({ method, route }, requestSize);
    }

    // Increment request counter
    httpRequestsTotal.inc({
      method,
      route,
      status_code: '0', // Will be updated on response
      business_id: businessId
    });

    // Track response metrics
    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000;
      const statusCode = res.statusCode.toString();
      const responseSize = parseInt(res.get('content-length') || '0', 10);
      
      // Record response time
      httpRequestDuration.observe({
        method,
        route,
        status_code: statusCode,
        user_agent: req.headers['user-agent'] || 'unknown'
      }, duration);

      // Update request counter with final status
      httpRequestsTotal.inc({
        method,
        route,
        status_code: statusCode,
        business_id: businessId
      });

      // Track response size
      if (responseSize > 0) {
        httpResponseSize.observe({
          method,
          route,
          status_code: statusCode
        }, responseSize);
      }
    });

    next();
  };
}

/**
 * Business metrics tracking utilities
 */
export class BusinessMetricsTracker {
  static trackAnalyticsQuery(
    queryType: string, 
    businessId: string, 
    duration: number, 
    success: boolean,
    complexity: 'simple' | 'medium' | 'complex' = 'medium'
  ) {
    analyticsQueriesTotal.inc({
      query_type: queryType,
      business_id: businessId,
      status: success ? 'success' : 'error'
    });
    
    analyticsQueryDuration.observe({ 
      query_type: queryType,
      complexity 
    }, duration / 1000);
  }
  
  static trackBusinessIdResolution(
    duration: number, 
    cacheHit: boolean,
    resolutionMethod: 'cache' | 'database' | 'api' = 'database'
  ) {
    businessIdResolutionDuration.observe({
      cache_status: cacheHit ? 'hit' : 'miss',
      resolution_method: resolutionMethod
    }, duration / 1000);
  }
  
  static updateCacheMetrics(cacheType: string, hitRate: number, businessId?: string) {
    cacheHitRatio.set({ 
      cache_type: cacheType,
      business_id: businessId || 'global'
    }, hitRate);
  }
  
  static trackSecurityViolation(
    type: string, 
    severity: string, 
    userId?: string,
    businessId?: string
  ) {
    securityViolations.inc({
      type,
      severity,
      user_id: userId || 'anonymous',
      business_id: businessId || 'unknown'
    });
  }

  static trackVoiceCall(
    businessId: string,
    status: 'success' | 'failed' | 'abandoned',
    duration?: number,
    callType: 'booking' | 'inquiry' | 'support' = 'inquiry',
    outcome?: string
  ) {
    voiceCallsTotal.inc({
      status,
      business_id: businessId,
      call_type: callType
    });

    if (duration !== undefined) {
      voiceCallDuration.observe({
        business_id: businessId,
        call_outcome: outcome || status
      }, duration);
    }
  }

  static trackCustomerInteraction(
    businessId: string,
    interactionType: string,
    outcome: 'positive' | 'neutral' | 'negative'
  ) {
    customerInteractions.inc({
      interaction_type: interactionType,
      business_id: businessId,
      outcome
    });
  }

  static updateCustomerSegmentCount(
    businessId: string,
    segmentType: string,
    count: number
  ) {
    customerSegmentCounts.set({
      business_id: businessId,
      segment_type: segmentType
    }, count);
  }
}

/**
 * Database metrics tracking utilities
 */
export class DatabaseMetricsTracker {
  static trackQuery(
    queryType: string,
    tableName: string,
    duration: number,
    success: boolean
  ) {
    databaseQueryDuration.observe({
      query_type: queryType,
      table_name: tableName
    }, duration / 1000);

    databaseTransactions.inc({
      status: success ? 'success' : 'error',
      operation_type: queryType
    });
  }

  static updateActiveConnections(databaseName: string, count: number) {
    databaseConnectionsActive.set({ database_name: databaseName }, count);
  }
}

/**
 * Realtime metrics tracking utilities
 */
export class RealtimeMetricsTracker {
  static trackWebSocketConnection(businessId: string, connectionType: string, delta: number) {
    websocketConnections.inc({ 
      business_id: businessId,
      connection_type: connectionType 
    }, delta);
  }

  static trackWebSocketMessage(
    direction: 'inbound' | 'outbound',
    messageType: string,
    businessId: string
  ) {
    websocketMessages.inc({
      direction,
      message_type: messageType,
      business_id: businessId
    });
  }

  static trackRealtimeUpdate(updateType: string, businessId: string) {
    realtimeUpdates.inc({
      update_type: updateType,
      business_id: businessId
    });
  }
}

/**
 * Health check metrics
 */
export const healthCheckStatus = new Gauge({
  name: 'health_check_status',
  help: 'Health check status (1 = healthy, 0 = unhealthy)',
  labelNames: ['service', 'check_type'],
  registers: [register]
});

export const healthCheckDuration = new Histogram({
  name: 'health_check_duration_seconds',
  help: 'Health check execution time',
  labelNames: ['service', 'check_type'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.2, 0.5, 1.0],
  registers: [register]
});

/**
 * Export the Prometheus registry for metrics endpoint
 */
export { register };

/**
 * Get all metrics in Prometheus format
 */
export async function getMetrics(): Promise<string> {
  return register.metrics();
}