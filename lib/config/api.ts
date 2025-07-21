/**
 * Centralized API configuration
 * All API endpoints and route patterns should be defined here
 */

import { env } from './environment';

export const API_ROUTES = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    SESSION: '/api/auth/session',
    PROVIDERS: '/api/auth/providers',
  },
  
  // Dashboard V1 (legacy)
  DASHBOARD_V1: {
    OVERVIEW: '/api/dashboard/overview',
    ANALYTICS: '/api/dashboard/analytics',
    CUSTOMERS: '/api/dashboard/customers',
    MESSAGES: '/api/dashboard/messages',
    APPOINTMENTS: '/api/dashboard/appointments',
  },
  
  // Dashboard V2
  DASHBOARD_V2: {
    BASE: '/api/v2/dashboard',
    
    // Analytics
    ANALYTICS: {
      OVERVIEW: '/api/v2/dashboard/analytics/overview',
    },
    
    // Business
    BUSINESS: {
      PROFILE: '/api/v2/dashboard/business/profile',
      VOICE_SETTINGS: '/api/v2/dashboard/business/voice-settings',
      VOICE_AUDIO: (audioId: string) => `/api/v2/dashboard/business/voice-settings/audio/${audioId}`,
      CONVERSATION_RULES: '/api/v2/dashboard/business/conversation-rules',
    },
    
    // Services
    SERVICES: {
      LIST: '/api/v2/dashboard/services',
      DETAIL: (id: string) => `/api/v2/dashboard/services/${id}`,
      REORDER: '/api/v2/dashboard/services/reorder',
    },
    
    // Hours
    HOURS: '/api/v2/dashboard/hours',
    
    // Customers
    CUSTOMERS: {
      LIST: '/api/v2/dashboard/customers',
      SEGMENTS: '/api/v2/dashboard/customers/segments/counts',
    },
  },
  
  // Performance
  PERFORMANCE: '/api/performance',
} as const;

export const EXTERNAL_APIS = {
  ELEVENLABS: {
    BASE_URL: 'https://api.elevenlabs.io/v1',
    TEXT_TO_SPEECH: (voiceId: string) => `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    VOICES: 'https://api.elevenlabs.io/v1/voices',
  },
  
  VOICE_BOT: {
    BASE_URL: 'https://replytics-dhhf.onrender.com',
    STATUS: '/status',
    CALLS: '/api/calls',
  },
} as const;

export const API_CONFIG = {
  // Request configuration
  REQUEST: {
    TIMEOUT: 30000, // 30 seconds
    RETRY_COUNT: 3,
    RETRY_DELAY_BASE: 1000, // 1 second base for exponential backoff
  },
  
  // Headers
  HEADERS: {
    TENANT_ID: 'X-Tenant-ID',
    API_KEY: 'X-API-Key',
    AUTHORIZATION: 'Authorization',
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    DEFAULT_PAGE: 1,
  },
  
  // Rate limiting
  RATE_LIMITS: {
    PER_MINUTE: 60,
    PER_HOUR: 1000,
    BURST: 10,
  },
} as const;

/**
 * Get the full backend API URL for a given path
 */
export function getBackendUrl(path: string): string {
  const backendUrl = env.get('BACKEND_API_URL');
  return `${backendUrl}${path}`;
}

/**
 * Check if a URL is an external API
 */
export function isExternalApi(url: string): boolean {
  const backendUrl = env.get('BACKEND_API_URL');
  return !url.startsWith('/api/') && !url.startsWith(backendUrl);
}