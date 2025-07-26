/**
 * Rate Limiting Service
 * Tenant-aware rate limiting with in-memory storage and comprehensive DoS protection
 * Based on Redis patterns with memory optimization
 */

import { z } from 'zod';

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit?: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface TenantLimits {
  tenantId: string;
  tier: 'free' | 'pro' | 'enterprise';
  customLimits?: Partial<RateLimitConfig>;
}

export class RateLimitExceededError extends Error {
  constructor(
    message: string,
    public remaining: number,
    public resetTime: number,
    public retryAfter: number
  ) {
    super(message);
    this.name = 'RateLimitExceededError';
  }
}

/**
 * In-memory rate limiting with sliding window algorithm
 */
class RateLimitStore {
  private requests: Map<string, number[]> = new Map();
  private lastCleanup: number = Date.now();
  private readonly cleanupInterval = 5 * 60 * 1000; // 5 minutes

  /**
   * Add a request timestamp to the store
   */
  addRequest(key: string): void {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    requests.push(now);
    this.requests.set(key, requests);
    
    // Periodic cleanup
    if (now - this.lastCleanup > this.cleanupInterval) {
      this.cleanup();
    }
  }

  /**
   * Get request count within a time window
   */
  getRequestCount(key: string, windowMs: number): number {
    const now = Date.now();
    const windowStart = now - windowMs;
    const requests = this.requests.get(key) || [];
    
    // Filter requests within the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    // Update the store with filtered requests
    if (validRequests.length !== requests.length) {
      this.requests.set(key, validRequests);
    }
    
    return validRequests.length;
  }

  /**
   * Get oldest request timestamp for reset time calculation
   */
  getOldestRequest(key: string, windowMs: number): number | null {
    const now = Date.now();
    const windowStart = now - windowMs;
    const requests = this.requests.get(key) || [];
    
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    return validRequests.length > 0 ? Math.min(...validRequests) : null;
  }

  /**
   * Cleanup old requests to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const cutoff = now - maxAge;
    
    for (const [key, requests] of Array.from(this.requests.entries())) {
      const validRequests = requests.filter((timestamp: number) => timestamp > cutoff);
      
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else if (validRequests.length !== requests.length) {
        this.requests.set(key, validRequests);
      }
    }
    
    this.lastCleanup = now;
  }

  /**
   * Get memory stats for monitoring
   */
  getStats(): { totalKeys: number; totalRequests: number; memoryUsage: number } {
    let totalRequests = 0;
    for (const requests of Array.from(this.requests.values())) {
      totalRequests += requests.length;
    }
    
    return {
      totalKeys: this.requests.size,
      totalRequests,
      memoryUsage: this.requests.size * 100 + totalRequests * 8 // Rough estimate
    };
  }
}

/**
 * Tenant-aware Rate Limiting Service
 */
export class RateLimitingService {
  private store = new RateLimitStore();
  private tenantLimits = new Map<string, RateLimitConfig>();
  
