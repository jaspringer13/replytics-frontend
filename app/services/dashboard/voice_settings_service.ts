/**
 * Voice Settings Service
 * Handles business logic for voice agent configuration
 */

import { getSupabaseServer } from '@/lib/supabase-server';
import { 
  VoiceSettings, 
  ConversationRules, 
  createVoiceSpeed, 
  createVoicePitch 
} from '@/app/models/dashboard';

export class VoiceSettingsService {
  /**
   * Update voice settings with real-time propagation
   * This is critical for voice agent hot-reload functionality
   */
  async updateVoiceSettings(
    businessId: string, 
    settings: Partial<VoiceSettings>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate settings
      const validation = this.validateVoiceSettings(settings);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Update in database
      const { error: updateError } = await getSupabaseServer()
        .from('businesses')
        .update({
          voice_settings: settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId);

      if (updateError) {
        console.error('Failed to update voice settings:', updateError);
        return { success: false, error: 'Database update failed' };
      }

      // Broadcast real-time update
      await this.broadcastVoiceSettingsUpdate(businessId, settings);

      // Log important changes for monitoring
      console.log(`Voice settings updated for business ${businessId}:`, {
        timestamp: new Date().toISOString(),
        changes: settings
      });

      return { success: true };
    } catch (error) {
      console.error('Voice settings update error:', error);
      return { success: false, error: 'Internal error occurred' };
    }
  }

  /**
   * Update conversation rules with real-time propagation
   */
  async updateConversationRules(
    businessId: string,
    rules: Partial<ConversationRules>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate rules
      const validation = this.validateConversationRules(rules);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Update in database
      const { error: updateError } = await getSupabaseServer()
        .from('businesses')
        .update({
          conversation_rules: rules,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId);

      if (updateError) {
        console.error('Failed to update conversation rules:', updateError);
        return { success: false, error: 'Database update failed' };
      }

      // Broadcast real-time update
      await this.broadcastConversationRulesUpdate(businessId, rules);

      // Log important changes for monitoring
      console.log(`Conversation rules updated for business ${businessId}:`, {
        timestamp: new Date().toISOString(),
        changes: rules
      });

      return { success: true };
    } catch (error) {
      console.error('Conversation rules update error:', error);
      return { success: false, error: 'Internal error occurred' };
    }
  }

  /**
   * Get current voice configuration for a business
   */
  async getVoiceConfiguration(businessId: string): Promise<{
    voiceSettings: VoiceSettings;
    conversationRules: ConversationRules;
  } | null> {
    try {
      const { data, error } = await getSupabaseServer()
        .from('businesses')
        .select('voice_settings, conversation_rules')
        .eq('id', businessId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        voiceSettings: data.voice_settings || this.getDefaultVoiceSettings(),
        conversationRules: data.conversation_rules || this.getDefaultConversationRules()
      };
    } catch (error) {
      console.error('Failed to get voice configuration:', error);
      return null;
    }
  }

  // Validation constants
  private static readonly VOICE_SETTINGS_CONSTRAINTS = {
    speed: { min: 0.5, max: 2.0 },
    pitch: { min: 0.5, max: 2.0 },
    validStyles: ['friendly_professional', 'casual', 'formal', 'enthusiastic'] as const
  };

  /**
   * Validate voice settings
   */
  private validateVoiceSettings(settings: Partial<VoiceSettings>): {
    isValid: boolean;
    error?: string;
  } {
    if (settings.speed !== undefined) {
      try {
        createVoiceSpeed(settings.speed);
      } catch (error) {
        return { isValid: false, error: (error as Error).message };
      }
    }

    if (settings.pitch !== undefined) {
      try {
        createVoicePitch(settings.pitch);
      } catch (error) {
        return { isValid: false, error: (error as Error).message };
      }
    }

    if (settings.speakingStyle && !VoiceSettingsService.VOICE_SETTINGS_CONSTRAINTS.validStyles.includes(settings.speakingStyle)) {
      return { isValid: false, error: 'Invalid speaking style' };
    }

    return { isValid: true };
  }

