/**
 * Application-wide constants
 */

// AI Confidence Thresholds
export const AI_CONFIDENCE = {
  LOW_THRESHOLD: 70,
  MEDIUM_THRESHOLD: 85,
  HIGH_THRESHOLD: 95,
} as const

// Message Display Constants
export const MESSAGE_LIMITS = {
  CONVERSATION_PREVIEW_LENGTH: 100,
  MAX_CONVERSATION_HISTORY: 1000,
} as const

// Time Constants
export const TIME_INTERVALS = {
  REAL_TIME_UPDATE_MS: 30000, // 30 seconds
  AUTO_REFRESH_MS: 60000, // 1 minute
  SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
} as const

// UI Constants
export const UI_CONFIG = {
  TOAST_DURATION_MS: 5000,
  DEBOUNCE_DELAY_MS: 300,
  ANIMATION_DURATION_MS: 200,
} as const