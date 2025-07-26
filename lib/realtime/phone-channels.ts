/**
 * Real-time channel management for phone-specific updates
 * Ensures voice agents receive configuration updates in real-time
 */

import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

export interface PhoneChannelMessage {
  type: 'broadcast';
  event: string;
  payload: {
    phoneId: string;
    businessId: string;
    timestamp: string;
    requiresReload?: boolean;
    [key: string]: any;
  };
}

export class PhoneChannelManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  
  constructor(private supabase: SupabaseClient) {}

  /**
   * Subscribe to phone-specific updates
   */
  subscribeToPhone(phoneId: string, handlers: {
    onVoiceSettings?: (payload: any) => void;
    onConversationRules?: (payload: any) => void;
    onOperatingHours?: (payload: any) => void;
    onSmsSettings?: (payload: any) => void;
    onSettingsUpdate?: (payload: any) => void;
  }) {
    const channelKey = `phone:${phoneId}`;
    
    // Clean up existing channel if any
    this.unsubscribeFromPhone(phoneId);
    
    const channel = this.supabase.channel(channelKey);
    
    // Voice settings updates
    if (handlers.onVoiceSettings) {
      channel.on(
        'broadcast',
        { event: 'phone_voice_settings_updated' },
        handlers.onVoiceSettings
      );
    }
    
    // Conversation rules updates
    if (handlers.onConversationRules) {
      channel.on(
        'broadcast',
        { event: 'phone_conversation_rules_updated' },
        handlers.onConversationRules
      );
    }
    
    // Operating hours updates
    if (handlers.onOperatingHours) {
      channel.on(
        'broadcast',
        { event: 'phone_operating_hours_updated' },
        handlers.onOperatingHours
      );
    }
    
    // SMS settings updates
    if (handlers.onSmsSettings) {
      channel.on(
        'broadcast',
        { event: 'phone_sms_settings_updated' },
        handlers.onSmsSettings
      );
    }
    
    // Generic settings updates
    if (handlers.onSettingsUpdate) {
      channel.on(
        'broadcast',
        { event: 'phone_settings_updated' },
        handlers.onSettingsUpdate
      );
    }
    
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to phone channel: ${phoneId}`);
      }
    });
    
    this.channels.set(phoneId, channel);
    return channel;
  }

  /**
   * Subscribe to business-wide updates that affect all phones
   */
  subscribeToBusinessUpdates(businessId: string, handlers: {
    onPrimaryPhoneChanged?: (payload: any) => void;
    onPhoneAdded?: (payload: any) => void;
    onPhoneRemoved?: (payload: any) => void;
    onBusinessSettingsUpdate?: (payload: any) => void;
  }) {
    const channelKey = `business:${businessId}`;
    
    // Clean up existing channel if any
    if (this.channels.has(businessId)) {
      this.supabase.removeChannel(this.channels.get(businessId)!);
    }
    
    const channel = this.supabase.channel(channelKey);
    
    // Primary phone changes
    if (handlers.onPrimaryPhoneChanged) {
      channel.on(
        'broadcast',
        { event: 'primary_phone_changed' },
        handlers.onPrimaryPhoneChanged
      );
    }
    
    // Phone added
    if (handlers.onPhoneAdded) {
      channel.on(
        'broadcast',
        { event: 'phone_added' },
        handlers.onPhoneAdded
      );
    }
    
    // Phone removed
    if (handlers.onPhoneRemoved) {
      channel.on(
        'broadcast',
        { event: 'phone_removed' },
        handlers.onPhoneRemoved
      );
    }
    
    // Business settings updates
    if (handlers.onBusinessSettingsUpdate) {
      channel.on(
        'broadcast',
        { event: 'business_settings_updated' },
        handlers.onBusinessSettingsUpdate
      );
    }
    
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to business channel: ${businessId}`);
      }
    });
    
    this.channels.set(businessId, channel);
    return channel;
  }

  /**
   * Unsubscribe from phone updates
   */
  unsubscribeFromPhone(phoneId: string) {
    const channel = this.channels.get(phoneId);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(phoneId);
      console.log(`🔌 Unsubscribed from phone channel: ${phoneId}`);
    }
  }

  /**
   * Unsubscribe from business updates
   */
  unsubscribeFromBusiness(businessId: string) {
    const channel = this.channels.get(businessId);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(businessId);
      console.log(`🔌 Unsubscribed from business channel: ${businessId}`);
    }
  }

  /**
   * Broadcast an update to a phone-specific channel
   */
  async broadcastPhoneUpdate(phoneId: string, event: string, payload: any) {
    const channelKey = `phone:${phoneId}`;
    const channel = this.supabase.channel(channelKey);
    
    await channel.subscribe();
    
    try {
      await channel.send({
        type: 'broadcast',
        event,
        payload: {
          ...payload,
          phoneId,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      await this.supabase.removeChannel(channel);
    }
  }

  /**
   * Broadcast an update to a business-wide channel
   */
  async broadcastBusinessUpdate(businessId: string, event: string, payload: any) {
    const channelKey = `business:${businessId}`;
    const channel = this.supabase.channel(channelKey);
    
    await channel.subscribe();
    
    try {
      await channel.send({
        type: 'broadcast',
        event,
        payload: {
          ...payload,
          businessId,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      await this.supabase.removeChannel(channel);
    }
  }

  /**
   * Clean up all channels
   */
  cleanup() {
    this.channels.forEach((channel, key) => {
      this.supabase.removeChannel(channel);
      console.log(`🧹 Cleaned up channel: ${key}`);
    });
    this.channels.clear();
  }
}

// Export singleton instance for use in hooks
let phoneChannelManager: PhoneChannelManager | null = null;

export function getPhoneChannelManager(supabase: SupabaseClient): PhoneChannelManager {
  if (!phoneChannelManager) {
    phoneChannelManager = new PhoneChannelManager(supabase);
  }
  return phoneChannelManager;
}