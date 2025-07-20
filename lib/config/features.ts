/**
 * Feature flags and toggles configuration
 * Controls which features are enabled/disabled
 */

import { isProduction, isDevelopment } from './environment';

export interface FeatureFlags {
  // Core features
  VOICE_AGENT_ENABLED: boolean;
  SMS_ENABLED: boolean;
  EMAIL_ENABLED: boolean;
  
  // Analytics features
  AI_INSIGHTS_ENABLED: boolean;
  REAL_TIME_ANALYTICS: boolean;
  ADVANCED_ANALYTICS: boolean;
  
  // Settings features
  TEAM_MANAGEMENT_ENABLED: boolean;
  INTEGRATIONS_ENABLED: boolean;
  CUSTOM_VOICE_ENABLED: boolean;
  
  // Performance features
  PERFORMANCE_MONITORING: boolean;
  ERROR_TRACKING: boolean;
  USER_SESSION_REPLAY: boolean;
  
  // Experimental features
  VOICE_CLONING: boolean;
  AI_SCHEDULING_ASSISTANT: boolean;
  SMART_ROUTING: boolean;
  
  // Debug features
  DEBUG_MODE: boolean;
  VERBOSE_LOGGING: boolean;
  SHOW_DEV_TOOLS: boolean;
}

class Features {
  private static instance: Features;
  private flags: FeatureFlags;
  private overrides: Partial<FeatureFlags> = {};

  private constructor() {
    this.flags = this.loadFeatures();
  }

  static getInstance(): Features {
    if (!Features.instance) {
      Features.instance = new Features();
    }
    return Features.instance;
  }

  private loadFeatures(): FeatureFlags {
    const isProd = isProduction();
    const isDev = isDevelopment();

    return {
      // Core features - enabled in all environments
      VOICE_AGENT_ENABLED: true,
      SMS_ENABLED: true,
      EMAIL_ENABLED: false, // Coming soon
      
      // Analytics features
      AI_INSIGHTS_ENABLED: true,
      REAL_TIME_ANALYTICS: true,
      ADVANCED_ANALYTICS: isProd,
      
      // Settings features
      TEAM_MANAGEMENT_ENABLED: false, // Coming soon
      INTEGRATIONS_ENABLED: true,
      CUSTOM_VOICE_ENABLED: true,
      
      // Performance features
      PERFORMANCE_MONITORING: isProd,
      ERROR_TRACKING: isProd,
      USER_SESSION_REPLAY: false,
      
      // Experimental features - only in development
      VOICE_CLONING: false,
      AI_SCHEDULING_ASSISTANT: false,
      SMART_ROUTING: false,
      
      // Debug features - only in development
      DEBUG_MODE: isDev,
      VERBOSE_LOGGING: isDev,
      SHOW_DEV_TOOLS: isDev,
      
      // Apply any localStorage overrides (for testing)
      ...this.loadOverrides(),
    };
  }

  private loadOverrides(): Partial<FeatureFlags> {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem('feature_flags_override');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  isEnabled(feature: keyof FeatureFlags): boolean {
    // Check overrides first
    if (feature in this.overrides) {
      return this.overrides[feature]!;
    }
    
    return this.flags[feature];
  }

  /**
   * Override a feature flag (useful for testing)
   * Only works in development mode
   */
  override(feature: keyof FeatureFlags, enabled: boolean) {
    if (!isDevelopment()) {
      console.warn('Feature flag overrides only work in development mode');
      return;
    }
    
    this.overrides[feature] = enabled;
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('feature_flags_override', JSON.stringify(this.overrides));
    }
  }

  /**
   * Clear all overrides
   */
  clearOverrides() {
    this.overrides = {};
    if (typeof window !== 'undefined') {
      localStorage.removeItem('feature_flags_override');
    }
  }

  /**
   * Get all current feature flags
   */
  getAll(): FeatureFlags {
    return {
      ...this.flags,
      ...this.overrides,
    };
  }
}

// Export singleton instance
export const features = Features.getInstance();

// Export convenience functions
export const isFeatureEnabled = (feature: keyof FeatureFlags) => features.isEnabled(feature);

// Export specific feature checks for common use cases
export const isVoiceAgentEnabled = () => features.isEnabled('VOICE_AGENT_ENABLED');
export const isSMSEnabled = () => features.isEnabled('SMS_ENABLED');
export const isAIInsightsEnabled = () => features.isEnabled('AI_INSIGHTS_ENABLED');
export const isDebugMode = () => features.isEnabled('DEBUG_MODE');