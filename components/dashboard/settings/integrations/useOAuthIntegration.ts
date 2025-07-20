"use client"

import { useState, useEffect, useRef } from 'react';

interface OAuthOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useOAuthIntegration() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  const connectWithOAuth = async (
    authUrl: string, 
    integrationName: string,
    options: OAuthOptions = {}
  ) => {
    setIsConnecting(true);
    setError(null);

    try {
      // Open OAuth popup
      const popup = window.open(
        authUrl, 
        `${integrationName}_auth`, 
        'width=600,height=700,left=200,top=100'
      );

      if (!popup) {
        const error = 'Popup blocked. Please allow popups for this site.';
        setError(error);
        options.onError?.(error);
        return;
      }

      // Listen for messages from the popup
      const handleMessage = (event: MessageEvent) => {
        // Verify origin for security
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'oauth_success' && event.data.integration === integrationName) {
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
          options.onSuccess?.();
        } else if (event.data.type === 'oauth_error' && event.data.integration === integrationName) {
          window.removeEventListener('message', handleMessage);
          const error = event.data.error || 'OAuth authentication failed';
          setError(error);
          setIsConnecting(false);
          options.onError?.(error);
        }
      };

      window.addEventListener('message', handleMessage);

      // Poll for popup closure
      const pollTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollTimer);
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
          
          // If popup closed without sending a message, assume user cancelled
          if (isConnecting) {
            const error = 'Authentication cancelled';
            setError(error);
            options.onError?.(error);
          }
        }
      }, 500);

      // Store cleanup function
      cleanupRef.current = () => {
        clearInterval(pollTimer);
        window.removeEventListener('message', handleMessage);
        if (popup && !popup.closed) {
          popup.close();
        }
      };

    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to connect';
      setError(error);
      setIsConnecting(false);
      options.onError?.(error);
    }
  };

  return { connectWithOAuth, isConnecting, error };
}