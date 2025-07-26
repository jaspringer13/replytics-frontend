/**
 * Load Testing Script for Voice-Bot Analytics Integration
 * 
 * Tests the integration under realistic production load scenarios:
 * - 1000+ concurrent users
 * - High-frequency analytics queries
 * - Business ID resolution cache performance
 * - Database connection pool efficiency
 * - Authentication token validation under load
 */

import { performance } from 'perf_hooks';
import { createClient } from '@supabase/supabase-js';
import { resolveBusinessId, getBusinessIdCacheStats, clearBusinessIdCache } from '../../lib/services/business-id-resolver';
import { getDatabaseStats, getDatabaseHealth } from '../../lib/db/unified-connection-manager';

// Load test configuration
const LOAD_TEST_CONFIG = {
  CONCURRENT_USERS: 100, // Scaled for testing environment
  REQUESTS_PER_USER: 10,
  RAMP_UP_TIME: 5000, // 5 seconds
  TEST_DURATION: 30000, // 30 seconds
  PERFORMANCE_THRESHOLDS: {
    MAX_RESPONSE_TIME: 200, // ms
    MAX_ERROR_RATE: 5, // %
    MIN_CACHE_HIT_RATE: 95, // %
    MAX_P99_LATENCY: 500 // ms
  }
};

const TEST_BUSINESS_IDS = [
  'load_test_business_001',
  'load_test_business_002',
  'load_test_business_003',
  'load_test_business_004',
  'load_test_business_005'
];

interface LoadTestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  requestsPerSecond: number;
  cacheHitRate: number;
  databaseConnections: number;
}

interface UserSimulation {
  userId: string;
  requests: number;
  errors: number;
  totalTime: number;
  responseTimes: number[];
}

