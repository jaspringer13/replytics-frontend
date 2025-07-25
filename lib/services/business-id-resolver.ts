/**
 * Business ID Resolution Service
 * 
 * High-performance caching service for external_id → UUID mapping.
 * Ported from voice-bot's database patterns with 95% cache hit rate target.
 */

import { createClient } from '@supabase/supabase-js';
import { 
  BusinessResolution, 
  BusinessResolutionResult, 
  BusinessCacheEntry,
  BusinessCacheStats,
  validateBusinessId,
  createBusinessResolutionError,
  BusinessResolutionErrorCode,
  isSuccessfulResolution
} from '@/lib/types/business-context';
import { BusinessContext } from '@/lib/types/integration';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Enhanced cache with detailed entry tracking
class BusinessIdCache {
  private cache = new Map<string, BusinessCacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes TTL
  private readonly MAX_SIZE = 1000; // Max cache entries
  private hitCount = 0;
  private missCount = 0;
  private totalRequests = 0;

  set(external_id: string, business: BusinessResolution): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.MAX_SIZE) {
      const entries = Array.from(this.cache.entries());
      const oldestEntry = entries.reduce((oldest, current) => 
        current[1].timestamp < oldest[1].timestamp ? current : oldest
      );
      this.cache.delete(oldestEntry[0]);
    }

    this.cache.set(external_id, {
      uuid: business.uuid,
      external_id: business.external_id,
      name: business.name,
      active: business.active,
      tenant_id: business.tenant_id,
      timestamp: Date.now(),
      hits: 0,
      expires_at: Date.now() + this.TTL
    });
  }

  get(external_id: string): BusinessCacheEntry | null {
    const entry = this.cache.get(external_id);
    
    if (!entry) {
      this.recordMiss();
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expires_at) {
      this.cache.delete(external_id);
      this.recordMiss();
      return null;
    }

    // Update hit count and record cache hit
    entry.hits++;
    this.recordHit();
    return entry;
  }

  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this.totalRequests = 0;
  }

  getStats(): BusinessCacheStats {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    const totalResponseTime = entries.reduce((sum, entry) => sum + (now - entry.timestamp), 0);
    
    return {
      size: this.cache.size,
      hitRate: this.totalRequests > 0 ? (this.hitCount / this.totalRequests) * 100 : 0,
      missRate: this.totalRequests > 0 ? (this.missCount / this.totalRequests) * 100 : 0,
      totalRequests: this.totalRequests,
      totalHits: this.hitCount,
      totalMisses: this.missCount,
      averageResponseTime: entries.length > 0 ? totalResponseTime / entries.length : 0,
      oldestEntry: entries.length > 0 ? new Date(Math.min(...entries.map(e => e.timestamp))) : undefined,
      newestEntry: entries.length > 0 ? new Date(Math.max(...entries.map(e => e.timestamp))) : undefined
    };
  }

  recordCacheHit(): void {
    this.hitCount++;
    this.totalRequests++;
  }

  recordCacheMiss(): void {
    this.missCount++;
    this.totalRequests++;
  }

  private recordHit(): void {
    this.recordCacheHit();
  }

  private recordMiss(): void {
    this.recordCacheMiss();
  }
}

// Global cache instance
const businessIdCache = new BusinessIdCache();

// Removed duplicate interface definitions - now imported from types

/**
 * Resolve external business ID to internal UUID with caching
 * Performance target: Sub-50ms with 95% cache hit rate
 */
