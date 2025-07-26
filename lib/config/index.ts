/**
 * Central configuration module
 * Re-exports all configuration modules for easy access
 */

// Environment configuration
export * from './environment';

// API configuration
export * from './api';

// Feature flags
export * from './features';

// Limits and constraints
export * from './limits';

// UI configuration
export * from './ui';

// Configuration validation
export { validateConfig } from './validation';

// Type exports
export type { EnvironmentType } from './types';

/**
 * Main configuration object for convenient access
 * Note: Using dynamic imports to avoid initialization at build time
 */
import { env } from './environment';
import * as apiConfig from './api';
import { features } from './features';
import { LIMITS } from './limits';
import { UI_CONFIG } from './ui';

export const config = {
  env,
  api: apiConfig,
  features,
  limits: LIMITS,
  ui: UI_CONFIG,
} as const;