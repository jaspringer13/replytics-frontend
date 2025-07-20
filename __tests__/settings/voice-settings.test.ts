/**
 * Voice Settings Test Suite
 * Critical tests to ensure voice agent configuration is transmitted correctly
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VoiceSettingsService } from '@/app/services/dashboard/voice_settings_service';
import { apiClient } from '@/lib/api-client';
import { VoiceSettings, ConversationRules } from '@/app/models/dashboard';
import * as voiceSynthesis from '@/lib/voice-synthesis';

// Mock dependencies
jest.mock('@/lib/api-client');
jest.mock('@/lib/supabase-server');
jest.mock('@/lib/voice-synthesis');

import { getSupabaseServer } from '@/lib/supabase-server';

describe('Voice Settings Transmission Tests', () => {
  let voiceSettingsService: VoiceSettingsService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    voiceSettingsService = new VoiceSettingsService();
  });

  describe('Voice Settings Update', () => {
    it('should validate voice settings before transmission', async () => {
      const invalidSettings: Partial<VoiceSettings> = {
        voiceId: 'invalid_voice_id', // Invalid voice ID
      };

      const result = await voiceSettingsService.updateVoiceSettings('test-business-id', invalidSettings);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });

    it('should successfully update valid voice settings', async () => {
      const validSettings: Partial<VoiceSettings> = {
        voiceId: 'kdmDKE6EkgrWrrykO9Qt',
      };

      // Mock the Supabase chain
      const mockUpdate = jest.fn().mockReturnValue({ error: null });
      const mockEq = jest.fn().mockReturnValue({ error: null });
      const mockFrom = jest.fn().mockReturnValue({
        update: mockUpdate.mockReturnValue({
          eq: mockEq
        })
      });
      
      jest.mocked(getSupabaseServer).mockReturnValue({
        from: mockFrom
      } as any);
      
      const result = await voiceSettingsService.updateVoiceSettings('test-business-id', validSettings);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockUpdate).toHaveBeenCalledWith({
        voice_settings: validSettings,
        updated_at: expect.any(String)
      });
    });

    it('should broadcast real-time updates after successful save', async () => {
      const settings: Partial<VoiceSettings> = {
        voiceId: 'kdmDKE6EkgrWrrykO9Qt',
      };

      // Mock the Supabase channel
      const mockSend = jest.fn().mockResolvedValue(undefined);
      const mockChannel = {
        subscribe: jest.fn().mockResolvedValue(undefined),
        send: mockSend,
      };
      
      // Mock Supabase to return our channel and database operations
      const mockUpdate = jest.fn().mockReturnValue({ error: null });
      const mockEq = jest.fn().mockReturnValue({ error: null });
      const mockFrom = jest.fn().mockReturnValue({
        update: mockUpdate.mockReturnValue({
          eq: mockEq
        })
      });
      
      jest.mocked(getSupabaseServer).mockReturnValue({
        channel: jest.fn().mockReturnValue(mockChannel),
        removeChannel: jest.fn().mockResolvedValue(undefined),
        from: mockFrom
      } as any);

      const result = await voiceSettingsService.updateVoiceSettings('test-business-id', settings);
      
      expect(result.success).toBe(true);
      // Verify real-time broadcast was attempted
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'broadcast',
          event: 'voice_settings_updated',
          payload: expect.objectContaining({
            businessId: 'test-business-id',
            settings,
            requiresReload: true,
          })
        })
      );
    });
  });

  describe('Conversation Rules Update', () => {
    it('should validate conversation rules before transmission', async () => {
      const invalidRules: Partial<ConversationRules> = {
        noShowThreshold: 15, // Invalid - exceeds max of 10
      };

      const result = await voiceSettingsService.updateConversationRules('test-business-id', invalidRules);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('between 1 and 10');
    });

    it('should successfully update valid conversation rules', async () => {
      const validRules: Partial<ConversationRules> = {
        allowMultipleServices: true,
        allowCancellations: false,
        allowRescheduling: true,
        noShowBlockEnabled: true,
        noShowThreshold: 3,
      };

      // Mock the Supabase chain
      const mockEq = jest.fn().mockReturnValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ update: mockUpdate });
      
      jest.mocked(getSupabaseServer).mockReturnValue({
        from: mockFrom
      } as any);

      const result = await voiceSettingsService.updateConversationRules('test-business-id', validRules);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Voice Configuration Retrieval', () => {
    it('should return default settings when no configuration exists', async () => {
      // Mock the Supabase chain
      const mockSingle = jest.fn().mockReturnValue({
        data: null,
        error: null
      });
      const mockEq = jest.fn().mockReturnValue({
        single: mockSingle
      });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq
      });
      const mockFrom = jest.fn().mockReturnValue({
        select: mockSelect
      });
      
      jest.mocked(getSupabaseServer).mockReturnValue({
        from: mockFrom
      } as any);

      const config = await voiceSettingsService.getVoiceConfiguration('test-business-id');
      
      expect(config).not.toBeNull();
      expect(config?.voiceSettings.voiceId).toBe('kdmDKE6EkgrWrrykO9Qt'); // Default voice
      expect(config?.conversationRules).toEqual({
        allowMultipleServices: true,
        allowCancellations: true,
        allowRescheduling: true,
        noShowBlockEnabled: false,
        noShowThreshold: 3
      });
    });

    it('should merge partial settings with defaults', async () => {
      // Mock the Supabase chain
      const mockSingle = jest.fn().mockReturnValue({
        data: {
          voice_settings: {
            voiceId: 'custom-voice-id',
          },
          conversation_rules: null
        },
        error: null
      });
      const mockEq = jest.fn().mockReturnValue({
        single: mockSingle
      });
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq
      });
      const mockFrom = jest.fn().mockReturnValue({
        select: mockSelect
      });
      
      jest.mocked(getSupabaseServer).mockReturnValue({
        from: mockFrom
      } as any);

      const config = await voiceSettingsService.getVoiceConfiguration('test-business-id');
      
      expect(config?.voiceSettings.voiceId).toBe('custom-voice-id');
      expect(config?.conversationRules).toEqual({
        allowMultipleServices: true,
        allowCancellations: true,
        allowRescheduling: true,
        noShowBlockEnabled: false,
        noShowThreshold: 3
      });
    });
  });

  describe('Voice Test Functionality', () => {
    it('should generate test audio with current settings', async () => {
      const mockAudioUrl = 'https://example.com/test-audio.mp3';
      const mockDuration = 2.5;

      // Mock voice synthesis service
      const mockSynthesize = jest.fn().mockResolvedValue({
        success: true,
        audioUrl: mockAudioUrl,
        duration: mockDuration,
      });
      
      jest.mocked(voiceSynthesis.synthesizeVoice).mockImplementation(mockSynthesize);

      const result = await voiceSettingsService.testVoiceConfiguration(
        'test-business-id',
        'Hello, this is a test message.'
      );
      
      expect(result.success).toBe(true);
      expect(result.audioUrl).toBe(mockAudioUrl);
      expect(result.duration).toBe(mockDuration);
      expect(result.error).toBeUndefined();
    });

    it('should cache test audio to avoid redundant synthesis', async () => {
      const testMessage = 'Test message';
      const businessId = 'test-business-id';

      // Mock the voice synthesis service
      const mockSynthesize = jest.fn()
        .mockResolvedValueOnce({
          success: true,
          audioUrl: 'https://example.com/test.mp3',
          duration: 2.5
        });
      
      jest.mocked(voiceSynthesis.synthesizeVoice).mockImplementation(mockSynthesize);

      // First call
      const result1 = await voiceSettingsService.testVoiceConfiguration(businessId, testMessage);
      expect(result1.success).toBe(true);

      // Second call with same parameters
      const result2 = await voiceSettingsService.testVoiceConfiguration(businessId, testMessage);
      
      // Should return cached result
      expect(result2.audioUrl).toBe(result1.audioUrl);
      // Verify synthesis was only called once
      expect(mockSynthesize).toHaveBeenCalledTimes(1);
    });

    it('should handle voice synthesis errors gracefully', async () => {
      // Mock synthesis failure
      const mockSynthesize = jest.fn().mockResolvedValue({
        success: false,
        error: 'API quota exceeded',
      });
      
      jest.mocked(voiceSynthesis.synthesizeVoice).mockImplementation(mockSynthesize);

      const result = await voiceSettingsService.testVoiceConfiguration('test-business-id', 'Test message');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('quota exceeded');
      expect(result.audioUrl).toBeUndefined();
    });
  });
});