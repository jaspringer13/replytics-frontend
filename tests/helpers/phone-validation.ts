/**
 * Phone validation utilities for testing
 */

import { apiClient } from '@/lib/api-client';

// Test helper to validate phone configuration
export async function validatePhoneConfiguration(phoneId: string): Promise<{
  isValid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    // Get all phone settings
    const [voiceSettings, conversationRules, operatingHours] = await Promise.all([
      apiClient.getPhoneVoiceSettings(phoneId),
      apiClient.getPhoneConversationRules(phoneId),
      apiClient.getPhoneOperatingHours(phoneId)
    ]);

    // Validate voice settings
    if (!voiceSettings.voiceId) {
      errors.push('Voice ID is required');
    }

    // Validate conversation rules
    if (conversationRules.noShowThreshold < 1 || conversationRules.noShowThreshold > 10) {
      errors.push('No-show threshold must be between 1 and 10');
    }

    // Validate operating hours
    if (!operatingHours || operatingHours.length !== 7) {
      errors.push('Operating hours must be configured for all 7 days');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Failed to validate configuration: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}