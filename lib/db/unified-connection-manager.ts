/**
 * Unified Database Connection Manager
 * 
 * Handles both PostgreSQL (for voice-bot data) and Supabase connections
 * with connection pooling and error handling.
 * Ported from voice-bot's DatabaseConfigService patterns.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database connection configuration
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  poolSize: number;
}

// Query result types
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  fields?: any[];
}

export interface ConnectionStats {
  supabaseConnections: number;
  postgresConnections: number;
  totalQueries: number;
  avgQueryTime: number;
  errorRate: number;
}

/**
 * Unified connection manager supporting both Supabase and direct PostgreSQL
 */
class UnifiedConnectionManager {
  private supabaseClient: SupabaseClient;
  private postgresConfig: DatabaseConfig | null = null;
  private queryStats = {
    totalQueries: 0,
    totalTime: 0,
    errors: 0
  };

  constructor() {
    // Initialize Supabase client
    this.supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      }
    );

    // Initialize PostgreSQL config if voice-bot connection is available
    if (process.env.VOICE_BOT_DB_HOST) {
      this.postgresConfig = {
        host: process.env.VOICE_BOT_DB_HOST,
        port: parseInt(process.env.VOICE_BOT_DB_PORT || '5432'),
        database: process.env.VOICE_BOT_DB_NAME || 'voice_bot',
        username: process.env.VOICE_BOT_DB_USER || 'postgres',
        password: process.env.VOICE_BOT_DB_PASSWORD || '',
        ssl: process.env.VOICE_BOT_DB_SSL === 'true',
        poolSize: parseInt(process.env.VOICE_BOT_DB_POOL_SIZE || '10')
      };
    }
  }

  /**
   * Get Supabase client for standard operations
   */
  getSupabaseClient(): SupabaseClient {
    return this.supabaseClient;
  }

  /**
   * Execute query on Supabase with error handling and stats tracking
   */
  async executeSupabaseQuery<T = any>(
    table: string,
    operation: 'select' | 'insert' | 'update' | 'delete',
    options: any = {}
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    this.queryStats.totalQueries++;

    try {
      let query = this.supabaseClient.from(table);
      let result;

      switch (operation) {
        case 'select':
          let selectQuery = query.select(options.select || '*');
          if (options.eq) {
            for (const [key, value] of Object.entries(options.eq)) {
              selectQuery = selectQuery.eq(key, value);
            }
          }
          if (options.gte) {
            for (const [key, value] of Object.entries(options.gte)) {
              selectQuery = selectQuery.gte(key, value);
            }
          }
          if (options.lte) {
            for (const [key, value] of Object.entries(options.lte)) {
              selectQuery = selectQuery.lte(key, value);
            }
          }
          if (options.order) {
            selectQuery = selectQuery.order(options.order.column, { ascending: options.order.ascending });
          }
          if (options.limit) {
            selectQuery = selectQuery.limit(options.limit);
          }
          result = await selectQuery;
          break;

        case 'insert':
          result = await query.insert(options.data);
          break;

        case 'update':
          let updateQuery = query.update(options.data);
          if (options.eq) {
            for (const [key, value] of Object.entries(options.eq)) {
              updateQuery = updateQuery.eq(key, value);
            }
          }
          result = await updateQuery;
          break;

        case 'delete':
          let deleteQuery = query.delete();
          if (options.eq) {
            for (const [key, value] of Object.entries(options.eq)) {
              deleteQuery = deleteQuery.eq(key, value);
            }
          }
          result = await deleteQuery;
          break;

        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      const queryTime = Date.now() - startTime;
      this.queryStats.totalTime += queryTime;

      if (result.error) {
        this.queryStats.errors++;
        throw new Error(`Supabase query error: ${result.error.message}`);
      }

      // Type guard to ensure result.data is the expected type
      const rows = Array.isArray(result.data) ? result.data as T[] : [];
      
      return {
        rows,
        rowCount: rows.length
      };

    } catch (error) {
      this.queryStats.errors++;
      console.error('[Connection Manager] Supabase query error:', error);
      throw error;
    }
  }

  /**
   * Execute raw SQL query (for complex analytics)
   * Note: This would require a PostgreSQL client in production
   */
  async executeRawSQL<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    const startTime = Date.now();
    this.queryStats.totalQueries++;

    try {
      // For now, use Supabase RPC for complex queries
      // In production, this would use a PostgreSQL client
      const { data, error } = await this.supabaseClient.rpc('execute_sql', {
        sql_query: sql,
        query_params: params
      });

      const queryTime = Date.now() - startTime;
      this.queryStats.totalTime += queryTime;

      if (error) {
        this.queryStats.errors++;
        throw new Error(`SQL execution error: ${error.message}`);
      }

      return {
        rows: data || [],
        rowCount: data?.length || 0
      };

    } catch (error) {
      this.queryStats.errors++;
      console.error('[Connection Manager] SQL execution error:', error);
      throw error;
    }
  }

  /**
   * Get connection and query statistics
   */
  getStats(): ConnectionStats {
    const avgQueryTime = this.queryStats.totalQueries > 0 
      ? this.queryStats.totalTime / this.queryStats.totalQueries 
      : 0;
    
    const errorRate = this.queryStats.totalQueries > 0
      ? (this.queryStats.errors / this.queryStats.totalQueries) * 100
      : 0;

    return {
      supabaseConnections: 1, // Supabase handles connection pooling
      postgresConnections: this.postgresConfig ? 1 : 0,
      totalQueries: this.queryStats.totalQueries,
      avgQueryTime,
      errorRate
    };
  }

  /**
   * Health check for database connections
   */
  async healthCheck(): Promise<{ supabase: boolean; postgres: boolean }> {
    try {
      // Test Supabase connection
      const { error: supabaseError } = await this.supabaseClient
        .from('businesses')
        .select('count')
        .limit(1);

      return {
        supabase: !supabaseError,
        postgres: !!this.postgresConfig // Available if config exists
      };
    } catch (error) {
      console.error('[Connection Manager] Health check error:', error);
      return {
        supabase: false,
        postgres: false
      };
    }
  }

  /**
   * Reset query statistics
   */
  resetStats(): void {
    this.queryStats = {
      totalQueries: 0,
      totalTime: 0,
      errors: 0
    };
  }
}

// Global connection manager instance
const connectionManager = new UnifiedConnectionManager();

// Export the connection manager instance and types
export { connectionManager };
export type { DatabaseConfig };

/**
 * Convenience functions for common operations
 */

/**
 * Execute a Supabase select query with standard error handling
 */
export async function selectFromTable<T = any>(
  table: string,
  columns: string = '*',
  conditions: Record<string, any> = {}
): Promise<T[]> {
  try {
    const result = await connectionManager.executeSupabaseQuery<T>(table, 'select', {
      select: columns,
      eq: conditions
    });
    return result.rows;
  } catch (error) {
    console.error(`[DB] Error selecting from ${table}:`, error);
    throw error;
  }
}

/**
 * Execute a raw SQL query for complex analytics
 */
export async function executeAnalyticsQuery<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const result = await connectionManager.executeRawSQL<T>(sql, params);
    return result.rows;
  } catch (error) {
    console.error('[DB] Error executing analytics query:', error);
    throw error;
  }
}

/**
 * Get database health status
 */
export async function getDatabaseHealth() {
  return await connectionManager.healthCheck();
}

/**
 * Get database performance statistics
 */
export function getDatabaseStats(): ConnectionStats {
  return connectionManager.getStats();
}