/**
 * Advanced Database Connection Pool Management
 * Implements optimized connection pooling patterns from voice-bot backend
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/config';

interface ConnectionConfig {
  maxConnections: number;
  minConnections: number;
  idleTimeout: number;
  connectionTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

interface PoolMetrics {
  activeConnections: number;
  idleConnections: number;
  queuedRequests: number;
  totalConnections: number;
  avgResponseTime: number;
  errorRate: number;
}

interface ConnectionPoolOptions {
  config?: Partial<ConnectionConfig>;
  enableMetrics?: boolean;
  enableHealthChecks?: boolean;
}

class DatabaseConnectionPool {
  private readonly config: ConnectionConfig;
  private readonly connections: Map<string, SupabaseClient> = new Map();
  private readonly connectionUsage: Map<string, number> = new Map();
  private readonly connectionQueue: Array<{
    resolve: (client: SupabaseClient) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];
  
  private metrics: PoolMetrics = {
    activeConnections: 0,
    idleConnections: 0,
    queuedRequests: 0,
    totalConnections: 0,
    avgResponseTime: 0,
    errorRate: 0
  };

  private healthCheckInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private readonly enableMetrics: boolean;
  private readonly enableHealthChecks: boolean;

  constructor(options: ConnectionPoolOptions = {}) {
    this.config = {
      maxConnections: 20,
      minConnections: 5,
      idleTimeout: 30000, // 30 seconds
      connectionTimeout: 10000, // 10 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      ...options.config
    };

    this.enableMetrics = options.enableMetrics ?? true;
    this.enableHealthChecks = options.enableHealthChecks ?? true;

    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Pre-warm minimum connections
    await this.warmupConnections();

    if (this.enableHealthChecks) {
      this.startHealthChecks();
    }

    if (this.enableMetrics) {
      this.startMetricsCollection();
    }
  }

  private async warmupConnections(): Promise<void> {
    const warmupPromises: Promise<void>[] = [];

    for (let i = 0; i < this.config.minConnections; i++) {
      warmupPromises.push(this.createConnection(`warmup-${i}`));
    }

    await Promise.allSettled(warmupPromises);
    console.log(`Database pool warmed up with ${this.connections.size} connections`);
  }

  private async createConnection(connectionId: string): Promise<void> {
    try {
      const supabaseUrl = env.get('SUPABASE_URL');
      const supabaseKey = env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing required Supabase environment variables');
      }

      const client = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        realtime: {
          params: {
            eventsPerSecond: 20
          }
        },
        db: {
          schema: 'public'
        }
      });

      // Test connection
      const { error } = await client.from('businesses').select('id').limit(1);
      if (error && !error.message.includes('permission denied')) {
        throw error;
      }

      this.connections.set(connectionId, client);
      this.connectionUsage.set(connectionId, 0);
      this.metrics.totalConnections++;
      this.metrics.idleConnections++;

    } catch (error) {
      console.error(`Failed to create connection ${connectionId}:`, error);
      throw error;
    }
  }

  public async getConnection(): Promise<SupabaseClient> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeout);

      this.acquireConnection()
        .then((client) => {
          clearTimeout(timeout);
          resolve(client);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  private async acquireConnection(): Promise<SupabaseClient> {
    // Find available idle connection
    for (const [connectionId, client] of Array.from(this.connections.entries())) {
      const usage = this.connectionUsage.get(connectionId) || 0;
      if (usage === 0) {
        this.connectionUsage.set(connectionId, 1);
        this.metrics.activeConnections++;
        this.metrics.idleConnections--;
        return client;
      }
    }

    // Create new connection if under limit
    if (this.connections.size < this.config.maxConnections) {
      const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await this.createConnection(connectionId);
      const client = this.connections.get(connectionId)!;
      this.connectionUsage.set(connectionId, 1);
      this.metrics.activeConnections++;
      this.metrics.idleConnections--;
      return client;
    }

    // Queue request if at max capacity
    return new Promise((resolve, reject) => {
      this.connectionQueue.push({
        resolve,
        reject,
        timestamp: Date.now()
      });
      this.metrics.queuedRequests++;
    });
  }

  public releaseConnection(client: SupabaseClient): void {
    for (const [connectionId, poolClient] of Array.from(this.connections.entries())) {
      if (poolClient === client) {
        this.connectionUsage.set(connectionId, 0);
        this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
        this.metrics.idleConnections++;

        // Process queued requests
        const queued = this.connectionQueue.shift();
        if (queued) {
          this.connectionUsage.set(connectionId, 1);
          this.metrics.activeConnections++;
          this.metrics.idleConnections--;
          this.metrics.queuedRequests = Math.max(0, this.metrics.queuedRequests - 1);
          queued.resolve(client);
        }
        break;
      }
    }
  }

  public async executeWithConnection<T>(
    operation: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let client: SupabaseClient | null = null;

    try {
      client = await this.getConnection();
      const result = await operation(client);
      
      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateResponseTimeMetrics(responseTime);
      
      return result;
    } catch (error) {
      this.metrics.errorRate++;
      throw error;
    } finally {
      if (client) {
        this.releaseConnection(client);
      }
    }
  }

  private updateResponseTimeMetrics(responseTime: number): void {
    // Simple moving average for response time
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * 0.9) + (responseTime * 0.1);
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Every 30 seconds
  }

  private async performHealthCheck(): Promise<void> {
    const unhealthyConnections: string[] = [];

    for (const [connectionId, client] of Array.from(this.connections.entries())) {
      try {
        const { error } = await client.from('businesses').select('id').limit(1);
        if (error && !error.message.includes('permission denied')) {
          unhealthyConnections.push(connectionId);
        }
      } catch (error) {
        unhealthyConnections.push(connectionId);
      }
    }

    // Remove and recreate unhealthy connections
    for (const connectionId of unhealthyConnections) {
      this.connections.delete(connectionId);
      this.connectionUsage.delete(connectionId);
      this.metrics.totalConnections--;
      
      try {
        await this.createConnection(connectionId);
      } catch (error) {
        console.error(`Failed to recreate connection ${connectionId}:`, error);
      }
    }
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.logMetrics();
    }, 60000); // Every minute
  }

  private logMetrics(): void {
    console.log('Database Pool Metrics:', {
      ...this.metrics,
      poolEfficiency: this.calculatePoolEfficiency(),
      timestamp: new Date().toISOString()
    });
  }

  private calculatePoolEfficiency(): number {
    const totalCapacity = this.config.maxConnections;
    const utilizationRate = this.metrics.activeConnections / totalCapacity;
    const queuePressure = this.metrics.queuedRequests / totalCapacity;
    
    return Math.max(0, Math.min(100, (utilizationRate * 100) - (queuePressure * 20)));
  }

  public getMetrics(): PoolMetrics {
    return { ...this.metrics };
  }

  public async close(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Clear connections
    this.connections.clear();
    this.connectionUsage.clear();
    
    // Reject queued requests
    while (this.connectionQueue.length > 0) {
      const queued = this.connectionQueue.shift();
      if (queued) {
        queued.reject(new Error('Connection pool closed'));
      }
    }
  }
}

// Singleton instance
let globalPool: DatabaseConnectionPool | null = null;

export function getConnectionPool(): DatabaseConnectionPool {
  if (!globalPool) {
    globalPool = new DatabaseConnectionPool({
      config: {
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
        minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '5'),
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000')
      },
      enableMetrics: process.env.NODE_ENV !== 'test',
      enableHealthChecks: process.env.NODE_ENV === 'production'
    });
  }
  return globalPool;
}

export async function closeConnectionPool(): Promise<void> {
  if (globalPool) {
    await globalPool.close();
    globalPool = null;
  }
}

// Export types for use in other modules
export type { ConnectionConfig, PoolMetrics, ConnectionPoolOptions };
export { DatabaseConnectionPool };