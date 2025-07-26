/**
 * Query Result Caching System
 * Implements intelligent caching with invalidation strategies
 */

import { DateRange } from '@/app/models/dashboard';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
  tags: string[];
  accessCount: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[]; // Tags for invalidation grouping
  serialize?: boolean; // Whether to serialize complex objects
  compress?: boolean; // Whether to compress large data
}

interface CacheStats {
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  totalEntries: number;
  memoryUsage: number;
  averageResponseTime: number;
}

class QueryResultCache {
  private cache = new Map<string, CacheEntry>();
  private tagIndex = new Map<string, Set<string>>(); // tag -> set of cache keys
  private stats = {
    hits: 0,
    misses: 0,
    totalResponseTime: 0,
    operations: 0
  };

  private readonly maxEntries: number;
  private readonly defaultTTL: number;
  private readonly memoryLimit: number;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(
    maxEntries: number = 1000,
    defaultTTL: number = 300000, // 5 minutes
    memoryLimit: number = 100 * 1024 * 1024 // 100MB
  ) {
    this.maxEntries = maxEntries;
    this.defaultTTL = defaultTTL;
    this.memoryLimit = memoryLimit;
    
    this.startCleanupProcess();
  }

  /**
   * Get cached result or execute query function
   */
  public async get<T>(
    key: string,
    queryFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    const cacheKey = this.buildCacheKey(key);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && this.isValidEntry(cached)) {
      cached.accessCount++;
      cached.lastAccessed = Date.now();
      this.stats.hits++;
      
      const responseTime = Date.now() - startTime;
      this.updateResponseTimeStats(responseTime);
      
      console.log(`Cache HIT for key: ${cacheKey} (${responseTime}ms)`);
      return cached.data as T;
    }

    // Cache miss - execute query
    this.stats.misses++;
    console.log(`Cache MISS for key: ${cacheKey}`);
    
