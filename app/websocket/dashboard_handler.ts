/**
 * Real-time WebSocket handler for dashboard updates
 * Manages subscriptions for voice settings, services, and other real-time data
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js';

// Conditional logging for production environment
const isDevelopment = process.env.NODE_ENV === 'development';

const log = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

// Validate required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Initialize Supabase client for real-time
const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

export interface VoiceSettingsUpdate<T = unknown> {
  businessId: string;
  settings: T;
  timestamp: string;
  requiresReload?: boolean;
}

export interface ServiceUpdate<T = unknown> {
  businessId: string;
  type: 'created' | 'updated' | 'deleted' | 'reordered';
  service?: T;
  serviceId?: string;
  timestamp: string;
}

export interface ConversationRulesUpdate {
  businessId: string;
  rules: unknown;
  timestamp: string;
}

export interface BusinessUpdate<T = unknown> {
  businessId: string;
  type: string;
  data: T;
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
        log('Voice settings update received:', payload);
        onUpdate(payload.payload as VoiceSettingsUpdate);
      }
    )
    .subscribe((status) => {
      log('Voice settings subscription status:', status);
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
  onUpdate: (update: ConversationRulesUpdate) => void
): RealtimeSubscription {
  const channel = supabase
    .channel(`conversation-rules:${businessId}`)
    .on(
      'broadcast',
      { event: 'conversation_rules_updated' },
      (payload) => {
        log('Conversation rules update received:', payload);
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
        log('Service update received:', payload);
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
        log('Business update received:', payload);
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

export interface OperatingHoursUpdate {
  businessId: string;
  hours: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>;
  timestamp: string;
}

/**
 * Subscribe to operating hours changes
 */
export function subscribeToOperatingHours(
  businessId: string,
  onUpdate: (update: OperatingHoursUpdate) => void
): RealtimeSubscription {
  const channel = supabase
    .channel(`hours:${businessId}`)
    .on(
      'broadcast',
      { event: 'hours_updated' },
      (payload) => {
        log('Operating hours update received:', payload);
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

export interface TableChangePayload<T = unknown> {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  old: T | null;
  new: T | null;
}

/**
 * Subscribe to database table changes (for direct table monitoring)
 */
export function subscribeToTableChanges<T = unknown>(
  table: string,
  filter?: { column: string; value: string | number | boolean },
  onChange?: (payload: TableChangePayload<T>) => void
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
      log(`Table ${table} change:`, payload);
      if (onChange) {
        // Transform Supabase payload to match TableChangePayload interface
        const transformedPayload: TableChangePayload<T> = {
          type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          table: payload.table,
          schema: payload.schema,
          old: payload.old as T | null,
          new: payload.new as T | null
        };
        onChange(transformedPayload);
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
  private readonly businessId: string;

  constructor(businessId: string) {
    this.businessId = businessId;
  }

  getBusinessId(): string {
    return this.businessId;
  }

  /**
   * Start all subscriptions
   */
  startAll(handlers: {
    onVoiceSettingsUpdate?: (update: VoiceSettingsUpdate) => void;
    onServiceUpdate?: (update: ServiceUpdate) => void;
    onBusinessUpdate?: (update: BusinessUpdate) => void;
    onConversationRulesUpdate?: (update: ConversationRulesUpdate) => void;
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

    log(`Started ${this.subscriptions.size} real-time subscriptions for business ${this.businessId}`);
  }

  /**
   * Stop all subscriptions
   */
  stopAll() {
    this.subscriptions.forEach((subscription, key) => {
      subscription.unsubscribe();
      log(`Unsubscribed from ${key}`);
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
      log(`Unsubscribed from ${key}`);
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
  if (!realtimeManager || realtimeManager.getBusinessId() !== businessId) {
    if (realtimeManager) {
      realtimeManager.stopAll();
    }
    realtimeManager = new DashboardRealtimeManager(businessId);
  }
  return realtimeManager;
}