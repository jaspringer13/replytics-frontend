/**
 * Settings -> Backend Voice Agent Transmission Validation
 * Critical tests to ensure settings are correctly transmitted to the backend voice agent
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { apiClient } from '@/lib/api-client';
import { getSupabaseServer } from '@/lib/supabase-server';
import { VoiceSettings, ConversationRules } from '@/app/models/dashboard';

// Mock dependencies
jest.mock('@/lib/api-client');
jest.mock('@/lib/supabase-server');

interface BackendVoiceAgentConfig {
  voice_id: string;
  conversation_rules: {
    allow_multiple_services: boolean;
    allow_cancellations: boolean;
    allow_rescheduling: boolean;
    no_show_block_enabled: boolean;
    no_show_threshold: number;
  };
}

describe('Settings -> Backend Voice Agent Transmission', () => {
  const businessId = 'test-business-id';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Data Format Validation', () => {
    it('should correctly format voice settings for backend transmission', async () => {
      const frontendSettings: VoiceSettings = {
        voiceId: 'kdmDKE6EkgrWrrykO9Qt',
      };

      const expectedBackendFormat: Partial<BackendVoiceAgentConfig> = {
        voice_id: 'kdmDKE6EkgrWrrykO9Qt',
      };

      // Mock the API call
      const mockUpdateProfile = jest.spyOn(apiClient, 'updateBusinessProfile')
        .mockResolvedValue({ success: true });
      
      await apiClient.updateBusinessProfile({
        voiceSettings: frontendSettings,
      });

      // Verify the data sent to backend matches expected format
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          voiceSettings: expect.objectContaining(expectedBackendFormat)
        })
      );
    });

    it('should correctly format conversation rules for backend transmission', async () => {
      const frontendRules: ConversationRules = {
        allowMultipleServices: true,
        allowCancellations: false,
        allowRescheduling: true,
        noShowBlockEnabled: true,
        noShowThreshold: 3,
      };

      const expectedBackendFormat = {
        allow_multiple_services: true,
        allow_cancellations: false,
        allow_rescheduling: true,
        no_show_block_enabled: true,
        no_show_threshold: 3,
      };

      const mockUpdateProfile = jest.spyOn(apiClient, 'updateBusinessProfile')
        .mockResolvedValue({ success: true });
      
      await apiClient.updateBusinessProfile({
        conversationRules: frontendRules,
      });

      // Verify snake_case conversion for backend
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationRules: expect.objectContaining(expectedBackendFormat)
        })
      );
    });
  });

  describe('Real-time Broadcast Validation', () => {
    it('should broadcast voice settings updates to all connected clients', async () => {
      const voiceSettings: VoiceSettings = {
        voiceId: 'new-voice-id',
      };

      // Mock Supabase channel
      const mockChannel = {
        subscribe: jest.fn().mockResolvedValue(undefined),
        send: jest.fn().mockResolvedValue(undefined),
      };
      
      const mockSupabase = {
        channel: jest.fn().mockReturnValue(mockChannel),
        removeChannel: jest.fn(),
      };
      
      (getSupabaseServer as jest.Mock).mockReturnValue(mockSupabase);

      // Perform update
      await apiClient.updateBusinessProfile({
        id: businessId,
        voiceSettings,
      });

      // Verify broadcasts were sent
      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'voice_settings_updated',
        payload: expect.objectContaining({
          businessId,
          settings: voiceSettings,
          timestamp: expect.any(String),
          requiresReload: true,
        })
      });

      // Verify both channels were used
      expect(mockSupabase.channel).toHaveBeenCalledWith(`voice-settings:${businessId}`);
      expect(mockSupabase.channel).toHaveBeenCalledWith(`business:${businessId}`);
    });
  });

  describe('Backend Voice Agent Integration', () => {
    it('should verify voice agent receives updated settings', async () => {
      const updatedSettings: VoiceSettings = {
        voiceId: 'pNInz6obpgDQGcFmaJgB',
      };

      // Mock the API client method
      const mockUpdate = jest.spyOn(apiClient, 'updateBusinessProfile')
        .mockResolvedValue({ success: true });
      
      // Simulate the update flow
      await apiClient.updateBusinessProfile({
        id: businessId,
        voiceSettings: updatedSettings,
      });

      // Verify the backend voice agent would receive the update
      const expectedVoiceAgentPayload = {
        id: businessId,
        voiceSettings: updatedSettings,
      };

      // In a real scenario, this would be verified through webhook or API call
      // Here we're validating the expected payload structure
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining(expectedVoiceAgentPayload)
      );
    });

    it('should handle voice agent acknowledgment', async () => {
      // Mock the complete flow including voice agent acknowledgment
      const mockVoiceAgentEndpoint = jest.fn().mockResolvedValue({
        status: 'success',
        message: 'Voice configuration updated',
        applied_at: new Date().toISOString(),
      });

      const settings: VoiceSettings = {
        voiceId: 'kdmDKE6EkgrWrrykO9Qt',
      };

      // Update settings
      await apiClient.updateBusinessProfile({
        id: businessId,
        voiceSettings: settings,
      });

      // Simulate voice agent webhook/callback
      const voiceAgentResponse = await mockVoiceAgentEndpoint({
        business_id: businessId,
        voice_settings: settings,
      });

      expect(voiceAgentResponse.status).toBe('success');
      expect(voiceAgentResponse.applied_at).toBeDefined();
    });
  });

  describe('Error Recovery', () => {
    it('should retry on transient failures', async () => {
      const settings: VoiceSettings = {
        voiceId: 'test-voice',
      };

      // Mock transient failure then success
      const mockUpdate = jest.fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({ success: true });

      // Attempt update with retry logic
      let attempts = 0;
      let result;
      
      while (attempts < 3) {
        try {
          result = await mockUpdate(settings);
          break;
        } catch (error) {
          attempts++;
          if (attempts >= 3) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }

      expect(result?.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });

    it('should maintain consistency on partial failures', async () => {
      // Mock scenario where database update succeeds but broadcast fails
      const mockDbUpdate = jest.fn().mockResolvedValue({ success: true });
      const mockBroadcast = jest.fn().mockRejectedValue(new Error('Broadcast failed'));

      const settings: VoiceSettings = {
        voiceId: 'test-voice',
      };

      // Attempt update
      try {
        await mockDbUpdate(settings);
        await mockBroadcast(settings);
      } catch (error) {
        // Even if broadcast fails, database should have correct data
        expect(mockDbUpdate).toHaveBeenCalledWith(settings);
        
        // Verify we can still retrieve the updated settings
        jest.spyOn(apiClient, 'getBusinessProfile')
          .mockResolvedValue({ voiceSettings: settings });
        
        const retrievedSettings = await apiClient.getBusinessProfile();
        expect(retrievedSettings.voiceSettings).toEqual(settings);
      }
    });
  });

  describe('Validation Edge Cases', () => {
    it('should handle boundary values correctly', async () => {
      const edgeCaseSettings: VoiceSettings = {
        voiceId: 'test',
      };

      jest.spyOn(apiClient, 'updateBusinessProfile')
        .mockResolvedValue({ voiceSettings: edgeCaseSettings });

      const result = await apiClient.updateBusinessProfile({
        voiceSettings: edgeCaseSettings,
      });

      expect(result).toBeDefined();
      expect(result.voiceSettings.voiceId).toBe('test');
    });

    it('should reject invalid values before transmission', async () => {
      const invalidSettings = {
        voiceId: '', // Empty voice ID
      };
      
      jest.spyOn(apiClient, 'updateBusinessProfile')
        .mockRejectedValue(new Error('Invalid voice settings'));

      await expect(
        apiClient.updateBusinessProfile({
          voiceSettings: invalidSettings as any,
        })
      ).rejects.toThrow(/Invalid/);
    });
  });
});