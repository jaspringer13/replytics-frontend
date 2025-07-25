// Global type definitions for Replytics Website

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY: string;
      NEXTAUTH_URL: string;
      NEXTAUTH_SECRET: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      BUILD_STANDALONE?: string;
      ANALYZE?: string;
      CUSTOM_KEY?: string;
    }
  }

  // Window object extensions
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }

  // Module declarations for untyped packages
  declare module '*.svg' {
    const content: any;
    export default content;
  }

  declare module '*.png' {
    const content: string;
    export default content;
  }

  declare module '*.jpg' {
    const content: string;
    export default content;
  }

  declare module '*.jpeg' {
    const content: string;
    export default content;
  }

  declare module '*.webp' {
    const content: string;
    export default content;
  }

  // Performance API extensions
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

// Common utility types
export type NonEmptyArray<T> = [T, ...T[]];

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>;

// Database common types
export type DatabaseRow = {
  id: string;
  created_at: string;
  updated_at: string;
};

// Supabase extensions
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Business context types
export type BusinessContext = {
  uuid: string;
  external_id: string;
  tenant_id: string;
  name: string;
  active: boolean;
};

// Export empty object to make this a module
export {};