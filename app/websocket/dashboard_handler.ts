/**
 * Real-time WebSocket handler for dashboard updates
 * Manages subscriptions for voice settings, services, and other real-time data
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js';

// Initialize Supabase client for real-time
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

export interface VoiceSettingsUpdate {
  businessId: string;
  settings: any;
  timestamp: string;
  requiresReload?: boolean;
}

export interface ServiceUpdate {
  businessId: string;
  type: 'created' | 'updated' | 'deleted' | 'reordered';
  service?: any;
  serviceId?: string;
  timestamp: string;
}

export interface BusinessUpdate {
  businessId: string;
  type: string;
  data: any;
  timestamp: string;
}

/**
 * Subscribe to voice settings changes for real-time updates
 * Critical for voice agent hot-reload functionality
 */
export function subscribeToVoiceSettings(
  businessId: string,
  onUpdate: (update: VoiceSettingsUpdate) => void
): RealtimeSubscription {
  const channel = supabase
    .channel(`voice-settings:${businessId}`)
    .on(
      'broadcast',
      { event: 'voice_settings_updated' },
      (payload) => {
        console.log('Voice settings update received:', payload);
        onUpdate(payload.payload as VoiceSettingsUpdate);
      }
    )
    .subscribe((status) => {
      console.log('Voice settings subscription status:', status);
    });

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Subscribe to conversation rules changes
 */
export function subscribeToConversationRules(
  businessId: string,
  onUpdate: (update: any) => void
): RealtimeSubscription {
  const channel = supabase
    .channel(`conversation-rules:${businessId}`)
    .on(
      'broadcast',
      { event: 'conversation_rules_updated' },
      (payload) => {
        console.log('Conversation rules update received:', payload);
        onUpdate(payload.payload);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Subscribe to service updates (create, update, delete, reorder)
 */
export function subscribeToServices(
  businessId: string,
  onUpdate: (update: ServiceUpdate) => void
): RealtimeSubscription {
  const channel = supabase
    .channel(`services:${businessId}`)
    .on(
      'broadcast',
      { event: '*' },
      (payload) => {
        console.log('Service update received:', payload);
        const eventType = payload.event.replace('service_', '').replace('services_', '');
        onUpdate({
          ...payload.payload,
          type: eventType
        } as ServiceUpdate);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Subscribe to general business updates
 */
export function subscribeToBusinessUpdates(
  businessId: string,
  onUpdate: (update: BusinessUpdate) => void
): RealtimeSubscription {
  const channel = supabase
    .channel(`business:${businessId}`)
    .on(
      'broadcast',
      { event: '*' },
      (payload) => {
        console.log('Business update received:', payload);
        onUpdate(payload.payload as BusinessUpdate);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Subscribe to operating hours changes
 */
export function subscribeToOperatingHours(
  businessId: string,
  onUpdate: (update: any) => void
): RealtimeSubscription {
  const channel = supabase
    .channel(`hours:${businessId}`)
    .on(
      'broadcast',
      { event: 'hours_updated' },
      (payload) => {
        console.log('Operating hours update received:', payload);
        onUpdate(payload.payload);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Subscribe to database table changes (for direct table monitoring)
 */
export function subscribeToTableChanges(
  table: string,
  filter?: { column: string; value: any },
  onChange?: (payload: any) => void
): RealtimeSubscription {
  let channel = supabase.channel(`db-${table}`);
  
  const subscription = channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: table,
      filter: filter ? `${filter.column}=eq.${filter.value}` : undefined,
    },
    (payload) => {
      console.log(`Table ${table} change:`, payload);
      if (onChange) {
        onChange(payload);
      }
    }
  );

  channel.subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Master subscription manager for all business-related real-time updates
 */
export class DashboardRealtimeManager {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private businessId: string;

  constructor(businessId: string) {
    this.businessId = businessId;
  }

  /**
   * Start all subscriptions
   */
  startAll(handlers: {
    onVoiceSettingsUpdate?: (update: VoiceSettingsUpdate) => void;
    onServiceUpdate?: (update: ServiceUpdate) => void;
    onBusinessUpdate?: (update: BusinessUpdate) => void;
    onConversationRulesUpdate?: (update: any) => void;
    onOperatingHoursUpdate?: (update: any) => void;
  }) {
    // Voice settings subscription (highest priority for real-time voice agent updates)
    if (handlers.onVoiceSettingsUpdate) {
      this.subscriptions.set(
        'voice-settings',
        subscribeToVoiceSettings(this.businessId, handlers.onVoiceSettingsUpdate)
      );
    }

    // Conversation rules subscription
    if (handlers.onConversationRulesUpdate) {
      this.subscriptions.set(
        'conversation-rules',
        subscribeToConversationRules(this.businessId, handlers.onConversationRulesUpdate)
      );
    }

    // Services subscription
    if (handlers.onServiceUpdate) {
      this.subscriptions.set(
        'services',
        subscribeToServices(this.businessId, handlers.onServiceUpdate)
      );
    }

    // General business updates
    if (handlers.onBusinessUpdate) {
      this.subscriptions.set(
        'business',
        subscribeToBusinessUpdates(this.businessId, handlers.onBusinessUpdate)
      );
    }

    // Operating hours
    if (handlers.onOperatingHoursUpdate) {
      this.subscriptions.set(
        'operating-hours',
        subscribeToOperatingHours(this.businessId, handlers.onOperatingHoursUpdate)
      );
    }

    console.log(`Started ${this.subscriptions.size} real-time subscriptions for business ${this.businessId}`);
  }

  /**
   * Stop all subscriptions
   */
  stopAll() {
    this.subscriptions.forEach((subscription, key) => {
      subscription.unsubscribe();
      console.log(`Unsubscribed from ${key}`);
    });
    this.subscriptions.clear();
  }

  /**
   * Stop a specific subscription
   */
  stop(key: string) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
      console.log(`Unsubscribed from ${key}`);
    }
  }

  /**
   * Check if a subscription is active
   */
  isActive(key: string): boolean {
    return this.subscriptions.has(key);
  }
}

// Export a singleton instance for the current business
let realtimeManager: DashboardRealtimeManager | null = null;

export function getRealtimeManager(businessId: string): DashboardRealtimeManager {
  if (!realtimeManager || realtimeManager['businessId'] !== businessId) {
    if (realtimeManager) {
      realtimeManager.stopAll();
    }
    realtimeManager = new DashboardRealtimeManager(businessId);
  }
  return realtimeManager;
}