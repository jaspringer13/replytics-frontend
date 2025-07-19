'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  
  useEffect(() => {
    // Log error with limited information to avoid exposing sensitive data
    console.error('[Error Boundary]', {
      message: error.message.substring(0, 100), // Limit message length
      digest: error.digest,
      timestamp: new Date().toISOString(),
      type: error.name,
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
            onClick={() => router.push('/')}
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