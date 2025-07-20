/**
 * Voice Settings Service
 * Handles business logic for voice agent configuration
 */

import { getSupabaseServer } from '@/lib/supabase-server';
import { 
  VoiceSettings, 
  ConversationRules 
} from '@/app/models/dashboard';
import { voiceSynthesisService } from '@/lib/voice-synthesis';
import { env } from '@/lib/config';

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

  // Available voice options
  public static readonly VOICE_OPTIONS = {
    'kdmDKE6EkgrWrrykO9Qt': 'Rachel - Professional Female',
    'pNInz6obpgDQGcFmaJgB': 'Adam - Friendly Male',
    'Yko7PKHZNXotIFUBG7I9': 'Sam - Professional Male',
    'VR6AewLTigWG4xSOukaG': 'Bella - Warm Female',
    'EXAVITQu4vr4xnSDxMaL': 'Sarah - Energetic Female',
    'ErXwobaYiN019PkySvjV': 'Antoni - Calm Male',
  };

  /**
   * Validate voice settings
   */
  private validateVoiceSettings(settings: Partial<VoiceSettings>): {
    isValid: boolean;
    error?: string;
  } {
    if (settings.voiceId && !(settings.voiceId in VoiceSettingsService.VOICE_OPTIONS)) {
      return { isValid: false, error: 'Invalid voice selection' };
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
    const envVoiceId = env.get('DEFAULT_VOICE_ID');
    const fallbackVoiceId = 'kdmDKE6EkgrWrrykO9Qt';
    
    // Validate environment variable and log appropriately
    if (!envVoiceId) {
      console.warn('DEFAULT_VOICE_ID environment variable not set, using fallback voice ID:', fallbackVoiceId);
    } else if (envVoiceId.trim() === '') {
      console.warn('DEFAULT_VOICE_ID environment variable is empty, using fallback voice ID:', fallbackVoiceId);
    } else {
      console.log('Using configured DEFAULT_VOICE_ID:', envVoiceId);
    }
    
    const defaultVoiceId = envVoiceId && envVoiceId.trim() !== '' ? envVoiceId : fallbackVoiceId;
    
    return {
      voiceId: defaultVoiceId
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
   * Test voice configuration with actual voice synthesis
   */
  async testVoiceConfiguration(
    businessId: string,
    testMessage: string = 'Hello! This is a test of your voice settings.'
  ): Promise<{ success: boolean; audioUrl?: string; error?: string; duration?: number }> {
    try {
      const config = await this.getVoiceConfiguration(businessId);
      if (!config) {
        return { success: false, error: 'Voice configuration not found' };
      }

      // Validate voice settings before synthesis
      const validation = this.validateVoiceSettings(config.voiceSettings);
      if (!validation.isValid) {
        return { success: false, error: `Invalid voice settings: ${validation.error}` };
      }

      // Generate cache key for test audio (to avoid re-generating identical tests)
      const cacheKey = this.generateTestCacheKey(config.voiceSettings, testMessage);
      
      // Check if we have a cached version (simple in-memory cache)
      const cached = this.testAudioCache.get(cacheKey);
      if (cached && cached.timestamp > Date.now() - 300000) { // 5 minute cache
        console.log('Returning cached voice test audio');
        return { 
          success: true, 
          audioUrl: cached.audioUrl,
          duration: cached.duration 
        };
      }

      // Synthesize voice using ElevenLabs integration
      console.log(`Synthesizing test voice for business ${businessId}`);
      const synthesisResult = await voiceSynthesisService.synthesizeVoice({
        text: testMessage,
        settings: config.voiceSettings,
        tenantId: businessId
      });

      if (!synthesisResult.success) {
        return { 
          success: false, 
          error: synthesisResult.error || 'Voice synthesis failed' 
        };
      }

      // Cache the result for future requests
      if (synthesisResult.audioUrl) {
        this.testAudioCache.set(cacheKey, {
          audioUrl: synthesisResult.audioUrl,
          duration: synthesisResult.duration,
          timestamp: Date.now()
        });

        // Clean up old cache entries (keep only last 10)
        if (this.testAudioCache.size > 10) {
          const oldestKey = this.testAudioCache.keys().next().value;
          if (oldestKey !== undefined) {
            this.testAudioCache.delete(oldestKey);
          }
        }
      }

      return {
        success: true,
        audioUrl: synthesisResult.audioUrl,
        duration: synthesisResult.duration
      };

    } catch (error) {
      console.error('Voice test error:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return { success: false, error: 'Voice synthesis service not configured' };
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          return { success: false, error: 'Network error - please try again' };
        }
        if (error.message.includes('quota') || error.message.includes('limit')) {
          return { success: false, error: 'Voice synthesis quota exceeded' };
        }
      }
      
      return { success: false, error: 'Voice test failed - please try again' };
    }
  }

  // Simple in-memory cache for test audio
  private testAudioCache = new Map<string, { 
    audioUrl: string; 
    duration?: number; 
    timestamp: number; 
  }>();

  /**
   * Generate cache key for test audio
   */
  private generateTestCacheKey(settings: VoiceSettings, message: string): string {
    const settingsHash = settings.voiceId;
    return `${Buffer.from(settingsHash + message).toString('base64').slice(0, 32)}`;
  }
}

// Export singleton instance
export const voiceSettingsService = new VoiceSettingsService();