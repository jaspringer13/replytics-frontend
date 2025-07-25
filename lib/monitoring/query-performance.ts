/**
 * Database Query Performance Monitoring System
 * Tracks query performance, identifies bottlenecks, and provides optimization insights
 */

interface QueryMetrics {
  queryId: string;
  queryType: string;
  executionTime: number;
  timestamp: number;
  tenantId?: string;
  success: boolean;
  errorMessage?: string;
  queryParams: any;
  resultSize: number;
  cacheHit: boolean;
}

interface PerformanceAlert {
  level: 'warning' | 'error' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  tenantId?: string;
}

interface PerformanceReport {
  timeRange: {
    start: Date;
    end: Date;
  };
  totalQueries: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  slowestQueries: QueryMetrics[];
  frequentErrors: { error: string; count: number }[];
  recommendations: string[];
}

interface PerformanceThresholds {
  maxResponseTime: number;
  maxErrorRate: number;
  minCacheHitRate: number;
  maxQueueDepth: number;
}

class QueryPerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private readonly maxMetricsHistory: number;
  private readonly thresholds: PerformanceThresholds;
  private metricsInterval?: NodeJS.Timeout;
  private alertInterval?: NodeJS.Timeout;

  constructor(
    maxMetricsHistory: number = 10000,
    thresholds: Partial<PerformanceThresholds> = {}
  ) {
    this.maxMetricsHistory = maxMetricsHistory;
    this.thresholds = {
      maxResponseTime: 1000, // 1 second
      maxErrorRate: 5, // 5%
      minCacheHitRate: 80, // 80%
      maxQueueDepth: 10,
      ...thresholds
    };

    this.startMonitoring();
  }

  /**
   * Record query execution metrics
   */
  public recordQuery(
    queryId: string,
    queryType: string,
    executionTime: number,
    options: {
      tenantId?: string;
      success?: boolean;
      errorMessage?: string;
      queryParams?: any;
      resultSize?: number;
      cacheHit?: boolean;
    } = {}
  ): void {
    const metric: QueryMetrics = {
      queryId,
      queryType,
      executionTime,
      timestamp: Date.now(),
      tenantId: options.tenantId,
      success: options.success ?? true,
      errorMessage: options.errorMessage,
      queryParams: options.queryParams || {},
      resultSize: options.resultSize || 0,
      cacheHit: options.cacheHit ?? false
    };

    this.metrics.push(metric);

    // Trim history if needed
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Check for immediate alerts
    this.checkPerformanceThresholds(metric);

    // Log slow queries immediately
    if (executionTime > this.thresholds.maxResponseTime) {
      console.warn(`Slow query detected: ${queryId} took ${executionTime}ms`, {
        queryType,
        tenantId: options.tenantId,
        queryParams: options.queryParams
      });
    }
  }

  /**
   * Create a performance tracking decorator for query functions
   */
  public trackQuery<T extends any[], R>(
    queryId: string,
    queryType: string,
    queryFn: (...args: T) => Promise<R>
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      const startTime = Date.now();
      let success = true;
      let errorMessage: string | undefined;
      let resultSize = 0;

      try {
        const result = await queryFn(...args);
        
        // Estimate result size
        if (typeof result === 'object' && result !== null) {
          if (Array.isArray(result)) {
            resultSize = result.length;
          } else {
            resultSize = Object.keys(result).length;
          }
        }

        return result;
      } catch (error) {
        success = false;
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw error;
      } finally {
        const executionTime = Date.now() - startTime;
        
        this.recordQuery(queryId, queryType, executionTime, {
          success,
          errorMessage,
          queryParams: args,
          resultSize
        });
      }
    };
  }

  /**
   * Generate comprehensive performance report
   */
  public generateReport(
    timeRange: { start: Date; end: Date }
  ): PerformanceReport {
    const relevantMetrics = this.metrics.filter(
      metric => metric.timestamp >= timeRange.start.getTime() &&
                metric.timestamp <= timeRange.end.getTime()
    );

    if (relevantMetrics.length === 0) {
      return {
        timeRange,
        totalQueries: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        cacheHitRate: 0,
        slowestQueries: [],
        frequentErrors: [],
        recommendations: ['No data available for the specified time range']
      };
    }

    // Calculate basic statistics
    const totalQueries = relevantMetrics.length;
    const successfulQueries = relevantMetrics.filter(m => m.success);
    const failedQueries = relevantMetrics.filter(m => !m.success);
    const cachedQueries = relevantMetrics.filter(m => m.cacheHit);

    const responseTimes = relevantMetrics.map(m => m.executionTime).sort((a, b) => a - b);
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
    const p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;

    const errorRate = (failedQueries.length / totalQueries) * 100;
    const cacheHitRate = (cachedQueries.length / totalQueries) * 100;

    // Find slowest queries
    const slowestQueries = relevantMetrics
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    // Count frequent errors
    const errorMap = new Map<string, number>();
    failedQueries.forEach(metric => {
      if (metric.errorMessage) {
        errorMap.set(metric.errorMessage, (errorMap.get(metric.errorMessage) || 0) + 1);
      }
    });

    const frequentErrors = Array.from(errorMap.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      averageResponseTime,
      p95ResponseTime,
      errorRate,
      cacheHitRate,
      slowestQueries,
      frequentErrors
    });

    return {
      timeRange,
      totalQueries,
      averageResponseTime: Math.round(averageResponseTime),
      p95ResponseTime,
      p99ResponseTime,
      errorRate: Math.round(errorRate * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      slowestQueries,
      frequentErrors,
      recommendations
    };
  }

  /**
   * Generate performance optimization recommendations
   */
  private generateRecommendations(stats: {
    averageResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    slowestQueries: QueryMetrics[];
    frequentErrors: { error: string; count: number }[];
  }): string[] {
    const recommendations: string[] = [];

    // Response time recommendations
    if (stats.averageResponseTime > this.thresholds.maxResponseTime) {
      recommendations.push(
        `Average response time (${Math.round(stats.averageResponseTime)}ms) exceeds threshold. Consider query optimization or indexing.`
      );
    }

    if (stats.p95ResponseTime > this.thresholds.maxResponseTime * 2) {
      recommendations.push(
        `95th percentile response time is very high (${stats.p95ResponseTime}ms). Investigate slow queries and database bottlenecks.`
      );
    }

    // Cache recommendations
    if (stats.cacheHitRate < this.thresholds.minCacheHitRate) {
      recommendations.push(
        `Cache hit rate (${stats.cacheHitRate.toFixed(1)}%) is below target. Review caching strategy and TTL settings.`
      );
    }

    // Error rate recommendations
    if (stats.errorRate > this.thresholds.maxErrorRate) {
      recommendations.push(
        `Error rate (${stats.errorRate.toFixed(1)}%) is above acceptable threshold. Review error handling and query robustness.`
      );
    }

    // Query-specific recommendations
    const analyticsQueries = stats.slowestQueries.filter(q => q.queryType.includes('analytics'));
    if (analyticsQueries.length > 0) {
      recommendations.push(
        'Analytics queries are among the slowest. Consider implementing aggregated views or materialized tables.'
      );
    }

    const n1Patterns = stats.slowestQueries.filter(q => 
      q.queryType.includes('trend') || q.queryType.includes('daily')
    );
    if (n1Patterns.length > 0) {
      recommendations.push(
        'Detected potential N+1 query patterns in trend calculations. Implement batch aggregation queries.'
      );
    }

    // Frequent error recommendations
    if (stats.frequentErrors.length > 0) {
      const topError = stats.frequentErrors[0];
      if (topError.error.includes('timeout')) {
        recommendations.push(
          'Database timeouts are frequent. Consider connection pooling optimization or query simplification.'
        );
      }
      
      if (topError.error.includes('connection')) {
        recommendations.push(
          'Connection errors detected. Review connection pool configuration and database availability.'
        );
      }
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push(
        'Performance metrics are within acceptable ranges. Continue monitoring for trends.'
      );
    }

    return recommendations;
  }

  /**
   * Check performance thresholds and generate alerts
   */
  private checkPerformanceThresholds(metric: QueryMetrics): void {
    const alerts: PerformanceAlert[] = [];

    // Response time alerts
    if (metric.executionTime > this.thresholds.maxResponseTime * 3) {
      alerts.push({
        level: 'critical',
        message: `Query ${metric.queryId} exceeded critical response time threshold`,
        metric: 'response_time',
        value: metric.executionTime,
        threshold: this.thresholds.maxResponseTime * 3,
        timestamp: Date.now(),
        tenantId: metric.tenantId
      });
    } else if (metric.executionTime > this.thresholds.maxResponseTime * 2) {
      alerts.push({
        level: 'error',
        message: `Query ${metric.queryId} exceeded error response time threshold`,
        metric: 'response_time',
        value: metric.executionTime,
        threshold: this.thresholds.maxResponseTime * 2,
        timestamp: Date.now(),
        tenantId: metric.tenantId
      });
    } else if (metric.executionTime > this.thresholds.maxResponseTime) {
      alerts.push({
        level: 'warning',
        message: `Query ${metric.queryId} exceeded warning response time threshold`,
        metric: 'response_time',
        value: metric.executionTime,
        threshold: this.thresholds.maxResponseTime,
        timestamp: Date.now(),
        tenantId: metric.tenantId
      });
    }

    // Error alerts
    if (!metric.success) {
      alerts.push({
        level: 'error',
        message: `Query ${metric.queryId} failed: ${metric.errorMessage}`,
        metric: 'error_rate',
        value: 1,
        threshold: 0,
        timestamp: Date.now(),
        tenantId: metric.tenantId
      });
    }

    // Add alerts
    this.alerts.push(...alerts);

    // Trim alert history
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    // Log critical alerts immediately
    alerts.forEach(alert => {
      if (alert.level === 'critical') {
        console.error(`CRITICAL PERFORMANCE ALERT: ${alert.message}`, {
          metric: alert.metric,
          value: alert.value,
          threshold: alert.threshold,
          tenantId: alert.tenantId
        });
      }
    });
  }

  /**
   * Get recent performance alerts
   */
  public getRecentAlerts(minutes: number = 60): PerformanceAlert[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp >= cutoff);
  }

  /**
   * Get query statistics by type
   */
  public getQueryTypeStats(timeRange?: { start: Date; end: Date }): Map<string, {
    count: number;
    avgResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
  }> {
    let relevantMetrics = this.metrics;
    
    if (timeRange) {
      relevantMetrics = this.metrics.filter(
        metric => metric.timestamp >= timeRange.start.getTime() &&
                  metric.timestamp <= timeRange.end.getTime()
      );
    }

    const stats = new Map();
    
    // Group by query type
    const grouped = new Map<string, QueryMetrics[]>();
    relevantMetrics.forEach(metric => {
      if (!grouped.has(metric.queryType)) {
        grouped.set(metric.queryType, []);
      }
      grouped.get(metric.queryType)!.push(metric);
    });

    // Calculate stats for each type
    grouped.forEach((metrics, queryType) => {
      const count = metrics.length;
      const avgResponseTime = metrics.reduce((sum, m) => sum + m.executionTime, 0) / count;
      const errorCount = metrics.filter(m => !m.success).length;
      const cacheHits = metrics.filter(m => m.cacheHit).length;
      
      stats.set(queryType, {
        count,
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: (errorCount / count) * 100,
        cacheHitRate: (cacheHits / count) * 100
      });
    });

    return stats;
  }

  /**
   * Start periodic monitoring tasks
   */
  private startMonitoring(): void {
    // Periodic metrics logging
    this.metricsInterval = setInterval(() => {
      this.logPerformanceMetrics();
    }, 300000); // Every 5 minutes

    // Periodic alert checking
    this.alertInterval = setInterval(() => {
      this.checkSystemHealth();
    }, 60000); // Every minute
  }

  /**
   * Log performance metrics summary
   */
  private logPerformanceMetrics(): void {
    const last5Minutes = new Date(Date.now() - 300000);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= last5Minutes.getTime());

    if (recentMetrics.length === 0) {
      return;
    }

    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) / recentMetrics.length;
    const errorRate = (recentMetrics.filter(m => !m.success).length / recentMetrics.length) * 100;
    const cacheHitRate = (recentMetrics.filter(m => m.cacheHit).length / recentMetrics.length) * 100;

    console.log('Database Performance Metrics (Last 5 minutes):', {
      totalQueries: recentMetrics.length,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check overall system health
   */
  private checkSystemHealth(): void {
    const last10Minutes = new Date(Date.now() - 600000);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= last10Minutes.getTime());

    if (recentMetrics.length === 0) {
      return;
    }

    const errorRate = (recentMetrics.filter(m => !m.success).length / recentMetrics.length) * 100;
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) / recentMetrics.length;

    // System-wide alerts
    if (errorRate > this.thresholds.maxErrorRate * 2) {
      console.error('SYSTEM HEALTH ALERT: High error rate detected', {
        errorRate: errorRate.toFixed(2),
        threshold: this.thresholds.maxErrorRate,
        timeWindow: '10 minutes'
      });
    }

    if (avgResponseTime > this.thresholds.maxResponseTime * 2) {
      console.warn('SYSTEM HEALTH WARNING: High average response time', {
        avgResponseTime: Math.round(avgResponseTime),
        threshold: this.thresholds.maxResponseTime,
        timeWindow: '10 minutes'
      });
    }
  }

  /**
   * Shutdown monitoring
   */
  public shutdown(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    if (this.alertInterval) {
      clearInterval(this.alertInterval);
    }

    // Clear data
    this.metrics = [];
    this.alerts = [];
  }
}

// Singleton instance
let performanceMonitor: QueryPerformanceMonitor | null = null;

export function getQueryPerformanceMonitor(): QueryPerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new QueryPerformanceMonitor(
      parseInt(process.env.PERF_MAX_METRICS_HISTORY || '10000'),
      {
        maxResponseTime: parseInt(process.env.PERF_MAX_RESPONSE_TIME || '1000'),
        maxErrorRate: parseFloat(process.env.PERF_MAX_ERROR_RATE || '5'),
        minCacheHitRate: parseFloat(process.env.PERF_MIN_CACHE_HIT_RATE || '80'),
        maxQueueDepth: parseInt(process.env.PERF_MAX_QUEUE_DEPTH || '10')
      }
    );
  }
  return performanceMonitor;
}

export function shutdownQueryPerformanceMonitor(): void {
  if (performanceMonitor) {
    performanceMonitor.shutdown();
    performanceMonitor = null;
  }
}

// Export types and classes
export type { 
  QueryMetrics, 
  PerformanceAlert, 
  PerformanceReport, 
  PerformanceThresholds 
};
export { QueryPerformanceMonitor };