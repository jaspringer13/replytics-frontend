'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export default function TestTokenRefreshPage() {
  const { token, tenantId } = useAuth();
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    result: 'pending' | 'success' | 'failed';
    message: string;
  }>>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test: string, result: 'success' | 'failed', message: string) => {
    setTestResults(prev => [...prev, { test, result, message }]);
  };

  const runTokenRefreshTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Test 1: Verify current auth state
      addResult('Auth State Check', 'success', `Token: ${token ? 'Present' : 'Missing'}, Tenant: ${tenantId || 'Missing'}`);

      // Test 2: Make a normal API call
      try {
        const stats = await apiClient.fetchDashboardStats();
        addResult('Normal API Call', 'success', `Retrieved stats: ${stats.totalCalls} total calls`);
      } catch (error: any) {
        addResult('Normal API Call', 'failed', error.message);
      }

      // Test 3: Simulate expired token (force 401)
      const originalToken = localStorage.getItem('auth_token');
      localStorage.setItem('auth_token', 'invalid-token');
      apiClient.setToken('invalid-token');

      try {
        // This should trigger token refresh
        const stats = await apiClient.fetchDashboardStats();
        const newToken = localStorage.getItem('auth_token');
        
        if (newToken !== 'invalid-token' && newToken !== originalToken) {
          addResult('Token Refresh on 401', 'success', 'Token was refreshed successfully');
        } else {
          addResult('Token Refresh on 401', 'failed', 'Token was not refreshed');
        }
      } catch (error: any) {
        addResult('Token Refresh on 401', 'failed', `Error: ${error.message}`);
        // Restore original token
        if (originalToken) {
          localStorage.setItem('auth_token', originalToken);
          apiClient.setToken(originalToken);
        }
      }

      // Test 4: Simulate multiple concurrent 401s
      const concurrentRequests = 5;
      localStorage.setItem('auth_token', 'invalid-token-2');
      apiClient.setToken('invalid-token-2');

      try {
        const promises = Array(concurrentRequests).fill(null).map(() => 
          apiClient.fetchDashboardStats()
        );
        
        const results = await Promise.allSettled(promises);
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        
        if (successCount === concurrentRequests) {
          addResult('Concurrent 401 Handling', 'success', `All ${concurrentRequests} requests succeeded after refresh`);
        } else {
          addResult('Concurrent 401 Handling', 'failed', `Only ${successCount}/${concurrentRequests} requests succeeded`);
        }
      } catch (error: any) {
        addResult('Concurrent 401 Handling', 'failed', error.message);
      }

      // Test 5: Verify request queue works
      let queueTestPassed = true;
      const refreshStartTime = Date.now();
      
      // Force another 401
      localStorage.setItem('auth_token', 'invalid-token-3');
      apiClient.setToken('invalid-token-3');

      // Make requests that should be queued
      const queuedPromises = [
        apiClient.fetchDashboardStats(),
        apiClient.fetchCalls({ limit: 5 }),
        apiClient.fetchBookings({ limit: 5 }),
      ];

      try {
        const results = await Promise.all(queuedPromises);
        const refreshEndTime = Date.now();
        const refreshDuration = refreshEndTime - refreshStartTime;

        // If all succeed and it took less than 3 seconds, queue worked
        if (results.length === 3 && refreshDuration < 3000) {
          addResult('Request Queue', 'success', `3 requests queued and processed in ${refreshDuration}ms`);
        } else {
          addResult('Request Queue', 'failed', 'Queue may not be working properly');
        }
      } catch (error: any) {
        addResult('Request Queue', 'failed', error.message);
      }

      // Restore original token
      if (originalToken) {
        localStorage.setItem('auth_token', originalToken);
        apiClient.setToken(originalToken);
      }

    } catch (error: any) {
      addResult('Test Suite', 'failed', `Unexpected error: ${error.message}`);
    }

    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Token Refresh Mechanism Test</h1>
      
      <div className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Current Auth State</h2>
        <p>Token: {token ? `${token.substring(0, 30)}...` : 'No token'}</p>
        <p>Tenant ID: {tenantId || 'No tenant ID'}</p>
        <p>Backend URL: {process.env.NEXT_PUBLIC_BACKEND_API_URL || 'Not configured'}</p>
      </div>

      <button
        onClick={runTokenRefreshTests}
        disabled={isRunning}
        className="mb-8 px-6 py-3 bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning ? 'Running Tests...' : 'Run Token Refresh Tests'}
      </button>

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.result === 'success'
                  ? 'bg-green-900/20 border-green-700'
                  : result.result === 'failed'
                  ? 'bg-red-900/20 border-red-700'
                  : 'bg-gray-800 border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{result.test}</h3>
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    result.result === 'success'
                      ? 'bg-green-500 text-white'
                      : result.result === 'failed'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {result.result.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-2">{result.message}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
        <h3 className="text-yellow-400 font-semibold mb-2">⚠️ Important Notes</h3>
        <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
          <li>These tests will temporarily invalidate your token multiple times</li>
          <li>If refresh fails, you may need to sign in again</li>
          <li>Check browser console for detailed error messages</li>
          <li>Ensure backend is running and NEXT_PUBLIC_BACKEND_API_URL is set</li>
        </ul>
      </div>
    </div>
  );
}