/**
 * React hook for subscribing to phone-specific real-time updates
 */

import { useEffect, useRef } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { getPhoneChannelManager } from '@/lib/realtime/phone-channels';
import { VoiceSettings, ConversationRules } from '@/app/models/dashboard';

interface PhoneRealtimeHandlers {
  onVoiceSettingsUpdate?: (settings: VoiceSettings) => void;
  onConversationRulesUpdate?: (rules: ConversationRules) => void;
  onOperatingHoursUpdate?: (hours: any) => void;
  onSmsSettingsUpdate?: (settings: any) => void;
  onAnySettingsUpdate?: (update: any) => void;
}

export function usePhoneRealtimeUpdates(
  phoneId: string | null,
  handlers: PhoneRealtimeHandlers
) {
  const supabase = useSupabase();
  const channelManagerRef = useRef<ReturnType<typeof getPhoneChannelManager>>();

  useEffect(() => {
    if (!phoneId || !supabase) return;

    const channelManager = getPhoneChannelManager(supabase);
    channelManagerRef.current = channelManager;

    // Subscribe to phone-specific updates
    const channel = channelManager.subscribeToPhone(phoneId, {
      onVoiceSettings: (payload) => {
        console.log('📡 Voice settings update received:', payload);
        if (handlers.onVoiceSettingsUpdate && payload.settings) {
          handlers.onVoiceSettingsUpdate(payload.settings);
        }
      },
      onConversationRules: (payload) => {
        console.log('📡 Conversation rules update received:', payload);
        if (handlers.onConversationRulesUpdate && payload.rules) {
          handlers.onConversationRulesUpdate(payload.rules);
        }
      },
      onOperatingHours: (payload) => {
        console.log('📡 Operating hours update received:', payload);
        if (handlers.onOperatingHoursUpdate && payload.operatingHours) {
          handlers.onOperatingHoursUpdate(payload.operatingHours);
        }
      },
      onSmsSettings: (payload) => {
        console.log('📡 SMS settings update received:', payload);
        if (handlers.onSmsSettingsUpdate && payload.settings) {
          handlers.onSmsSettingsUpdate(payload.settings);
        }
      },
      onSettingsUpdate: (payload) => {
        console.log('📡 Generic settings update received:', payload);
        if (handlers.onAnySettingsUpdate) {
          handlers.onAnySettingsUpdate(payload);
        }
      }
    });

    // Cleanup on unmount or phoneId change
    return () => {
      channelManager.unsubscribeFromPhone(phoneId);
    };
  }, [phoneId, supabase, handlers]);

  return channelManagerRef.current;
}

interface BusinessRealtimeHandlers {
  onPrimaryPhoneChanged?: (newPrimaryPhoneId: string) => void;
  onPhoneAdded?: (phone: any) => void;
  onPhoneRemoved?: (phoneId: string) => void;
  onBusinessSettingsUpdate?: (settings: any) => void;
}

export function useBusinessRealtimeUpdates(
  businessId: string | null,
  handlers: BusinessRealtimeHandlers
) {
  const supabase = useSupabase();
  const channelManagerRef = useRef<ReturnType<typeof getPhoneChannelManager>>();

  useEffect(() => {
    if (!businessId || !supabase) return;

    const channelManager = getPhoneChannelManager(supabase);
    channelManagerRef.current = channelManager;

    // Subscribe to business-wide updates
    const channel = channelManager.subscribeToBusinessUpdates(businessId, {
      onPrimaryPhoneChanged: (payload) => {
        console.log('📡 Primary phone changed:', payload);
        if (handlers.onPrimaryPhoneChanged && payload.newPrimaryPhoneId) {
          handlers.onPrimaryPhoneChanged(payload.newPrimaryPhoneId);
        }
      },
      onPhoneAdded: (payload) => {
        console.log('📡 Phone added:', payload);
        if (handlers.onPhoneAdded && payload.phone) {
          handlers.onPhoneAdded(payload.phone);
        }
      },
      onPhoneRemoved: (payload) => {
        console.log('📡 Phone removed:', payload);
        if (handlers.onPhoneRemoved && payload.phoneId) {
          handlers.onPhoneRemoved(payload.phoneId);
        }
      },
      onBusinessSettingsUpdate: (payload) => {
        console.log('📡 Business settings update:', payload);
        if (handlers.onBusinessSettingsUpdate && payload.settings) {
          handlers.onBusinessSettingsUpdate(payload.settings);
        }
      }
    });

    // Cleanup on unmount or businessId change
    return () => {
      channelManager.unsubscribeFromBusiness(businessId);
    };
  }, [businessId, supabase, handlers]);

  return channelManagerRef.current;
}