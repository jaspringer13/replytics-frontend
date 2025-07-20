"use client"

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { 
  VoiceSettings, 
  ConversationRules, 
  OperatingHours,
  Service 
} from '@/app/models/dashboard';

export interface PhoneSettingsData {
  voiceSettings: VoiceSettings | null;
  conversationRules: ConversationRules | null;
  operatingHours: OperatingHours[];
  services: Service[];
}

export interface UsePhoneSettingsReturn {
  data: PhoneSettingsData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => Promise<void>;
  updateConversationRules: (rules: Partial<ConversationRules>) => Promise<void>;
  updateOperatingHours: (hours: OperatingHours[]) => Promise<void>;
}

export function usePhoneSettings(phoneId: string | null): UsePhoneSettingsReturn | null {
  const [data, setData] = useState<PhoneSettingsData>({
    voiceSettings: null,
    conversationRules: null,
    operatingHours: [],
    services: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhoneSettings = useCallback(async () => {
    if (!phoneId) return;

    try {
      setLoading(true);
      setError(null);

      const [voiceSettings, conversationRules, operatingHours, services] = await Promise.all([
        apiClient.getPhoneVoiceSettings(phoneId),
        apiClient.getPhoneConversationRules(phoneId),
        apiClient.getPhoneOperatingHours(phoneId),
        apiClient.getPhoneServices(phoneId),
      ]);

      setData({
        voiceSettings,
        conversationRules,
        operatingHours,
        services,
      });
    } catch (err) {
      console.error('Failed to load phone settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load phone settings');
    } finally {
      setLoading(false);
    }
  }, [phoneId]);

  useEffect(() => {
    if (phoneId) {
      fetchPhoneSettings();
    }
  }, [phoneId, fetchPhoneSettings]);

  const updateVoiceSettings = useCallback(
    async (settings: Partial<VoiceSettings>) => {
      if (!phoneId) throw new Error('No phone selected');
      
      try {
        const updated = await apiClient.updatePhoneVoiceSettings(phoneId, settings);
        setData(prev => ({
          ...prev,
          voiceSettings: updated,
        }));
      } catch (err) {
        console.error('Failed to update voice settings:', err);
        throw err;
      }
    },
    [phoneId]
  );

  const updateConversationRules = useCallback(
    async (rules: Partial<ConversationRules>) => {
      if (!phoneId) throw new Error('No phone selected');
      
      try {
        const updated = await apiClient.updatePhoneConversationRules(phoneId, rules);
        setData(prev => ({
          ...prev,
          conversationRules: updated,
        }));
      } catch (err) {
        console.error('Failed to update conversation rules:', err);
        throw err;
      }
    },
    [phoneId]
  );

  const updateOperatingHours = useCallback(
    async (hours: OperatingHours[]) => {
      if (!phoneId) throw new Error('No phone selected');
      
      try {
        const updated = await apiClient.updatePhoneOperatingHours(phoneId, hours);
        setData(prev => ({
          ...prev,
          operatingHours: updated,
        }));
      } catch (err) {
        console.error('Failed to update operating hours:', err);
        throw err;
      }
    },
    [phoneId]
  );

  // Return null if no phone is selected
  if (!phoneId) return null;

  return {
    data,
    loading,
    error,
    refetch: fetchPhoneSettings,
    updateVoiceSettings,
    updateConversationRules,
    updateOperatingHours,
  };
}