  /**
   * Validate conversation rules
   */
  private validateConversationRules(rules: Partial<ConversationRules>): {
    isValid: boolean;
    error?: string;
  } {
    if (rules.noShowThreshold !== undefined) {
      if (rules.noShowThreshold < 1 || rules.noShowThreshold > 10) {
        return { isValid: false, error: 'No-show threshold must be between 1 and 10' };
      }
    }

    return { isValid: true };
  }

  /**
   * Broadcast voice settings update via real-time channels
   */
  private async broadcastVoiceSettingsUpdate(
    businessId: string,
    settings: Partial<VoiceSettings>
  ): Promise<void> {
    const channel = getSupabaseServer().channel(`voice-settings:${businessId}`);
    
    await channel.subscribe();
    
    await channel.send({
      type: 'broadcast',
      event: 'voice_settings_updated',
      payload: {
        businessId,
        settings,
        timestamp: new Date().toISOString(),
        requiresReload: true
      }
    });
    
    // Clean up the channel
    await getSupabaseServer().removeChannel(channel);

    // Also send to general business channel
    const businessChannel = getSupabaseServer().channel(`business:${businessId}`);
    await businessChannel.subscribe();
    
    await businessChannel.send({
      type: 'broadcast',
      event: 'settings_updated',
      payload: {
        businessId,
        type: 'voice_settings',
        settings,
        timestamp: new Date().toISOString()
      }
    });
    
    // Clean up the business channel
    await getSupabaseServer().removeChannel(businessChannel);
  }

  /**
   * Broadcast conversation rules update
   */
  private async broadcastConversationRulesUpdate(
    businessId: string,
    rules: Partial<ConversationRules>
  ): Promise<void> {
    const channel = getSupabaseServer().channel(`conversation-rules:${businessId}`);
    
    await channel.subscribe();
    
    await channel.send({
      type: 'broadcast',
      event: 'conversation_rules_updated',
      payload: {
        businessId,
        rules,
        timestamp: new Date().toISOString(),
        requiresReload: true
      }
    });
    
    // Clean up the channel
    await getSupabaseServer().removeChannel(channel);

    // Also send to general business channel for consistency
    const businessChannel = getSupabaseServer().channel(`business:${businessId}`);
    await businessChannel.subscribe();
    
    await businessChannel.send({
      type: 'broadcast',
      event: 'settings_updated',
      payload: {
        businessId,
        type: 'conversation_rules',
        rules,
        timestamp: new Date().toISOString()
      }
    });
    
    // Clean up the business channel
    await getSupabaseServer().removeChannel(businessChannel);
  }

  /**
   * Get default voice settings
   */
  private getDefaultVoiceSettings(): VoiceSettings {
    return {
      voiceId: process.env.DEFAULT_VOICE_ID || 'kdmDKE6EkgrWrrykO9Qt',
      speakingStyle: 'friendly_professional',
      speed: createVoiceSpeed(1.0),
      pitch: createVoicePitch(1.0)
    };
  }

  /**
   * Get default conversation rules
   */
  private getDefaultConversationRules(): ConversationRules {
    return {
      allowMultipleServices: true,
      allowCancellations: true,
      allowRescheduling: true,
      noShowBlockEnabled: false,
      noShowThreshold: 3
    };
  }

  /**
   * Test voice configuration
   */
  async testVoiceConfiguration(
    businessId: string,
    testMessage: string = 'Hello! This is a test of your voice settings.'
  ): Promise<{ success: boolean; audioUrl?: string; error?: string }> {
    try {
      const config = await this.getVoiceConfiguration(businessId);
      if (!config) {
        return { success: false, error: 'Configuration not found' };
      }

      // In a real implementation, this would call the voice synthesis API
      // For now, return a mock response
      return {
        success: true,
        audioUrl: `/api/v2/voice/test?voice=${config.voiceSettings.voiceId}`
      };
    } catch (error) {
      console.error('Voice test error:', error);
      return { success: false, error: 'Test failed' };
    }
  }
}

// Export singleton instance
export const voiceSettingsService = new VoiceSettingsService();