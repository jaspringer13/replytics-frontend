import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing. Real-time features will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

export const subscribeToCallsTable = (
  callback: (payload: any) => void,
  filter?: { column: string; value: any }
): RealtimeSubscription => {
  const channel = supabase
    .channel('calls-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'calls',
        filter: filter ? `${filter.column}=eq.${filter.value}` : undefined,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
};

export const subscribeToSMSTable = (
  callback: (payload: any) => void,
  filter?: { column: string; value: any }
): RealtimeSubscription => {
  const channel = supabase
    .channel('sms-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sms_messages',
        filter: filter ? `${filter.column}=eq.${filter.value}` : undefined,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
};

export const subscribeToDailyAnalytics = (
  callback: (payload: any) => void
): RealtimeSubscription => {
  const channel = supabase
    .channel('analytics-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'daily_analytics',
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
};

export const subscribeToBookings = (
  callback: (payload: any) => void,
  filter?: { column: string; value: any }
): RealtimeSubscription => {
  const channel = supabase
    .channel('bookings-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: filter ? `${filter.column}=eq.${filter.value}` : undefined,
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
};

export const subscribeToActiveCall = (
  phoneNumber: string,
  callback: (payload: any) => void
): RealtimeSubscription => {
  return subscribeToCallsTable(callback, {
    column: 'phone_number',
    value: phoneNumber,
  });
};

export const subscribeToConversation = (
  conversationId: string,
  callback: (payload: any) => void
): RealtimeSubscription => {
  return subscribeToSMSTable(callback, {
    column: 'conversation_id',
    value: conversationId,
  });
};