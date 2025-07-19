'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Error Boundary]', {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-4">
          Something went wrong
        </h1>
        
        <p className="text-gray-600 text-center mb-6">
          We apologize for the inconvenience. Please try refreshing the page or contact support if the issue persists.
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
          
          <Button
            onClick={() => window.location.href = '/'}
            className="w-full"
            variant="outline"
          >
            Go to Homepage
          </Button>
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