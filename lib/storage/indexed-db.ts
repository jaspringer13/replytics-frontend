import Dexie, { type Table } from 'dexie';

export interface HistoricalDataPoint<T = unknown> {
  id?: number;
  timestamp: Date;
  type: 'stats' | 'calls' | 'sms' | 'bookings';
  data: T;
  metadata?: {
    source?: string;
    version?: number;
  };
}

export interface CachedQuery<T = unknown> {
  id?: number;
  key: string;
  data: T;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
  metadata?: Record<string, unknown>;
}

export interface PerformanceMetric {
  id?: number;
  timestamp: Date;
  name: string;
  value: number;
  rating?: string;
  metadata?: Record<string, unknown>;
}

export class ReplyticsDB extends Dexie {
  // Declare tables
  historicalData!: Table<HistoricalDataPoint>;
  cachedQueries!: Table<CachedQuery>;
  performanceMetrics!: Table<PerformanceMetric>;
  
  private lastCleanup?: Date;
  private readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    super('ReplyticsDB');
    
    // Define database schema
    this.version(1).stores({
      historicalData: '++id, timestamp, type, [type+timestamp]',
      cachedQueries: '++id, key, timestamp',
      performanceMetrics: '++id, timestamp, name, [name+timestamp]',
    });

    // Add hooks for cleanup
    this.on('ready', () => {
      const now = new Date();
      if (!this.lastCleanup || now.getTime() - this.lastCleanup.getTime() > this.CLEANUP_INTERVAL) {
        this.cleanupOldData().catch(error => {
          console.error('Failed to cleanup old data:', error);
        });
        this.lastCleanup = now;
      }
    });
  }

  /**
   * Clean up data older than specified retention periods
   */
  async cleanupOldData() {
    const now = new Date();
    
    // Clean up historical data older than 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    await this.historicalData.where('timestamp').below(thirtyDaysAgo).delete();
    
    // Clean up expired cached queries
    await this.cachedQueries.toArray().then(queries => {
      const expiredIds = queries
        .filter(q => now.getTime() - q.timestamp.getTime() > q.ttl)
        .map(q => q.id!)
        .filter(id => id !== undefined);
      
      if (expiredIds.length > 0) {
        return this.cachedQueries.bulkDelete(expiredIds);
      }
    });
    
    // Clean up performance metrics older than 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    await this.performanceMetrics.where('timestamp').below(sevenDaysAgo).delete();
  }

  /**
   * Store historical data point
   */
  async storeHistoricalData<T = unknown>(
    type: HistoricalDataPoint<T>['type'], 
    data: T,
    metadata?: HistoricalDataPoint<T>['metadata']
  ): Promise<number> {
    return this.historicalData.add({
      timestamp: new Date(),
      type,
      data,
      metadata,
    });
  }

  /**
   * Get historical data for a specific type within a date range
   */
  async getHistoricalData(
    type: HistoricalDataPoint['type'],
    startDate: Date,
    endDate: Date
  ): Promise<HistoricalDataPoint[]> {
    return this.historicalData
      .where('[type+timestamp]')
      .between([type, startDate], [type, endDate])
      .toArray();
  }

  /**
   * Cache a query result
   */
  async cacheQuery<T = unknown>(
    key: string,
    data: T,
    ttl: number = 5 * 60 * 1000, // Default 5 minutes
    metadata?: Record<string, unknown>
  ): Promise<number> {
    // Use put() with a key-based approach for atomic upsert
    const existing = await this.cachedQueries.where('key').equals(key).first();
    const entry = {
      id: existing?.id,
      key,
      data,
      timestamp: new Date(),
      ttl,
      metadata,
    };
    
    return existing?.id 
      ? this.cachedQueries.put(entry)
      : this.cachedQueries.add(entry);
  }

  /**
   * Get cached query result if not expired
   */
  async getCachedQuery(key: string): Promise<CachedQuery | null> {
    const cached = await this.cachedQueries.where('key').equals(key).first();
    
    if (!cached) {
      return null;
    }
    
    const now = new Date();
    const age = now.getTime() - cached.timestamp.getTime();
    
    if (age > cached.ttl) {
      // Cache expired, delete it
      await this.cachedQueries.delete(cached.id!);
      return null;
    }
    
    return cached;
  }

  /**
   * Store a performance metric
   */
  async storePerformanceMetric(
    name: string,
    value: number,
    rating?: string,
    metadata?: Record<string, any>
  ): Promise<number> {
    return this.performanceMetrics.add({
      timestamp: new Date(),
      name,
      value,
      rating,
      metadata,
    });
  }

  /**
   * Get performance metrics within a date range
   */
  async getPerformanceMetrics(
    name?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<PerformanceMetric[]> {
    let query = this.performanceMetrics.toCollection();
    
    if (name && startDate && endDate) {
      query = this.performanceMetrics
        .where('[name+timestamp]')
        .between([name, startDate], [name, endDate]);
    } else if (startDate && endDate) {
      query = this.performanceMetrics
        .where('timestamp')
        .between(startDate, endDate);
    }
    
    return query.toArray();
  }

  /**
   * Get aggregated performance statistics
   */
  async getPerformanceStats(
    name: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    count: number;
    average: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
  } | null> {
    const metrics = await this.getPerformanceMetrics(name, startDate, endDate);
    
    if (metrics.length === 0) {
      return null;
    }
    
    const values = metrics.map(m => m.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    
    const getPercentile = (arr: number[], p: number): number => {
      if (arr.length === 0) return 0;
      const index = (arr.length - 1) * p;
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index % 1;
      
      if (upper >= arr.length) return arr[arr.length - 1];
      return arr[lower] * (1 - weight) + arr[upper] * weight;
    };
    
    return {
      count: values.length,
      average: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      p50: getPercentile(values, 0.5),
      p95: getPercentile(values, 0.95),
    };
  }

  /**
   * Clear all data (useful for testing or logout)
   */
  async clearAllData() {
    await this.historicalData.clear();
    await this.cachedQueries.clear();
    await this.performanceMetrics.clear();
  }
}

// Create and export a singleton instance
export const db = new ReplyticsDB();

// Export types
export type { Table } from 'dexie';