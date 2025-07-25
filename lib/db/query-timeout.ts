/**
 * Query Timeout and Cancellation System
 * Implements graceful query timeouts and resource cleanup
 */

interface TimeoutOptions {
  timeoutMs: number;
  abortSignal?: AbortSignal;
  onTimeout?: () => void;
  onCancel?: () => void;
}

interface ActiveQuery {
  id: string;
  startTime: number;
  timeoutMs: number;
  abortController: AbortController;
  cleanup: () => void;
}

class QueryTimeoutManager {
  private activeQueries = new Map<string, ActiveQuery>();
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    this.startCleanupProcess();
  }

  /**
   * Execute a query with timeout and cancellation support
   */
  public async executeWithTimeout<T>(
    queryId: string,
    queryFn: (signal: AbortSignal) => Promise<T>,
    options: TimeoutOptions
  ): Promise<T> {
    const abortController = new AbortController();
    const startTime = Date.now();

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        abortController.abort();
        options.onTimeout?.();
        reject(new Error(`Query ${queryId} timed out after ${options.timeoutMs}ms`));
      }, options.timeoutMs);

      // Clean up timeout if query completes
      abortController.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
      });
    });

    // Track active query
    const activeQuery: ActiveQuery = {
      id: queryId,
      startTime,
      timeoutMs: options.timeoutMs,
      abortController,
      cleanup: () => {
        abortController.abort();
        options.onCancel?.();
      }
    };

    this.activeQueries.set(queryId, activeQuery);

    try {
      // Race between query execution and timeout
      const result = await Promise.race([
        queryFn(abortController.signal),
        timeoutPromise
      ]);

      return result;
    } finally {
      // Clean up
      this.activeQueries.delete(queryId);
    }
  }

  /**
   * Cancel a specific query by ID
   */
  public cancelQuery(queryId: string): boolean {
    const activeQuery = this.activeQueries.get(queryId);
    if (activeQuery) {
      activeQuery.cleanup();
      this.activeQueries.delete(queryId);
      return true;
    }
    return false;
  }

  /**
   * Cancel all queries for a specific tenant
   */
  public cancelTenantQueries(tenantId: string): number {
    let cancelledCount = 0;
    
    for (const [queryId, activeQuery] of Array.from(this.activeQueries.entries())) {
      if (queryId.includes(tenantId)) {
        activeQuery.cleanup();
        this.activeQueries.delete(queryId);
        cancelledCount++;
      }
    }

    return cancelledCount;
  }

  /**
   * Cancel all active queries
   */
  public cancelAllQueries(): number {
    const cancelledCount = this.activeQueries.size;
    
    for (const [queryId, activeQuery] of Array.from(this.activeQueries.entries())) {
      activeQuery.cleanup();
    }
    
    this.activeQueries.clear();
    return cancelledCount;
  }

  /**
   * Get statistics about active queries
   */
  public getActiveQueryStats(): {
    totalActive: number;
    averageRunTime: number;
    longestRunning: { id: string; runtime: number } | null;
    timeoutRisk: number;
  } {
    const now = Date.now();
    const activeQueries = Array.from(this.activeQueries.values());

    if (activeQueries.length === 0) {
      return {
        totalActive: 0,
        averageRunTime: 0,
        longestRunning: null,
        timeoutRisk: 0
      };
    }

    const runtimes = activeQueries.map(q => now - q.startTime);
    const averageRunTime = runtimes.reduce((sum, time) => sum + time, 0) / runtimes.length;

    const longestQuery = activeQueries.reduce((longest, current) => {
      const currentRuntime = now - current.startTime;
      const longestRuntime = now - longest.startTime;
      return currentRuntime > longestRuntime ? current : longest;
    });

    const longestRuntime = now - longestQuery.startTime;

    // Calculate timeout risk (queries running close to their timeout)
    const timeoutRiskQueries = activeQueries.filter(q => {
      const runtime = now - q.startTime;
      const timeoutThreshold = q.timeoutMs * 0.8; // 80% of timeout time
      return runtime > timeoutThreshold;
    });

    return {
      totalActive: activeQueries.length,
      averageRunTime: Math.round(averageRunTime),
      longestRunning: {
        id: longestQuery.id,
        runtime: longestRuntime
      },
      timeoutRisk: (timeoutRiskQueries.length / activeQueries.length) * 100
    };
  }

  /**
   * Start periodic cleanup of stale queries
   */
  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleQueries();
    }, 30000); // Every 30 seconds
  }

  /**
   * Clean up queries that have exceeded reasonable limits
   */
  private cleanupStaleQueries(): void {
    const now = Date.now();
    const staleQueries: string[] = [];

    for (const [queryId, activeQuery] of Array.from(this.activeQueries.entries())) {
      const runtime = now - activeQuery.startTime;
      
      // Clean up queries that have been running for more than double their timeout
      if (runtime > activeQuery.timeoutMs * 2) {
        staleQueries.push(queryId);
      }
    }

    staleQueries.forEach(queryId => {
      const activeQuery = this.activeQueries.get(queryId);
      if (activeQuery) {
        console.warn(`Cleaning up stale query: ${queryId} (runtime: ${now - activeQuery.startTime}ms)`);
        activeQuery.cleanup();
        this.activeQueries.delete(queryId);
      }
    });

    if (staleQueries.length > 0) {
      console.log(`Cleaned up ${staleQueries.length} stale queries`);
    }
  }

  /**
   * Shutdown the timeout manager
   */
  public shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Cancel all active queries
    this.cancelAllQueries();
  }
}

