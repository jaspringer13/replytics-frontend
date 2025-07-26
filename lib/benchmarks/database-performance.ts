/**
 * Database Performance Benchmarking Suite
 * Validates optimization improvements and identifies regressions
 */

import { getOptimizedQueryBuilder } from '@/lib/db/optimized-queries';
import { getConnectionPool } from '@/lib/db/connection-pool';
import { getQueryCache } from '@/lib/cache/query-cache';
import { getQueryPerformanceMonitor } from '@/lib/monitoring/query-performance';
import { DateRange } from '@/app/models/dashboard';

interface BenchmarkResult {
  testName: string;
  iterations: number;
  totalTimeMs: number;
  averageTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  successRate: number;
  errors: string[];
  throughput: number; // queries per second
}

interface ComparisonResult {
  testName: string;
  baselineAvg: number;
  optimizedAvg: number;
  improvement: number; // percentage
  improvementRatio: string;
  status: 'improved' | 'degraded' | 'neutral';
}

class DatabaseBenchmark {
  private readonly queryBuilder = getOptimizedQueryBuilder();
  private readonly connectionPool = getConnectionPool();
  private readonly queryCache = getQueryCache();
  private readonly performanceMonitor = getQueryPerformanceMonitor();

  /**
   * Run comprehensive database performance benchmarks
   */
  public async runFullBenchmarkSuite(tenantId: string): Promise<{
    results: BenchmarkResult[];
    summary: {
      totalTests: number;
      averagePerformance: number;
      recommendedOptimizations: string[];
    };
  }> {
    console.log(`[Benchmark] Starting full performance benchmark suite for tenant: ${tenantId}`);
    
    const dateRange: DateRange = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date()
    };

    const benchmarks = [
      () => this.benchmarkBusinessMetrics(tenantId, dateRange),
      () => this.benchmarkRevenueTrend(tenantId, dateRange),
      () => this.benchmarkServicePerformance(tenantId, dateRange),
      () => this.benchmarkCustomerSegments(tenantId),
      () => this.benchmarkConnectionPool(),
      () => this.benchmarkQueryCache(tenantId, dateRange),
      () => this.benchmarkConcurrentQueries(tenantId, dateRange)
    ];

    const results: BenchmarkResult[] = [];

    for (const benchmark of benchmarks) {
      try {
        const result = await benchmark();
        results.push(result);
        console.log(`[Benchmark] Completed: ${result.testName} - ${result.averageTimeMs}ms avg`);
      } catch (error) {
        console.error(`[Benchmark] Failed benchmark:`, error);
        results.push({
          testName: 'Failed Benchmark',
          iterations: 0,
          totalTimeMs: 0,
          averageTimeMs: 0,
          minTimeMs: 0,
          maxTimeMs: 0,
          successRate: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          throughput: 0
        });
      }
    }

    const summary = this.generateSummary(results);
    console.log(`[Benchmark] Suite completed. Average performance: ${summary.averagePerformance}ms`);