    try {
      const result = await queryFn();
      
      // Store in cache
      await this.set(cacheKey, result, options);
      
      const responseTime = Date.now() - startTime;
      this.updateResponseTimeStats(responseTime);
      
      return result;
    } catch (error) {
      console.error(`Query execution failed for key: ${cacheKey}`, error);
      throw error;
    }
  }

  /**
   * Store data in cache
   */
  public async set<T>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const cacheKey = this.buildCacheKey(key);
    const ttl = options.ttl || this.defaultTTL;
    const tags = options.tags || [];

    // Serialize data if needed
    let processedData = data;
    if (options.serialize && typeof data === 'object') {
      processedData = JSON.parse(JSON.stringify(data)) as T;
    }

    const entry: CacheEntry<T> = {
      data: processedData,
      timestamp: Date.now(),
      ttl,
      key: cacheKey,
      tags,
      accessCount: 0,
      lastAccessed: Date.now()
    };

    // Check memory usage before adding
    if (this.getMemoryUsage() > this.memoryLimit * 0.9) {
      await this.evictLRU();
    }

    // Add to cache
    this.cache.set(cacheKey, entry);

    // Update tag index
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(cacheKey);
    });

    // Evict if over capacity
    if (this.cache.size > this.maxEntries) {
      await this.evictLRU();
    }
  }

  /**
   * Get analytics-specific cached data with smart key generation
   */
  public async getAnalyticsData<T>(
    tenantId: string,
    dataType: string,
    dateRange: DateRange,
    queryFn: () => Promise<T>,
    customTTL?: number
  ): Promise<T> {
    const key = this.buildAnalyticsKey(tenantId, dataType, dateRange);
    const tags = [`tenant:${tenantId}`, `type:${dataType}`, 'analytics'];
    
    return this.get(key, queryFn, {
      ttl: customTTL || this.getAnalyticsTTL(dataType),
      tags
    });
  }

  /**
   * Build analytics-specific cache key
   */
  private buildAnalyticsKey(
    tenantId: string,
    dataType: string,
    dateRange: DateRange
  ): string {
    const startDate = dateRange.start.toISOString().split('T')[0];
    const endDate = dateRange.end.toISOString().split('T')[0];
    return `analytics:${tenantId}:${dataType}:${startDate}:${endDate}`;
  }

  /**
   * Get appropriate TTL for different analytics data types
   */
  private getAnalyticsTTL(dataType: string): number {
    const ttlMap: Record<string, number> = {
      'metrics': 300000, // 5 minutes - frequently changing
      'revenue-trend': 600000, // 10 minutes - daily aggregates
      'service-performance': 900000, // 15 minutes - stable data
      'customer-segments': 1800000, // 30 minutes - slow changing
      'popular-times': 3600000 // 1 hour - historical patterns
    };

    return ttlMap[dataType] || this.defaultTTL;
  }

  /**
   * Invalidate cache entries by tags
   */
  public async invalidateByTags(tags: string[]): Promise<number> {
    let invalidatedCount = 0;
    const keysToInvalidate = new Set<string>();

    tags.forEach(tag => {
      const taggedKeys = this.tagIndex.get(tag);
      if (taggedKeys) {
        taggedKeys.forEach(key => keysToInvalidate.add(key));
      }
    });

    keysToInvalidate.forEach(key => {
      if (this.cache.delete(key)) {
        invalidatedCount++;
      }
      
      // Remove from tag index
      tags.forEach(tag => {
        const taggedKeys = this.tagIndex.get(tag);
        if (taggedKeys) {
          taggedKeys.delete(key);
          if (taggedKeys.size === 0) {
            this.tagIndex.delete(tag);
          }
        }
      });
    });

    console.log(`Invalidated ${invalidatedCount} cache entries for tags: ${tags.join(', ')}`);
    return invalidatedCount;
  }

  /**
   * Invalidate all analytics data for a specific tenant
   */
  public async invalidateTenantAnalytics(tenantId: string): Promise<number> {
    return this.invalidateByTags([`tenant:${tenantId}`, 'analytics']);
  }

  /**
   * Invalidate specific analytics data type for a tenant
   */
  public async invalidateTenantDataType(
    tenantId: string,
    dataType: string
  ): Promise<number> {
    return this.invalidateByTags([
      `tenant:${tenantId}`,
      `type:${dataType}`,
      'analytics'
    ]);
  }

  /**
   * Pre-warm cache with commonly accessed data
   */
  public async warmCache(
    tenantId: string,
    warmupQueries: Array<{
      key: string;
      queryFn: () => Promise<any>;
      options?: CacheOptions;
    }>
  ): Promise<void> {
    console.log(`Starting cache warmup for tenant: ${tenantId}`);
    
    const warmupPromises = warmupQueries.map(async ({ key, queryFn, options }) => {
      try {
        await this.get(key, queryFn, options);
      } catch (error) {
        console.error(`Failed to warm cache for key: ${key}`, error);
      }
    });

    await Promise.allSettled(warmupPromises);
    console.log(`Cache warmup completed for tenant: ${tenantId}`);
  }

  /**
   * Build standardized cache key
   */
  private buildCacheKey(key: string): string {
    return `query:${key}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isValidEntry(entry: CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
  }

  /**
   * Update response time statistics
   */
  private updateResponseTimeStats(responseTime: number): void {
    this.stats.operations++;
    this.stats.totalResponseTime += responseTime;
  }

  /**
   * Get current cache statistics
   */
  public getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    const missRate = totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0;

    return {
      hitRate: Math.round(hitRate * 100) / 100,
      missRate: Math.round(missRate * 100) / 100,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      totalEntries: this.cache.size,
      memoryUsage: this.getMemoryUsage(),
      averageResponseTime: this.stats.operations > 0 
        ? Math.round(this.stats.totalResponseTime / this.stats.operations)
        : 0
    };
  }

  /**
   * Estimate memory usage
   */
  private getMemoryUsage(): number {
    let totalSize = 0;
    
    this.cache.forEach(entry => {
      // Rough estimation of memory usage
      totalSize += JSON.stringify(entry.data).length * 2; // UTF-16 encoding
      totalSize += entry.key.length * 2;
      totalSize += entry.tags.join('').length * 2;
      totalSize += 200; // Overhead for entry metadata
    });

    return totalSize;
  }

  /**
   * Evict least recently used entries
   */
  private async evictLRU(): Promise<void> {
    const entries = Array.from(this.cache.entries());
    
    // Sort by last accessed time (ascending)
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    // Remove oldest 10% of entries
    const evictCount = Math.max(1, Math.floor(entries.length * 0.1));
    
    for (let i = 0; i < evictCount; i++) {
      const [key, entry] = entries[i];
      this.cache.delete(key);
      
      // Remove from tag index
      entry.tags.forEach(tag => {
        const taggedKeys = this.tagIndex.get(tag);
        if (taggedKeys) {
          taggedKeys.delete(key);
          if (taggedKeys.size === 0) {
            this.tagIndex.delete(tag);
          }
        }
      });
    }

    console.log(`Evicted ${evictCount} LRU cache entries`);
  }

  /**
   * Start periodic cleanup process
   */
  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Every minute
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    let expiredCount = 0;
    const now = Date.now();

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if ((now - entry.timestamp) >= entry.ttl) {
        this.cache.delete(key);
        expiredCount++;

        // Remove from tag index
        entry.tags.forEach(tag => {
          const taggedKeys = this.tagIndex.get(tag);
          if (taggedKeys) {
            taggedKeys.delete(key);
            if (taggedKeys.size === 0) {
              this.tagIndex.delete(tag);
            }
          }
        });
      }
    }

    if (expiredCount > 0) {
      console.log(`Cleaned up ${expiredCount} expired cache entries`);
    }
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      totalResponseTime: 0,
      operations: 0
    };
  }

  /**
   * Shutdown cache and cleanup resources
   */
  public shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Singleton instance
let queryCache: QueryResultCache | null = null;

export function getQueryCache(): QueryResultCache {
  if (!queryCache) {
    queryCache = new QueryResultCache(
      parseInt(process.env.CACHE_MAX_ENTRIES || '1000'),
      parseInt(process.env.CACHE_DEFAULT_TTL || '300000'),
      parseInt(process.env.CACHE_MEMORY_LIMIT || '104857600')
    );
  }
  return queryCache;
}

export function shutdownQueryCache(): void {
  if (queryCache) {
    queryCache.shutdown();
    queryCache = null;
  }
}

// Export types and classes
export type { CacheEntry, CacheOptions, CacheStats };
export { QueryResultCache };