export async function resolveBusinessId(external_id: string | undefined | null): Promise<BusinessResolutionResult> {
  const startTime = Date.now();
  
  try {
    // Enhanced input validation with proper typing
    if (!validateBusinessId(external_id)) {
      return {
        success: false,
        error: createBusinessResolutionError(
          BusinessResolutionErrorCode.INVALID_EXTERNAL_ID,
          'Invalid external_id provided: must be a non-empty string',
          { external_id: external_id || 'undefined', retryable: false }
        ).message,
        fromCache: false,
        executionTime: Date.now() - startTime
      };
    }

    // Check cache first
    const cachedEntry = businessIdCache.get(external_id);
    if (cachedEntry) {
      return {
        success: true,
        business: {
          uuid: cachedEntry.uuid,
          external_id: cachedEntry.external_id,
          name: cachedEntry.name,
          active: cachedEntry.active,
          tenant_id: cachedEntry.tenant_id,
          created_at: new Date(), // Would be stored in cache in production
          updated_at: new Date()  // Would be stored in cache in production
        },
        fromCache: true,
        executionTime: Date.now() - startTime
      };
    }

    // Database lookup if not in cache
    const { data: business, error } = await supabase
      .from('businesses')
      .select('id, external_id, name, active, tenant_id, created_at, updated_at')
      .eq('external_id', external_id)
      .eq('active', true)
      .single();

    if (error || !business) {
      return {
        success: false,
        error: createBusinessResolutionError(
          BusinessResolutionErrorCode.BUSINESS_NOT_FOUND,
          `Business not found for external_id: ${external_id}`,
          { external_id, retryable: false }
        ).message,
        fromCache: false,
        executionTime: Date.now() - startTime
      };
    }

    // Create business resolution object
    const businessResolution: BusinessResolution = {
      uuid: business.id,
      external_id: business.external_id,
      name: business.name,
      active: business.active,
      tenant_id: business.tenant_id || 'default',
      created_at: new Date(business.created_at || new Date()),
      updated_at: new Date(business.updated_at || new Date())
    };

    // Cache the successful resolution
    businessIdCache.set(external_id, businessResolution);

    return {
      success: true,
      business: businessResolution,
      fromCache: false,
      executionTime: Date.now() - startTime
    };

  } catch (error) {
    console.error('[Business ID Resolver] Resolution error:', error);
    return {
      success: false,
      error: createBusinessResolutionError(
        BusinessResolutionErrorCode.DATABASE_ERROR,
        'Internal error resolving business ID',
        { external_id: external_id || undefined, retryable: true }
      ).message,
      fromCache: false,
      executionTime: Date.now() - startTime
    };
  }
}

/**
 * Batch resolve multiple external IDs (optimized for bulk operations)
 */
export async function resolveBatchBusinessIds(external_ids: string[]): Promise<Map<string, BusinessResolution>> {
  const results = new Map<string, BusinessResolution>();
  const uncachedIds: string[] = [];

  // Check cache for all IDs first
  for (const external_id of external_ids) {
    const cachedEntry = businessIdCache.get(external_id);
    if (cachedEntry) {
      results.set(external_id, {
        uuid: cachedEntry.uuid,
        external_id: cachedEntry.external_id,
        name: cachedEntry.name,
        active: cachedEntry.active,
        tenant_id: cachedEntry.tenant_id,
        created_at: new Date(),
        updated_at: new Date()
      });
    } else {
      uncachedIds.push(external_id);
    }
  }

  // Bulk fetch uncached IDs
  if (uncachedIds.length > 0) {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, external_id, name, active, tenant_id, created_at, updated_at')
      .in('external_id', uncachedIds)
      .eq('active', true);

    if (!error && businesses) {
      for (const business of businesses) {
        const businessResolution: BusinessResolution = {
          uuid: business.id,
          external_id: business.external_id,  
          name: business.name,
          active: business.active,
          tenant_id: business.tenant_id || 'default',
          created_at: new Date(business.created_at),
          updated_at: new Date(business.updated_at)
        };
        
        // Cache the resolution
        businessIdCache.set(business.external_id, businessResolution);
        results.set(business.external_id, businessResolution);
      }
    }
  }

  return results;
}

/**
 * Validate business access for authenticated user
 * Ported from voice-bot's business access validation
 */
export async function validateBusinessAccess(
  userId: string, 
  businessId: string
): Promise<{ hasAccess: boolean; role?: string }> {
  try {
    const { data: access, error } = await supabase
      .from('user_business_access')
      .select('role')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .single();

    if (error || !access) {
      return { hasAccess: false };
    }

    return { 
      hasAccess: true, 
      role: access.role 
    };

  } catch (error) {
    console.error('[Business ID Resolver] Access validation error:', error);
    return { hasAccess: false };
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getBusinessIdCacheStats(): BusinessCacheStats {
  return businessIdCache.getStats();
}

/**
 * Clear business ID cache (for testing or manual refresh)
 */
export function clearBusinessIdCache(): void {
  businessIdCache.clear();
}

/**
 * Preload frequently accessed business IDs into cache
 */
export async function preloadBusinessCache(external_ids: string[]): Promise<void> {
  const batchResults = await resolveBatchBusinessIds(external_ids);
  console.log(`[Business ID Resolver] Preloaded ${batchResults.size} business IDs into cache`);
}