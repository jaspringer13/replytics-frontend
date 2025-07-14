'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { NetworkError, SystemError } from '@/lib/errors/types';

export default function TestErrorBoundary() {
  const [errorType, setErrorType] = useState<string>('');

  const triggerError = (type: string) => {
    setErrorType(type);
    
    switch (type) {
      case 'runtime':
        throw new Error('Test runtime error');
      
      case 'network':
        throw new NetworkError('Test network error', {
          url: '/api/test',
          method: 'GET',
          retryable: true,
        });
      
      case 'system':
        throw new SystemError('Test system error', {
          component: 'TestErrorBoundary',
          stack: new Error().stack,
        });
      
      case 'async':
        setTimeout(() => {
          throw new Error('Test async error');
        }, 100);
        break;
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Error Boundary Test Page</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800">
          Click any button below to trigger an error and test the error boundary.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-lg">
        <Button
          onClick={() => triggerError('runtime')}
          variant="outline"
          className="border-red-500 text-red-500 hover:bg-red-50"
        >
          Trigger Runtime Error
        </Button>
        
        <Button
          onClick={() => triggerError('network')}
          variant="outline"
          className="border-orange-500 text-orange-500 hover:bg-orange-50"
        >
          Trigger Network Error
        </Button>
        
        <Button
          onClick={() => triggerError('system')}
          variant="outline"
          className="border-purple-500 text-purple-500 hover:bg-purple-50"
        >
          Trigger System Error
        </Button>
        
        <Button
          onClick={() => triggerError('async')}
          variant="outline"
          className="border-blue-500 text-blue-500 hover:bg-blue-50"
        >
          Trigger Async Error
        </Button>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600">
          Last triggered error type: {errorType || 'None'}
        </p>
      </div>
      
      <div className="mt-4">
        <div data-active-call="true" className="hidden">
          Simulated active call indicator
        </div>
        <Button
          onClick={() => {
            const indicator = document.querySelector('[data-active-call]');
            if (indicator) {
              indicator.classList.toggle('hidden');
            }
          }}
          variant="outline"
          className="text-sm"
        >
          Toggle Active Call Simulation
        </Button>
      </div>
    </div>
  );
}