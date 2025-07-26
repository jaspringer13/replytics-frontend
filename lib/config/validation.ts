/**
 * Configuration validation
 * Ensures all required configuration is present and valid
 */

import { env, EnvironmentConfig } from './environment';
import { LIMITS } from './limits';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateConfig(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate environment variables
  validateEnvironment(errors, warnings);
  
  // Validate limits
  validateLimits(errors, warnings);
  
  // Validate feature compatibility
  validateFeatures(errors, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateEnvironment(errors: string[], warnings: string[]) {
  // Required in production
  const requiredInProd = [
    { key: 'SUPABASE_URL', name: 'Supabase URL' },
    { key: 'SUPABASE_ANON_KEY', name: 'Supabase Anonymous Key' },
    { key: 'BACKEND_API_URL', name: 'Backend API URL' },
    { key: 'NEXTAUTH_SECRET', name: 'NextAuth Secret' },
  ];

  if (env.get('IS_PRODUCTION')) {
    requiredInProd.forEach(({ key, name }) => {
      if (!env.get(key as keyof EnvironmentConfig)) {
        errors.push(`${name} is required in production`);
      }
    });
  }

  // Validate URLs
  const urlKeys = ['SUPABASE_URL', 'BACKEND_API_URL', 'NEXTAUTH_URL'] as const;
  urlKeys.forEach(key => {
    const value = env.get(key);
    if (value) {
      try {
        new URL(value);
      } catch {
        errors.push(`${key} must be a valid URL`);
      }
    }
  });

  // Check for recommended values
  if (!env.get('ELEVENLABS_API_KEY') && env.get('IS_PRODUCTION')) {
    warnings.push('ElevenLabs API key not set - voice synthesis will not work');
  }

  if (!env.get('DEFAULT_VOICE_ID')) {
    warnings.push('Default voice ID not set - using fallback voice');
  }
}

function validateLimits(errors: string[], warnings: string[]) {
  // Validate limit relationships
  if (LIMITS.PAGINATION.DEFAULT_PAGE_SIZE > LIMITS.PAGINATION.MAX_PAGE_SIZE) {
    errors.push('Default page size cannot be greater than max page size');
  }

  if (LIMITS.RETRY.INITIAL_DELAY_MS > LIMITS.RETRY.MAX_DELAY_MS) {
    errors.push('Initial retry delay cannot be greater than max retry delay');
  }

  if (LIMITS.VOICE.MIN_SPEED > LIMITS.VOICE.MAX_SPEED) {
    errors.push('Min voice speed cannot be greater than max voice speed');
  }

  // Check reasonable values
  if (LIMITS.TIME.SESSION_TIMEOUT_MS < 300000) { // 5 minutes
    warnings.push('Session timeout is very short (< 5 minutes)');
  }

  if (LIMITS.RATE_LIMITS.API_CALLS.PER_MINUTE > 100) {
    warnings.push('API rate limit per minute is very high');
  }
}

function validateFeatures(errors: string[], warnings: string[]) {
  // Check for feature dependencies
  const features = require('./features').features;
  
  if (features.isEnabled('VOICE_CLONING') && !env.get('ELEVENLABS_API_KEY')) {
    errors.push('Voice cloning is enabled but ElevenLabs API key is not set');
  }

  if (features.isEnabled('PERFORMANCE_MONITORING') && !env.get('IS_PRODUCTION')) {
    warnings.push('Performance monitoring is enabled in non-production environment');
  }

  if (features.isEnabled('DEBUG_MODE') && env.get('IS_PRODUCTION')) {
    errors.push('Debug mode cannot be enabled in production');
  }
}

/**
 * Run validation and log results
 */
export function validateAndLog(): boolean {
  const result = validateConfig();

  if (result.errors.length > 0) {
    console.error('Configuration errors:');
    result.errors.forEach(error => console.error(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('Configuration warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (result.valid) {
    console.log('✅ Configuration validation passed');
  } else {
    console.error('❌ Configuration validation failed');
  }

  return result.valid;
}