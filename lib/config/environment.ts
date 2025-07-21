/**
 * Centralized environment configuration
 * All environment variables should be accessed through this module
 */

type EnvironmentType = 'development' | 'production' | 'test';

export interface EnvironmentConfig {
  // Environment type
  NODE_ENV: EnvironmentType;
  IS_PRODUCTION: boolean;
  IS_DEVELOPMENT: boolean;
  
  // Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  
  // Backend API
  BACKEND_API_URL: string;
  
  // Authentication
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;
  
  // External Services
  ELEVENLABS_API_KEY?: string;
  
  // Performance
  QUERY_STALE_TIME: number;
  QUERY_GC_TIME: number;
  PERFORMANCE_METRICS_TIMEOUT: number;
  MAX_PERFORMANCE_METRICS: number;
  
  // Voice Agent
  DEFAULT_VOICE_ID?: string;
}

class Environment {
  private static instance: Environment;
  private config: EnvironmentConfig | null = null;

  private constructor() {
    // Delay initialization until first access
  }

  static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }
    return Environment.instance;
  }

  private ensureInitialized() {
    if (!this.config) {
      this.config = this.loadConfig();
      this.validateConfig();
    }
  }

  private loadConfig(): EnvironmentConfig {
    const nodeEnv = (process.env.NODE_ENV || 'development') as EnvironmentType;
    
    return {
      // Environment
      NODE_ENV: nodeEnv,
      IS_PRODUCTION: nodeEnv === 'production',
      IS_DEVELOPMENT: nodeEnv === 'development',
      
      // Supabase
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      
      // Backend API
      BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:10000',
      
      // Authentication
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
      
      // External Services
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
      
      // Performance
      QUERY_STALE_TIME: parseInt(process.env.NEXT_PUBLIC_QUERY_STALE_TIME || '300000', 10),
      QUERY_GC_TIME: parseInt(process.env.NEXT_PUBLIC_QUERY_GC_TIME || '600000', 10),
      PERFORMANCE_METRICS_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_PERFORMANCE_METRICS_TIMEOUT || '5000', 10),
      MAX_PERFORMANCE_METRICS: parseInt(process.env.MAX_PERFORMANCE_METRICS || '1000', 10),
      
      // Voice Agent
      DEFAULT_VOICE_ID: process.env.DEFAULT_VOICE_ID,
    };
  }

  private validateConfig() {
    if (!this.config) return;
    
    const required = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'BACKEND_API_URL',
    ];

    const missing = required.filter(key => !this.config![key as keyof EnvironmentConfig]);
    
    // Skip validation during build process
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || process.env.CI;
    
    if (missing.length > 0 && this.config.IS_PRODUCTION && !isBuildTime) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    if (missing.length > 0 && !isBuildTime) {
      console.warn(`Missing environment variables: ${missing.join(', ')}`);
    }
  }

  get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    this.ensureInitialized();
    return this.config![key];
  }

  getAll(): EnvironmentConfig {
    this.ensureInitialized();
    return { ...this.config! };
  }
}

// Export singleton instance
export const env = Environment.getInstance();

// Export convenience getters
export const getEnv = <K extends keyof EnvironmentConfig>(key: K) => env.get(key);
export const isProduction = () => env.get('IS_PRODUCTION');
export const isDevelopment = () => env.get('IS_DEVELOPMENT');