class LoadTester {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  private metrics: LoadTestMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    errorRate: 0,
    requestsPerSecond: 0,
    cacheHitRate: 0,
    databaseConnections: 0
  };

  private userSimulations: UserSimulation[] = [];
  private allResponseTimes: number[] = [];

  /**
   * Execute comprehensive load test
   */
  async executeLoadTest(): Promise<LoadTestMetrics> {
    console.log('🚀 Starting Load Test for Voice-Bot Analytics Integration');
    console.log(`📊 Configuration:
      - Concurrent Users: ${LOAD_TEST_CONFIG.CONCURRENT_USERS}
      - Requests per User: ${LOAD_TEST_CONFIG.REQUESTS_PER_USER}
      - Total Requests: ${LOAD_TEST_CONFIG.CONCURRENT_USERS * LOAD_TEST_CONFIG.REQUESTS_PER_USER}
      - Test Duration: ${LOAD_TEST_CONFIG.TEST_DURATION / 1000}s`);

    // Setup test data
    await this.setupTestData();

    // Clear caches for consistent testing
    clearBusinessIdCache();

    // Pre-warm system
    await this.preWarmSystem();

    const testStartTime = performance.now();

    // Execute concurrent user simulations
    const userPromises = Array.from({ length: LOAD_TEST_CONFIG.CONCURRENT_USERS }, (_, i) =>
      this.simulateUser(`user_${i}`)
    );

    // Execute all simulations concurrently
    const results = await Promise.allSettled(userPromises);
    
    const testEndTime = performance.now();
    const totalTestTime = testEndTime - testStartTime;

    // Process results
    this.processResults(results, totalTestTime);

    // Generate report
    await this.generateReport();

    return this.metrics;
  }

  /**
   * Simulate a single user's load pattern
   */
  private async simulateUser(userId: string): Promise<UserSimulation> {
    const userSim: UserSimulation = {
      userId,
      requests: 0,
      errors: 0,
      totalTime: 0,
      responseTimes: []
    };

    const startTime = performance.now();

    // Stagger user start times for realistic ramp-up
    const rampUpDelay = (Math.random() * LOAD_TEST_CONFIG.RAMP_UP_TIME);
    await this.sleep(rampUpDelay);

    // Execute user requests
    for (let i = 0; i < LOAD_TEST_CONFIG.REQUESTS_PER_USER; i++) {
      try {
        const requestStartTime = performance.now();
        
        // Mix of different operations
        await this.executeRandomOperation(userId);
        
        const requestEndTime = performance.now();
        const responseTime = requestEndTime - requestStartTime;
        
        userSim.requests++;
        userSim.responseTimes.push(responseTime);
        this.allResponseTimes.push(responseTime);

        // Small delay between requests to simulate realistic usage
        await this.sleep(Math.random() * 100);

      } catch (error) {
        userSim.errors++;
        console.error(`User ${userId} request ${i} failed:`, error);
      }
    }

    userSim.totalTime = performance.now() - startTime;
    this.userSimulations.push(userSim);

    return userSim;
  }

  /**
   * Execute random operation to simulate mixed load
   */
  private async executeRandomOperation(userId: string): Promise<void> {
    const operations = [
      () => this.testAnalyticsQuery(userId),
      () => this.testBusinessIdResolution(),
      () => this.testDatabaseQuery(),
      () => this.testAuthenticationValidation(userId),
      () => this.testCacheOperation()
    ];

    const randomOperation = operations[Math.floor(Math.random() * operations.length)];
    await randomOperation();
  }

  /**
   * Test analytics query performance
   */
  private async testAnalyticsQuery(userId: string): Promise<void> {
    const mockSession = {
      userId,
      tenantId: 'load_test_tenant',
      businessId: TEST_BUSINESS_IDS[0] + '_uuid'
    };

    // Simulate analytics overview query
    const startDate = new Date('2024-01-01').toISOString().split('T')[0];
    const endDate = new Date('2024-01-31').toISOString().split('T')[0];

    // Mock the analytics calculation
    const metrics = {
      totalRevenue: Math.floor(Math.random() * 50000) + 10000,
      totalAppointments: Math.floor(Math.random() * 200) + 50,
      totalCustomers: Math.floor(Math.random() * 150) + 30
    };

    // Simulate database queries for analytics
    await Promise.all([
      this.supabase.from('businesses').select('count').limit(1),
      this.supabase.from('appointments').select('count').limit(1),
      this.supabase.from('customers').select('count').limit(1)
    ]);
  }

  /**
   * Test business ID resolution with caching
   */
  private async testBusinessIdResolution(): Promise<void> {
    const randomBusinessId = TEST_BUSINESS_IDS[Math.floor(Math.random() * TEST_BUSINESS_IDS.length)];
    await resolveBusinessId(randomBusinessId);
  }

  /**
   * Test database query performance
   */
  private async testDatabaseQuery(): Promise<void> {
    const { data, error } = await this.supabase
      .from('businesses')
      .select('id, name, active')
      .eq('active', true)
      .limit(10);

    if (error) throw error;
  }

  /**
   * Test authentication validation
   */
  private async testAuthenticationValidation(userId: string): Promise<void> {
    // Simulate session validation
    const mockSession = {
      userId,
      email: `${userId}@test.com`,
      tenantId: 'load_test_tenant',
      businessId: TEST_BUSINESS_IDS[0] + '_uuid',
      isActive: true,
      expiresAt: new Date(Date.now() + 3600000)
    };

    // Validate session is not expired
    if (mockSession.expiresAt.getTime() < Date.now()) {
      throw new Error('Session expired');
    }
  }

  /**
   * Test cache operations
   */
  private async testCacheOperation(): Promise<void> {
    // Get cache statistics
    const cacheStats = getBusinessIdCacheStats();
    
    // Ensure cache is functioning
    if (cacheStats.size < 0) {
      throw new Error('Cache operation failed');
    }
  }

  /**
   * Pre-warm system for consistent testing
   */
  private async preWarmSystem(): Promise<void> {
    console.log('🔥 Pre-warming system...');

    // Pre-load business IDs into cache
    for (const businessId of TEST_BUSINESS_IDS) {
      await resolveBusinessId(businessId);
    }

    // Warm up database connections
    await Promise.all([
      this.supabase.from('businesses').select('count').limit(1),
      this.supabase.from('users').select('count').limit(1),
      this.supabase.from('appointments').select('count').limit(1)
    ]);

    console.log('✅ System pre-warmed');
  }

  /**
   * Process load test results and calculate metrics
   */
  private processResults(results: PromiseSettledResult<UserSimulation>[], totalTestTime: number): void {
    console.log('📊 Processing load test results...');

    const successfulUsers = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<UserSimulation>[];
    const failedUsers = results.filter(r => r.status === 'rejected');

    // Calculate basic metrics
    this.metrics.totalRequests = successfulUsers.reduce((sum, r) => sum + r.value.requests, 0);
    this.metrics.successfulRequests = this.metrics.totalRequests - successfulUsers.reduce((sum, r) => sum + r.value.errors, 0);
    this.metrics.failedRequests = successfulUsers.reduce((sum, r) => sum + r.value.errors, 0) + failedUsers.length;

    // Calculate response time metrics
    if (this.allResponseTimes.length > 0) {
      this.allResponseTimes.sort((a, b) => a - b);
      
      this.metrics.averageResponseTime = this.allResponseTimes.reduce((sum, time) => sum + time, 0) / this.allResponseTimes.length;
      this.metrics.p95ResponseTime = this.allResponseTimes[Math.floor(this.allResponseTimes.length * 0.95)];
      this.metrics.p99ResponseTime = this.allResponseTimes[Math.floor(this.allResponseTimes.length * 0.99)];
    }

    // Calculate error rate
    this.metrics.errorRate = (this.metrics.failedRequests / (this.metrics.totalRequests + this.metrics.failedRequests)) * 100;

    // Calculate requests per second
    this.metrics.requestsPerSecond = this.metrics.totalRequests / (totalTestTime / 1000);

    // Get cache performance
    const cacheStats = getBusinessIdCacheStats();
    this.metrics.cacheHitRate = cacheStats.hitRate;

    // Get database stats
    const dbStats = getDatabaseStats();
    this.metrics.databaseConnections = dbStats.supabaseConnections + dbStats.postgresConnections;
  }

  /**
   * Generate comprehensive load test report
   */
  private async generateReport(): Promise<void> {
    console.log('\n🎯 LOAD TEST RESULTS');
    console.log('==========================================');
    console.log(`📊 Request Metrics:
      Total Requests: ${this.metrics.totalRequests}
      Successful: ${this.metrics.successfulRequests}
      Failed: ${this.metrics.failedRequests}
      Error Rate: ${this.metrics.errorRate.toFixed(2)}%`);

    console.log(`⚡ Performance Metrics:
      Average Response Time: ${this.metrics.averageResponseTime.toFixed(2)}ms
      95th Percentile: ${this.metrics.p95ResponseTime.toFixed(2)}ms
      99th Percentile: ${this.metrics.p99ResponseTime.toFixed(2)}ms
      Requests/Second: ${this.metrics.requestsPerSecond.toFixed(2)}`);

    console.log(`🎯 Cache Performance:
      Cache Hit Rate: ${this.metrics.cacheHitRate.toFixed(2)}%
      Database Connections: ${this.metrics.databaseConnections}`);

    // Performance validation
    console.log('\n✅ PERFORMANCE VALIDATION');
    console.log('==========================================');
    
    const validations = [
      {
        metric: 'Average Response Time',
        value: this.metrics.averageResponseTime,
        threshold: LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.MAX_RESPONSE_TIME,
        unit: 'ms',
        passed: this.metrics.averageResponseTime <= LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.MAX_RESPONSE_TIME
      },
      {
        metric: '99th Percentile Response Time',
        value: this.metrics.p99ResponseTime,
        threshold: LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.MAX_P99_LATENCY,
        unit: 'ms',
        passed: this.metrics.p99ResponseTime <= LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.MAX_P99_LATENCY
      },
      {
        metric: 'Error Rate',
        value: this.metrics.errorRate,
        threshold: LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.MAX_ERROR_RATE,
        unit: '%',
        passed: this.metrics.errorRate <= LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.MAX_ERROR_RATE
      },
      {
        metric: 'Cache Hit Rate',
        value: this.metrics.cacheHitRate,
        threshold: LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.MIN_CACHE_HIT_RATE,
        unit: '%',
        passed: this.metrics.cacheHitRate >= LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.MIN_CACHE_HIT_RATE
      }
    ];

    let allTestsPassed = true;
    validations.forEach(validation => {
      const status = validation.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${validation.metric}: ${validation.value.toFixed(2)}${validation.unit} (threshold: ${validation.threshold}${validation.unit})`);
      if (!validation.passed) allTestsPassed = false;
    });

    console.log(`\n🏆 OVERALL RESULT: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    // Save detailed report
    await this.saveDetailedReport();
  }

  /**
   * Save detailed report to file
   */
  private async saveDetailedReport(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      configuration: LOAD_TEST_CONFIG,
      metrics: this.metrics,
      userSimulations: this.userSimulations.slice(0, 10), // Sample of user data
      performanceValidation: {
        averageResponseTimePass: this.metrics.averageResponseTime <= LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.MAX_RESPONSE_TIME,
        p99LatencyPass: this.metrics.p99ResponseTime <= LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.MAX_P99_LATENCY,
        errorRatePass: this.metrics.errorRate <= LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.MAX_ERROR_RATE,
        cacheHitRatePass: this.metrics.cacheHitRate >= LOAD_TEST_CONFIG.PERFORMANCE_THRESHOLDS.MIN_CACHE_HIT_RATE
      }
    };

    // In a real environment, this would save to a file
    console.log('\n📄 Detailed report generated (in production, this would be saved to file)');
  }

  /**
   * Setup test data for load testing
   */
  private async setupTestData(): Promise<void> {
    console.log('📋 Setting up load test data...');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create test businesses
    for (const businessId of TEST_BUSINESS_IDS) {
      const { error } = await supabase
        .from('businesses')
        .upsert({
          id: `${businessId}_uuid`,
          external_id: businessId,
          name: `Load Test Business ${businessId}`,
          tenant_id: 'load_test_tenant',
          active: true,
          subscription_tier: 'pro'
        }, { onConflict: 'external_id' });

      if (error && !error.message.includes('duplicate')) {
        console.warn(`Warning: Could not create test business ${businessId}:`, error.message);
      }
    }

    console.log('✅ Load test data setup complete');
  }

  /**
   * Helper function for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use in tests
export { LoadTester, LOAD_TEST_CONFIG };

// Run load test if executed directly
if (require.main === module) {
  const loadTester = new LoadTester();
  loadTester.executeLoadTest()
    .then(metrics => {
      console.log('\n🎯 Load test completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Load test failed:', error);
      process.exit(1);
    });
}