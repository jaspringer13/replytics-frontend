import { useState, useEffect, useCallback } from 'react';
import { useIsFetching, useIsMutating, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface ConnectionStatusData {
  status: ConnectionStatus;
  lastSyncTime: Date | null;
  isTokenRefreshing: boolean;
  message?: string;
}

interface UseConnectionStatusOptions {
  pollingInterval?: number;
}

export function useConnectionStatus(options?: UseConnectionStatusOptions) {
  const pollingInterval = options?.pollingInterval ?? 30000;
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusData>({
    status: 'connecting',
    lastSyncTime: null,
    isTokenRefreshing: false,
  });
  
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const queryClient = useQueryClient();
  
  // Check connection by making a lightweight API call
  const checkConnection = useCallback(async () => {
    try {
      // Use the stats endpoint as a health check
      await apiClient.request('/api/dashboard/stats');
      
      setConnectionStatus(prev => ({
        ...prev,
        status: 'connected',
        lastSyncTime: new Date(),
        message: undefined,
      }));
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { status?: number } };
        if (apiError.response?.status === 401) {
          setConnectionStatus(prev => ({
          ...prev,
          status: 'connecting',
          isTokenRefreshing: true,
          message: 'Refreshing authentication...',
        }));
      } else if (error instanceof Error && 
                (error.message.includes('fetch') || 
                 error.message.includes('network') || 
                 error.message.includes('Network') ||
                 error.name === 'NetworkError')) {
        setConnectionStatus(prev => ({
          ...prev,
          status: 'disconnected',
          message: 'Connection lost. Retrying...',
        }));
      } else {
        setConnectionStatus(prev => ({
          ...prev,
          status: 'error',
          message: error instanceof Error ? error.message : 'Something went wrong',
        }));
      }
    }
  }, []);
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      checkConnection();
    };
    
    const handleOffline = () => {
      setConnectionStatus(prev => ({
        ...prev,
        status: 'disconnected',
        message: 'No internet connection',
      }));
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    if (navigator.onLine) {
      checkConnection();
    } else {
      handleOffline();
    }
    
    // Periodic connection check
    const interval = setInterval(checkConnection, pollingInterval);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkConnection, pollingInterval]);
  
  // Monitor token refresh completion
  useEffect(() => {
    if (connectionStatus.isTokenRefreshing && isFetching === 0 && isMutating === 0) {
      setConnectionStatus(prev => ({
        ...prev,
        isTokenRefreshing: false,
      }));
    }
  }, [isFetching, isMutating, connectionStatus.isTokenRefreshing]);
  
  // Provide a manual retry function
  const retry = useCallback(() => {
    checkConnection();
    queryClient.refetchQueries();
  }, [checkConnection, queryClient]);
  
  return {
    ...connectionStatus,
    isLoading: isFetching > 0 || isMutating > 0,
    retry,
  };
}