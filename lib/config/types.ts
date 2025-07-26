/**
 * Configuration type definitions
 */

export type EnvironmentType = 'development' | 'production' | 'test';

export interface ConfigurationError extends Error {
  code: 'MISSING_ENV_VAR' | 'INVALID_CONFIG' | 'VALIDATION_ERROR';
  details?: Record<string, unknown>;
}