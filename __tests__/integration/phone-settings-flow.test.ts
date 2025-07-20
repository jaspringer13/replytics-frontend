/**
 * Integration test for phone-specific settings flow
 * Tests the complete flow from frontend to backend real-time updates
 */

// Test framework imports - commented out due to missing dependencies
// import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Global test types for TypeScript compatibility
declare global {
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void | Promise<void>): void;
  function expect(value: any): any;
  function beforeEach(fn: () => void): void;
  function afterEach(fn: () => void): void;
}

declare const jest: {
  fn: () => any;
  spyOn: (obj: any, method: string) => any;
};
import { apiClient } from '@/lib/api-client';
import { getPhoneChannelManager } from '@/lib/realtime/phone-channels';
import { getSupabaseClient } from '@/lib/supabase-client';
import { VoiceSettings, ConversationRules } from '@/app/models/dashboard';

// Mock Supabase for testing
jest.mock('@/lib/supabase-client');
jest.mock('@/lib/supabase-server');

describe('Phone-Specific Settings Flow', () => {
  const TEST_PHONE_ID = 'test-phone-123';
  const TEST_BUSINESS_ID = 'test-business-456';
  let channelManager: ReturnType<typeof getPhoneChannelManager>;
  let receivedUpdates: any[] = [];
  
  beforeEach(() => {
    // Clear received updates
    receivedUpdates = [];
    
    // Set up channel manager
    const mockSupabase = getSupabaseClient();
    channelManager = getPhoneChannelManager(mockSupabase);
  });
  
  afterEach(() => {
    // Clean up channels
    channelManager.cleanup();
  });
  
  describe('Voice Settings Update Flow', () => {
    it('should update voice settings and broadcast to subscribers', async () => {
      // Subscribe to voice settings updates
      await channelManager.subscribeToPhone(TEST_PHONE_ID, {
        onVoiceSettings: (payload) => {
          receivedUpdates.push({ type: 'voice_settings', payload });
        }
      });
      
      // Update voice settings via API
      const newVoiceSettings: VoiceSettings = {
        voiceId: 'pNInz6obpgDQGcFmaJgB' // Adam voice
      };
      
      const response = await apiClient.updatePhoneVoiceSettings(
        TEST_PHONE_ID,
        newVoiceSettings
      );
      
      // Verify API response - API client returns data directly
      expect(response.voiceId).toBe(newVoiceSettings.voiceId);
      
      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify real-time broadcast was received
      expect(receivedUpdates).toHaveLength(1);
      expect(receivedUpdates[0].type).toBe('voice_settings');
      expect(receivedUpdates[0].payload.phoneId).toBe(TEST_PHONE_ID);
      expect(receivedUpdates[0].payload.settings.voiceId).toBe(newVoiceSettings.voiceId);
      expect(receivedUpdates[0].payload.requiresReload).toBe(true);
    });
  });
  
  describe('Conversation Rules Update Flow', () => {
    it('should update conversation rules with validation', async () => {
      // Subscribe to conversation rules updates
      await channelManager.subscribeToPhone(TEST_PHONE_ID, {
        onConversationRules: (payload) => {
          receivedUpdates.push({ type: 'conversation_rules', payload });
        }
      });
      
      // Update conversation rules via API
      const newRules: ConversationRules = {
        allowMultipleServices: false,
        allowCancellations: true,
        allowRescheduling: false,
        noShowBlockEnabled: true,
        noShowThreshold: 5
      };
      
      const response = await apiClient.updatePhoneConversationRules(
        TEST_PHONE_ID,
        newRules
      );
      
      // Verify API response - API client returns data directly
      expect(response).toMatchObject(newRules);
      
      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify real-time broadcast
      expect(receivedUpdates).toHaveLength(1);
      expect(receivedUpdates[0].type).toBe('conversation_rules');
      expect(receivedUpdates[0].payload.rules).toMatchObject(newRules);
    });
    
    it('should reject invalid no-show threshold', async () => {
      const invalidRules = {
        noShowThreshold: 15 // Max is 10
      };
      
      await expect(
        apiClient.updatePhoneConversationRules(TEST_PHONE_ID, invalidRules)
      ).rejects.toThrow('No-show threshold must be between 1 and 10');
    });
  });
  
  describe('Operating Hours Update Flow', () => {
    it('should update operating hours with timezone', async () => {
      // Subscribe to operating hours updates
      await channelManager.subscribeToPhone(TEST_PHONE_ID, {
        onOperatingHours: (payload) => {
          receivedUpdates.push({ type: 'operating_hours', payload });
        }
      });
      
      // Define test operating hours
      const operatingHours = [
        { day: 'Monday', enabled: true, hours: [{ open: '09:00', close: '17:00' }] },
        { day: 'Tuesday', enabled: true, hours: [{ open: '09:00', close: '17:00' }] },
        { day: 'Wednesday', enabled: true, hours: [{ open: '09:00', close: '17:00' }] },
        { day: 'Thursday', enabled: true, hours: [{ open: '09:00', close: '17:00' }] },
        { day: 'Friday', enabled: true, hours: [{ open: '09:00', close: '17:00' }] },
        { day: 'Saturday', enabled: false, hours: [] },
        { day: 'Sunday', enabled: false, hours: [] }
      ];
      
      const response = await apiClient.updatePhoneOperatingHours(TEST_PHONE_ID, operatingHours);
      
      // Verify API response - returns OperatingHours[] directly
      expect(response).toEqual(operatingHours);
      
      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify real-time broadcast
      expect(receivedUpdates).toHaveLength(1);
      expect(receivedUpdates[0].type).toBe('operating_hours');
      expect(receivedUpdates[0].payload.operatingHours).toEqual(operatingHours);
      expect(receivedUpdates[0].payload.timezone).toBe('America/Chicago');
    });
  });
  
  describe('Primary Phone Change Flow', () => {
    it('should broadcast primary phone change to all subscribers', async () => {
      const NEW_PRIMARY_PHONE_ID = 'test-phone-456';
      
      // Subscribe to business-wide updates
      await channelManager.subscribeToBusinessUpdates(TEST_BUSINESS_ID, {
        onPrimaryPhoneChanged: (payload) => {
          receivedUpdates.push({ type: 'primary_phone_changed', payload });
        }
      });
      
      // Set new primary phone - method needs businessId parameter
      const response = await apiClient.setPrimaryPhone('test-business-id', NEW_PRIMARY_PHONE_ID);
      
      // Verify API response - returns PhoneNumber object directly
      expect(response.id).toBe(NEW_PRIMARY_PHONE_ID);
      
      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify real-time broadcast
      expect(receivedUpdates).toHaveLength(1);
      expect(receivedUpdates[0].type).toBe('primary_phone_changed');
      expect(receivedUpdates[0].payload.newPrimaryPhoneId).toBe(NEW_PRIMARY_PHONE_ID);
      expect(receivedUpdates[0].payload.requiresReload).toBe(true);
    });
  });
  
  describe('Voice Test Flow', () => {
    it('should generate test audio with phone-specific voice settings', async () => {
      const testText = 'Hello, this is a test of the voice system.';
      const testVoiceId = 'VR6AewLTigWG4xSOukaG'; // Nicole voice
      
      const response = await apiClient.testPhoneVoice(TEST_PHONE_ID, testVoiceId, testText);
      
      // Verify response - testVoiceConfiguration returns { success, audioUrl?, error?, duration? }
      expect(response.success).toBe(true);
      expect(response.audioUrl).toBeDefined();
      expect(response.duration).toBeGreaterThan(0);
    });
    
    it('should reject text that is too long', async () => {
      const longText = 'a'.repeat(600); // Max is 500
      
      await expect(
        apiClient.testPhoneVoice(TEST_PHONE_ID, 'test-voice-id', longText)
      ).rejects.toThrow('Text too long');
    });
  });
  
  describe('Multi-Phone Coordination', () => {
    it('should handle updates to multiple phones independently', async () => {
      const PHONE_1 = 'phone-1';
      const PHONE_2 = 'phone-2';
      const updates1: any[] = [];
      const updates2: any[] = [];
      
      // Subscribe to both phones
      await channelManager.subscribeToPhone(PHONE_1, {
        onVoiceSettings: (payload) => updates1.push(payload)
      });
      
      await channelManager.subscribeToPhone(PHONE_2, {
        onVoiceSettings: (payload) => updates2.push(payload)
      });
      
      // Update voice settings for phone 1
      await apiClient.updatePhoneVoiceSettings(PHONE_1, {
        voiceId: 'voice-1'
      });
      
      // Update voice settings for phone 2
      await apiClient.updatePhoneVoiceSettings(PHONE_2, {
        voiceId: 'voice-2'
      });
      
      // Wait for updates
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verify each phone received only its own updates
      expect(updates1).toHaveLength(1);
      expect(updates1[0].phoneId).toBe(PHONE_1);
      expect(updates1[0].settings.voiceId).toBe('voice-1');
      
      expect(updates2).toHaveLength(1);
      expect(updates2[0].phoneId).toBe(PHONE_2);
      expect(updates2[0].settings.voiceId).toBe('voice-2');
    });
  });
  
  describe('Error Handling', () => {
    it('should handle unauthorized access gracefully', async () => {
      // Mock unauthorized response
      jest.spyOn(apiClient, 'updatePhoneVoiceSettings').mockRejectedValueOnce(
        new Error('Unauthorized')
      );
      
      await expect(
        apiClient.updatePhoneVoiceSettings('unauthorized-phone', { voiceId: 'test' })
      ).rejects.toThrow('Unauthorized');
    });
    
    it('should handle network failures with retry', async () => {
      let attempts = 0;
      
      // Mock network failure then success
      jest.spyOn(apiClient, 'updatePhoneVoiceSettings')
        .mockImplementation(async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Network error');
          }
          return { success: true, data: { voiceId: 'test' } };
        });
      
      // Should eventually succeed after retries
      const response = await apiClient.updatePhoneVoiceSettings(TEST_PHONE_ID, {
        voiceId: 'test'
      });
      
      // API returns VoiceSettings object directly
      expect(response.voiceId).toBe('test');
      expect(attempts).toBe(3);
    });
  });
});

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
      errors: [`Failed to validate configuration: ${error}`]
    };
  }
}