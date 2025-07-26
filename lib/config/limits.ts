/**
 * Centralized limits and constraints configuration
 * All rate limits, timeouts, and size constraints
 */

export const LIMITS = {
  // Time intervals (milliseconds)
  TIME: {
    REAL_TIME_UPDATE_MS: 30000, // 30 seconds
    AUTO_REFRESH_MS: 60000, // 1 minute
    SESSION_TIMEOUT_MS: 1800000, // 30 minutes
    DEBOUNCE_DELAY_MS: 300,
    THROTTLE_DELAY_MS: 1000,
    ANIMATION_DURATION_MS: 200,
    TOAST_DURATION_MS: 5000,
    WEBSOCKET_RECONNECT_DELAY_MS: 1000,
    WEBSOCKET_MAX_RECONNECT_DELAY_MS: 30000,
  },
  
  // API rate limits
  RATE_LIMITS: {
    SMS: {
      PER_HOUR: 100,
      PER_5MIN_BURST: 10,
    },
    API_CALLS: {
      PER_MINUTE: 60,
      PER_HOUR: 1000,
    },
    VOICE_SYNTHESIS: {
      PER_MINUTE: 10,
      PER_HOUR: 100,
    },
  },
  
  // Size limits
  SIZE: {
    MAX_FILE_SIZE_MB: 10,
    MAX_IMAGE_SIZE_MB: 5,
    MAX_AUDIO_SIZE_MB: 20,
    MAX_MESSAGE_LENGTH: 1000,
    MAX_CONVERSATION_HISTORY: 1000,
    MAX_CHAT_MESSAGES: 100,
    CONVERSATION_PREVIEW_LENGTH: 100,
    MAX_PERFORMANCE_METRICS: 1000,
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    CUSTOMERS_PAGE_SIZE: 25,
    MESSAGES_PAGE_SIZE: 50,
    ANALYTICS_PAGE_SIZE: 30,
  },
  
  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY_MS: 1000,
    MAX_DELAY_MS: 10000,
    BACKOFF_MULTIPLIER: 2,
    WEBSOCKET_MAX_RECONNECT_ATTEMPTS: 5,
  },
  
  // Validation limits
  VALIDATION: {
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 128,
    MIN_USERNAME_LENGTH: 3,
    MAX_USERNAME_LENGTH: 50,
    MAX_EMAIL_LENGTH: 255,
    MAX_PHONE_LENGTH: 20,
    MAX_BUSINESS_NAME_LENGTH: 100,
    MAX_SERVICE_NAME_LENGTH: 50,
    MAX_SERVICE_DESCRIPTION_LENGTH: 500,
  },
  
  // Voice settings
  VOICE: {
    MIN_SPEED: 0.5,
    MAX_SPEED: 2.0,
    DEFAULT_SPEED: 1.0,
    MIN_PITCH: 0.5,
    MAX_PITCH: 2.0,
    DEFAULT_PITCH: 1.0,
    WORDS_PER_MINUTE: 150, // Average speaking rate
    MAX_SYNTHESIS_LENGTH: 5000, // Characters
  },
  
  // Analytics
  ANALYTICS: {
    MAX_DATE_RANGE_DAYS: 365,
    DEFAULT_DATE_RANGE_DAYS: 30,
    MAX_CHART_DATA_POINTS: 1000,
    TOP_SERVICES_LIMIT: 10,
    POPULAR_TIMES_BUCKETS: 24, // Hours in a day
  },
  
  // AI/ML thresholds
  AI: {
    CONFIDENCE: {
      LOW_THRESHOLD: 70,
      MEDIUM_THRESHOLD: 85,
      HIGH_THRESHOLD: 95,
    },
    MAX_INSIGHTS_PER_PAGE: 5,
    MIN_DATA_POINTS_FOR_INSIGHTS: 10,
  },
  
  // Cache TTL (seconds)
  CACHE: {
    USER_PROFILE_TTL: 300, // 5 minutes
    BUSINESS_SETTINGS_TTL: 600, // 10 minutes
    ANALYTICS_TTL: 60, // 1 minute
    VOICE_SYNTHESIS_TTL: 3600, // 1 hour
    STATIC_ASSETS_TTL: 86400, // 24 hours
  },
} as const;

// Helper functions
export const getLimit = (path: string): number => {
  const keys = path.split('.');
  let value: any = LIMITS;
  
  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      throw new Error(`Limit not found: ${path}`);
    }
  }
  
  return value as number;
};

export const isWithinLimit = (value: number, limitPath: string): boolean => {
  const limit = getLimit(limitPath);
  return value <= limit;
};

export const getRateLimitHeaders = (limitPath: string, used: number, resetTime: Date) => {
  const limit = getLimit(limitPath);
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': Math.max(0, limit - used).toString(),
    'X-RateLimit-Reset': Math.floor(resetTime.getTime() / 1000).toString(),
  };
};