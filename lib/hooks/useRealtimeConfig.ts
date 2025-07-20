"use client"

import { useEffect, useState, useRef, useCallback } from 'react';
import { realtimeConfigManager } from '@/lib/realtime-config';

export interface UseRealtimeConfigOptions {
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  isPhoneSpecific?: boolean;
}

export interface UseRealtimeConfigReturn {
  connected: boolean;
  error: Error | null;
  reconnect: () => Promise<void>;
  disconnect: () => void;
}

export function useRealtimeConfig(
  businessId: string | null,
  options: UseRealtimeConfigOptions = {}
): UseRealtimeConfigReturn {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  const {
    onError,
    onConnect,
    onDisconnect,
    autoReconnect = true,
  } = options;

  const connect = useCallback(async () => {
    if (!businessId || !mountedRef.current) return;

    try {
      setError(null);
      await realtimeConfigManager.initialize(businessId);
      
      if (mountedRef.current) {
        setConnected(true);
        onConnect?.();
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect');
      console.error('Failed to initialize real-time config:', error);
      
      if (mountedRef.current) {
        setError(error);
        setConnected(false);
        onError?.(error);

        // Auto-reconnect logic
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, 5000); // Retry after 5 seconds
        }
      }
    }
  }, [businessId, onConnect, onError, autoReconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    realtimeConfigManager.disconnect();
    setConnected(false);
    onDisconnect?.();
  }, [onDisconnect]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (businessId) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [businessId]); // Only re-run if businessId changes

  return {
    connected,
    error,
    reconnect: connect,
    disconnect,
  };
}