// Utility functions for common timeout scenarios

/**
 * Execute database query with timeout
 */
export async function executeQueryWithTimeout<T>(
  queryId: string,
  queryFn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  const manager = getQueryTimeoutManager();
  
  return manager.executeWithTimeout(queryId, queryFn, {
    timeoutMs,
    onTimeout: () => {
      console.warn(`Query timeout: ${queryId} exceeded ${timeoutMs}ms`);
    },
    onCancel: () => {
      console.log(`Query cancelled: ${queryId}`);
    }
  });
}

/**
 * Execute analytics query with extended timeout
 */
export async function executeAnalyticsQueryWithTimeout<T>(
  queryId: string,
  queryFn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  const manager = getQueryTimeoutManager();
  
  return manager.executeWithTimeout(queryId, queryFn, {
    timeoutMs,
    onTimeout: () => {
      console.error(`Analytics query timeout: ${queryId} exceeded ${timeoutMs}ms`);
    }
  });
}

/**
 * Execute batch query with very long timeout
 */
export async function executeBatchQueryWithTimeout<T>(
  queryId: string,
  queryFn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = 60000
): Promise<T> {
  const manager = getQueryTimeoutManager();
  
  return manager.executeWithTimeout(queryId, queryFn, {
    timeoutMs,
    onTimeout: () => {
      console.error(`Batch query timeout: ${queryId} exceeded ${timeoutMs}ms`);
    }
  });
}

/**
 * Create timeout-aware Supabase query wrapper
 */
export function createTimeoutAwareQuery<T>(
  queryBuilder: any,
  queryId: string,
  timeoutMs: number = 10000
): Promise<T> {
  return executeQueryWithTimeout(
    queryId,
    async (signal: AbortSignal) => {
      // Create a promise that rejects when the signal is aborted
      const abortPromise = new Promise((_, reject) => {
        signal.addEventListener('abort', () => {
          reject(new Error(`Query ${queryId} was cancelled`));
        });
      });

      // Race the query against the abort signal
      const queryPromise = queryBuilder;
      
      const result = await Promise.race([queryPromise, abortPromise]);
      
      if (result.error) {
        throw new Error(`Database error in ${queryId}: ${result.error.message}`);
      }
      
      return result.data;
    },
    timeoutMs
  );
}

// Singleton instance
let queryTimeoutManager: QueryTimeoutManager | null = null;

export function getQueryTimeoutManager(): QueryTimeoutManager {
  if (!queryTimeoutManager) {
    queryTimeoutManager = new QueryTimeoutManager();
  }
  return queryTimeoutManager;
}

export function shutdownQueryTimeoutManager(): void {
  if (queryTimeoutManager) {
    queryTimeoutManager.shutdown();
    queryTimeoutManager = null;
  }
}

// Export types and classes
export type { TimeoutOptions, ActiveQuery };
export { QueryTimeoutManager };