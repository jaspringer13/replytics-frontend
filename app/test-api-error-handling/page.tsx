'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api-client';
import { isNetworkError, isAuthenticationError, isValidationError, isRetryableError } from '@/lib/errors/guards';
import { AppError } from '@/lib/errors/types';

interface TestResult {
  endpoint: string;
  error?: AppError;
  isRetryable?: boolean;
  errorType?: string;
  retryCount?: number;
}

export default function TestAPIErrorHandling() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testEndpoint = async (endpoint: string, options?: RequestInit) => {
    setIsLoading(true);
    const result: TestResult = { endpoint };
    
    try {
      await apiClient.request(endpoint, options);
      result.error = undefined;
    } catch (error) {
      if (error instanceof Error) {
        result.error = error as AppError;
        result.isRetryable = isRetryableError(error);
        result.errorType = 
          isNetworkError(error) ? 'NetworkError' :
          isAuthenticationError(error) ? 'AuthenticationError' :
          isValidationError(error) ? 'ValidationError' :
          error.constructor.name;
      }
    }
    
    setResults(prev => [...prev, result]);
    setIsLoading(false);
  };

  const runTests = async () => {
    setResults([]);
    
    // Test various error scenarios
    await testEndpoint('/api/test/404'); // NotFoundError
    await testEndpoint('/api/test/401'); // AuthenticationError
    await testEndpoint('/api/test/500'); // ServerError
    await testEndpoint('/api/test/network-timeout'); // TimeoutError
    await testEndpoint('/api/test/validation', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' })
    }); // ValidationError
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">API Error Handling Test</h1>
      
      <div className="mb-6">
        <Button
          onClick={runTests}
          disabled={isLoading}
          className="mr-4"
        >
          Run Error Tests
        </Button>
        
        <Button
          onClick={() => setResults([])}
          variant="outline"
        >
          Clear Results
        </Button>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              result.error ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'
            }`}
          >
            <div className="font-semibold mb-2">{result.endpoint}</div>
            
            {result.error ? (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Error Type:</span> {result.errorType}
                </div>
                <div>
                  <span className="font-medium">Message:</span> {result.error.message}
                </div>
                <div>
                  <span className="font-medium">Code:</span> {result.error.code}
                </div>
                <div>
                  <span className="font-medium">Retryable:</span> {result.isRetryable ? 'Yes' : 'No'}
                </div>
                {result.error.context && (
                  <div>
                    <span className="font-medium">Context:</span>
                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(result.error.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-green-700">Success</div>
            )}
          </div>
        ))}
      </div>

      {results.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          Click "Run Error Tests" to test API error handling
        </div>
      )}
    </div>
  );
}