    return { results, summary };
  }

  /**
   * Benchmark business metrics query (replaces N+1 pattern)
   */
  private async benchmarkBusinessMetrics(tenantId: string, dateRange: DateRange): Promise<BenchmarkResult> {
    const testName = 'Business Metrics Query';
    const iterations = 10;
    const times: number[] = [];
    const errors: string[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        await this.queryBuilder.fetchBusinessMetrics(tenantId, dateRange);
        times.push(Date.now() - startTime);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error');
        times.push(Date.now() - startTime); // Include failed time
      }
    }

    return this.calculateBenchmarkResult(testName, iterations, times, errors);
  }

  /**
   * Benchmark revenue trend query (previously N+1 daily queries)
   */
  private async benchmarkRevenueTrend(tenantId: string, dateRange: DateRange): Promise<BenchmarkResult> {
    const testName = 'Revenue Trend Query (was N+1)';
    const iterations = 10;
    const times: number[] = [];
    const errors: string[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        await this.queryBuilder.fetchRevenueTrend(tenantId, dateRange);
        times.push(Date.now() - startTime);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error');
        times.push(Date.now() - startTime);
      }
    }

    return this.calculateBenchmarkResult(testName, iterations, times, errors);
  }

  /**
   * Benchmark service performance query
   */
  private async benchmarkServicePerformance(tenantId: string, dateRange: DateRange): Promise<BenchmarkResult> {
    const testName = 'Service Performance Query';
    const iterations = 10;
    const times: number[] = [];
    const errors: string[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        await this.queryBuilder.fetchServicePerformance(tenantId, dateRange);
        times.push(Date.now() - startTime);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error');
        times.push(Date.now() - startTime);
      }
    }

    return this.calculateBenchmarkResult(testName, iterations, times, errors);
  }

  /**
   * Benchmark customer segmentation query
   */
  private async benchmarkCustomerSegments(tenantId: string): Promise<BenchmarkResult> {
    const testName = 'Customer Segmentation Query';
    const iterations = 5; // Fewer iterations as this is more expensive
    const times: number[] = [];
    const errors: string[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        await this.queryBuilder.fetchCustomerSegments(tenantId);
        times.push(Date.now() - startTime);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error');
        times.push(Date.now() - startTime);
      }
    }

    return this.calculateBenchmarkResult(testName, iterations, times, errors);
  }

  /**
   * Benchmark connection pool performance
   */
  private async benchmarkConnectionPool(): Promise<BenchmarkResult> {
    const testName = 'Connection Pool Performance';
    const iterations = 20;
    const times: number[] = [];
    const errors: string[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        await this.connectionPool.executeWithConnection(async (client) => {
          // Simple query to test connection speed
          const { data, error } = await client.from('businesses').select('id').limit(1);
          if (error && !error.message.includes('permission denied')) {
            throw error;
          }
          return data;
        });
        times.push(Date.now() - startTime);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error');
        times.push(Date.now() - startTime);
      }
    }

    return this.calculateBenchmarkResult(testName, iterations, times, errors);
  }

  /**
   * Benchmark query cache performance
   */
  private async benchmarkQueryCache(tenantId: string, dateRange: DateRange): Promise<BenchmarkResult> {
    const testName = 'Query Cache Performance';
    const iterations = 20;
    const times: number[] = [];
    const errors: string[] = [];

    // Clear cache first
    await this.queryCache.invalidateTenantAnalytics(tenantId);

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        // First call should be cache miss, subsequent calls should be cache hits
        await this.queryCache.getAnalyticsData(
          tenantId,
          'benchmark-test',
          dateRange,
          async () => {
            // Simulate some work
            await new Promise(resolve => setTimeout(resolve, 10));
            return { test: 'data' };
          }
        );
        times.push(Date.now() - startTime);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error');
        times.push(Date.now() - startTime);
      }
    }

    return this.calculateBenchmarkResult(testName, iterations, times, errors);
  }

  /**
   * Benchmark concurrent query performance
   */
  private async benchmarkConcurrentQueries(tenantId: string, dateRange: DateRange): Promise<BenchmarkResult> {
    const testName = 'Concurrent Query Performance';
    const concurrency = 10;
    const iterations = 5; // 5 batches of 10 concurrent queries
    const allTimes: number[] = [];
    const errors: string[] = [];

    for (let batch = 0; batch < iterations; batch++) {
      const batchStartTime = Date.now();
      
      try {
        const promises = Array.from({ length: concurrency }, async () => {
          const queryStartTime = Date.now();
          try {
            await this.queryBuilder.fetchBusinessMetrics(tenantId, dateRange);
            return Date.now() - queryStartTime;
          } catch (error) {
            errors.push(error instanceof Error ? error.message : 'Unknown error');
            return Date.now() - queryStartTime;
          }
        });

        const batchTimes = await Promise.all(promises);
        allTimes.push(...batchTimes);
        
      } catch (error) {
        errors.push(`Batch ${batch}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        allTimes.push(Date.now() - batchStartTime);
      }
    }

    return this.calculateBenchmarkResult(testName, concurrency * iterations, allTimes, errors);
  }

  /**
   * Compare performance against baseline metrics
   */
  public async compareWithBaseline(
    tenantId: string,
    baselineResults: BenchmarkResult[]
  ): Promise<ComparisonResult[]> {
    const currentResults = await this.runFullBenchmarkSuite(tenantId);
    const comparisons: ComparisonResult[] = [];

    for (const baseline of baselineResults) {
      const current = currentResults.results.find(r => r.testName === baseline.testName);
      
      if (current) {
        const improvement = ((baseline.averageTimeMs - current.averageTimeMs) / baseline.averageTimeMs) * 100;
        const improvementRatio = `${(baseline.averageTimeMs / current.averageTimeMs).toFixed(1)}x`;
        
        let status: 'improved' | 'degraded' | 'neutral' = 'neutral';
        if (improvement > 5) status = 'improved';
        else if (improvement < -5) status = 'degraded';

        comparisons.push({
          testName: baseline.testName,
          baselineAvg: baseline.averageTimeMs,
          optimizedAvg: current.averageTimeMs,
          improvement: Math.round(improvement * 100) / 100,
          improvementRatio,
          status
        });
      }
    }

    return comparisons;
  }

  /**
   * Calculate benchmark result statistics
   */
  private calculateBenchmarkResult(
    testName: string,
    iterations: number,
    times: number[],
    errors: string[]
  ): BenchmarkResult {
    if (times.length === 0) {
      return {
        testName,
        iterations,
        totalTimeMs: 0,
        averageTimeMs: 0,
        minTimeMs: 0,
        maxTimeMs: 0,
        successRate: 0,
        errors,
        throughput: 0
      };
    }

    const totalTimeMs = times.reduce((sum, time) => sum + time, 0);
    const averageTimeMs = totalTimeMs / times.length;
    const minTimeMs = Math.min(...times);
    const maxTimeMs = Math.max(...times);
    const successRate = ((iterations - errors.length) / iterations) * 100;
    const throughput = successRate > 0 ? (1000 / averageTimeMs) : 0;

    return {
      testName,
      iterations,
      totalTimeMs,
      averageTimeMs: Math.round(averageTimeMs * 100) / 100,
      minTimeMs,
      maxTimeMs,
      successRate: Math.round(successRate * 100) / 100,
      errors: errors.slice(0, 5), // Limit to first 5 errors
      throughput: Math.round(throughput * 100) / 100
    };
  }

  /**
   * Generate performance summary and recommendations
   */
  private generateSummary(results: BenchmarkResult[]): {
    totalTests: number;
    averagePerformance: number;
    recommendedOptimizations: string[];
  } {
    const totalTests = results.length;
    const averagePerformance = results.reduce((sum, r) => sum + r.averageTimeMs, 0) / totalTests;
    const recommendations: string[] = [];

    // Analyze results and generate recommendations
    const slowQueries = results.filter(r => r.averageTimeMs > 1000);
    if (slowQueries.length > 0) {
      recommendations.push(`${slowQueries.length} queries are slower than 1 second - consider further optimization`);
    }

    const lowSuccessRate = results.filter(r => r.successRate < 95);
    if (lowSuccessRate.length > 0) {
      recommendations.push(`${lowSuccessRate.length} queries have success rate below 95% - investigate error handling`);
    }

    const lowThroughput = results.filter(r => r.throughput < 10);
    if (lowThroughput.length > 0) {
      recommendations.push(`${lowThroughput.length} queries have low throughput - consider indexing or query optimization`);
    }

    if (recommendations.length === 0) {
      recommendations.push('All benchmarks performing within acceptable parameters');
    }

    return {
      totalTests,
      averagePerformance: Math.round(averagePerformance * 100) / 100,
      recommendedOptimizations: recommendations
    };
  }
}

// Singleton instance
let databaseBenchmark: DatabaseBenchmark | null = null;

export function getDatabaseBenchmark(): DatabaseBenchmark {
  if (!databaseBenchmark) {
    databaseBenchmark = new DatabaseBenchmark();
  }
  return databaseBenchmark;
}

// Export types and classes
export type { BenchmarkResult, ComparisonResult };
export { DatabaseBenchmark };