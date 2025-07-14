'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';
import { AppError } from '@/lib/errors/types';
import { ErrorFactory } from '@/lib/errors/factory';

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, parameters: any) => void;
  }
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [hasActiveCall, setHasActiveCall] = useState(false);
  
  useEffect(() => {
    const appError = error instanceof AppError ? error : ErrorFactory.fromError(error);
    
    const checkActiveCall = () => {
      const callIndicator = document.querySelector('[data-active-call="true"]');
      const isCallActive = !!callIndicator;
      setHasActiveCall(isCallActive);
      return isCallActive;
    };
    
    const isCallActive = checkActiveCall();
    
    console.error('[Global Error Boundary]', {
      error: appError,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      hasActiveCall: isCallActive,
    });
    
    if (isCallActive) {
      console.warn('[CRITICAL] Error occurred during active voice call - preserving call state');
    }
    
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: appError.message,
        fatal: appError.severity === 'critical',
        error_type: appError.code,
      });
    }
  }, [error]);
  
  const isCallActive = hasActiveCall;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-4">
          {isCallActive ? 'System Error (Call Active)' : 'Something went wrong'}
        </h1>
        
        <p className="text-gray-600 text-center mb-6">
          {isCallActive 
            ? "We've encountered an error, but your call is still active. The system is working to recover."
            : "We're sorry, but something unexpected happened. Please try again or contact support if the issue persists."
          }
        </p>
        
        {error.digest && (
          <p className="text-sm text-gray-500 text-center mb-6">
            Error ID: {error.digest}
          </p>
        )}
        
        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full"
            variant="default"
          >
            Try Again
          </Button>
          
          {!isCallActive && (
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full"
              variant="outline"
            >
              Go to Homepage
            </Button>
          )}
          
          {isCallActive && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800 text-center">
                Your call is still connected. Do not refresh the page.
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <a
            href="/dashboard/support"
            className="text-sm text-blue-600 hover:underline"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}