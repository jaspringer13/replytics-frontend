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
 */
export const config = {
  env: require('./environment').env,
  api: require('./api'),
  features: require('./features').features,
  limits: require('./limits').LIMITS,
  ui: require('./ui').UI_CONFIG,
} as const;