  // Default rate limits by tenant tier
  private readonly defaultLimits: Record<string, RateLimitConfig> = {
    free: {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      requestsPerDay: 1000,
      burstLimit: 15,
      windowMs: 60 * 1000
    },
    pro: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      burstLimit: 100,
      windowMs: 60 * 1000
    },
    enterprise: {
      requestsPerMinute: 300,
      requestsPerHour: 5000,
      requestsPerDay: 50000,
      burstLimit: 500,
      windowMs: 60 * 1000
    }
  };

  /**
   * Check rate limit for a request
   */
  async checkRateLimit(
    clientId: string,
    tenantId: string,
    endpoint: string,
    tier: 'free' | 'pro' | 'enterprise' = 'free'
  ): Promise<RateLimitResult> {
    const limits = this.getTenantRateLimits(tenantId, tier);
    const key = this.generateKey(clientId, tenantId, endpoint);
    
    // Check different time windows
    const minuteCount = this.store.getRequestCount(key, 60 * 1000);
    const hourCount = this.store.getRequestCount(key, 60 * 60 * 1000);
    const dayCount = this.store.getRequestCount(key, 24 * 60 * 60 * 1000);
    
    // Check burst limit (short-term spike protection)
    if (limits.burstLimit) {
      const burstKey = `${key}:burst`;
      const burstCount = this.store.getRequestCount(burstKey, 10 * 1000); // 10 seconds
      
      if (burstCount >= limits.burstLimit) {
        const retryAfter = 10; // 10 seconds
        return {
          allowed: false,
          remaining: 0,
          resetTime: Date.now() + retryAfter * 1000,
          retryAfter
        };
      }
    }
    
    // Check minute limit
    if (minuteCount >= limits.requestsPerMinute) {
      const oldestRequest = this.store.getOldestRequest(key, 60 * 1000);
      const resetTime = oldestRequest ? oldestRequest + 60 * 1000 : Date.now() + 60 * 1000;
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      await this.logRateLimitViolation(clientId, tenantId, endpoint, 'minute', minuteCount);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter
      };
    }
    
    // Check hour limit
    if (hourCount >= limits.requestsPerHour) {
      const oldestRequest = this.store.getOldestRequest(key, 60 * 60 * 1000);
      const resetTime = oldestRequest ? oldestRequest + 60 * 60 * 1000 : Date.now() + 60 * 60 * 1000;
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      await this.logRateLimitViolation(clientId, tenantId, endpoint, 'hour', hourCount);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter
      };
    }
    
    // Check day limit
    if (dayCount >= limits.requestsPerDay) {
      const oldestRequest = this.store.getOldestRequest(key, 24 * 60 * 60 * 1000);
      const resetTime = oldestRequest ? oldestRequest + 24 * 60 * 60 * 1000 : Date.now() + 24 * 60 * 60 * 1000;
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      await this.logRateLimitViolation(clientId, tenantId, endpoint, 'day', dayCount);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter
      };
    }
    
    // Request is allowed, record it
    this.store.addRequest(key);
    if (limits.burstLimit) {
      this.store.addRequest(`${key}:burst`);
    }
    
    // Calculate remaining requests (use most restrictive limit)
    const minuteRemaining = limits.requestsPerMinute - minuteCount - 1;
    const hourRemaining = limits.requestsPerHour - hourCount - 1;
    const dayRemaining = limits.requestsPerDay - dayCount - 1;
    
    const remaining = Math.min(minuteRemaining, hourRemaining, dayRemaining);
    
    return {
      allowed: true,
      remaining: Math.max(0, remaining),
      resetTime: Date.now() + 60 * 1000 // Next minute
    };
  }

  /**
   * Set custom rate limits for a tenant
   */
  setTenantLimits(tenantId: string, limits: Partial<RateLimitConfig>): void {
    const existing = this.tenantLimits.get(tenantId) || this.defaultLimits.free;
    this.tenantLimits.set(tenantId, { ...existing, ...limits });
  }

  /**
   * Get rate limits for a tenant
   */
  getTenantRateLimits(tenantId: string, tier: 'free' | 'pro' | 'enterprise' = 'free'): RateLimitConfig {
    const customLimits = this.tenantLimits.get(tenantId);
    const defaultLimits = this.defaultLimits[tier];
    
    return customLimits || defaultLimits;
  }

  /**
   * Generate cache key for rate limiting
   */
  private generateKey(clientId: string, tenantId: string, endpoint: string): string {
    // Sanitize inputs to prevent cache pollution
    const sanitizedClientId = clientId.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedTenantId = tenantId.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedEndpoint = endpoint.replace(/[^a-zA-Z0-9-_/]/g, '');
    
    return `rate_limit:${sanitizedClientId}:${sanitizedTenantId}:${sanitizedEndpoint}`;
  }

  /**
   * Log rate limit violations for monitoring
   */
  private async logRateLimitViolation(
    clientId: string,
    tenantId: string,
    endpoint: string,
    limitType: 'minute' | 'hour' | 'day',
    requestCount: number
  ): Promise<void> {
    console.warn('Rate limit exceeded', {
      clientId,
      tenantId,
      endpoint,
      limitType,
      requestCount,
      timestamp: new Date().toISOString()
    });
    
    // In production, you might want to send this to a monitoring service
    // await monitoringService.logRateLimitViolation({...});
  }

  /**
   * Get rate limiting statistics
   */
  getStats(): any {
    return {
      store: this.store.getStats(),
      tenants: this.tenantLimits.size,
      defaultLimits: this.defaultLimits
    };
  }

  /**
   * Reset rate limits for a specific key (admin function)
   */
  resetRateLimit(clientId: string, tenantId: string, endpoint: string): void {
    const key = this.generateKey(clientId, tenantId, endpoint);
    this.store.cleanup(); // This will remove old entries including the specified key
  }

  /**
   * Validate rate limit before processing request
   */
  async validateRateLimit(
    clientId: string,
    tenantId: string,
    endpoint: string,
    tier: 'free' | 'pro' | 'enterprise' = 'free'
  ): Promise<void> {
    const result = await this.checkRateLimit(clientId, tenantId, endpoint, tier);
    
    if (!result.allowed) {
      throw new RateLimitExceededError(
        `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
        result.remaining,
        result.resetTime,
        result.retryAfter || 60
      );
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimitingService();

/**
 * Rate limiting middleware for API routes
 */
export function withRateLimit(options: {
  tier?: 'free' | 'pro' | 'enterprise';
  endpoint?: string;
}) {
  return async function (
    clientId: string,
    tenantId: string,
    endpoint: string = options.endpoint || 'default'
  ): Promise<RateLimitResult> {
    return rateLimiter.checkRateLimit(
      clientId,
      tenantId,
      endpoint,
      options.tier || 'free'
    );
  };
}

/**
 * Zod schema for rate limit configuration
 */
export const RateLimitConfigSchema = z.object({
  requestsPerMinute: z.number().min(1).max(1000),
  requestsPerHour: z.number().min(1).max(10000),
  requestsPerDay: z.number().min(1).max(100000),
  burstLimit: z.number().min(1).max(1000).optional(),
  windowMs: z.number().min(1000).max(3600000) // 1 second to 1 hour
});

/**
 * Extract client identifier from request
 */
export function extractClientId(request: Request): string {
  // Try to get client ID from various sources
  const headers = request.headers;
  
  // Check for user agent + IP combination
  const userAgent = headers.get('user-agent') || 'unknown';
  const forwardedFor = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown';
  
  // Create a hash of identifying information
  const identifier = `${clientIp}:${userAgent.substring(0, 100)}`;
  
  // Simple hash function for consistent client ID
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `client_${Math.abs(hash)}`;
}

/**
 * Cleanup function to be called periodically
 */
export function cleanupRateLimits(): void {
  rateLimiter['store'].cleanup();
}

// Setup periodic cleanup
if (typeof window === 'undefined') { // Server-side only
  setInterval(cleanupRateLimits, 5 * 60 * 1000); // Every 5 minutes
}