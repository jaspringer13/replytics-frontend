'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useStats } from '@/hooks/api/useStats';

export default function TestTokenExpiryPage() {
  const [expiryInfo, setExpiryInfo] = useState(apiClient.getTokenExpiryInfo());
  const [testLog, setTestLog] = useState<string[]>([]);
  const { refetch: refetchStats } = useStats();

  // Update expiry info every second
  useEffect(() => {
    const interval = setInterval(() => {
      setExpiryInfo(apiClient.getTokenExpiryInfo());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addLog = (message: string) => {
    setTestLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Simulate token with short expiry
  const setShortExpiryToken = () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Set token to expire in 4 minutes (will trigger proactive refresh)
      const expiresAt = new Date(Date.now() + 4 * 60 * 1000);
      apiClient.setToken(token, expiresAt.toISOString());
      addLog('Set token to expire in 4 minutes');
      setExpiryInfo(apiClient.getTokenExpiryInfo());
    }
  };

  // Simulate token with long expiry
  const setLongExpiryToken = () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Set token to expire in 30 minutes
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      apiClient.setToken(token, expiresAt.toISOString());
      addLog('Set token to expire in 30 minutes');
      setExpiryInfo(apiClient.getTokenExpiryInfo());
    }
  };

  // Test proactive refresh
  const testProactiveRefresh = async () => {
    addLog('Making API call to test proactive refresh...');
    try {
      await refetchStats();
      addLog('API call completed successfully');
      
      // Check if token was refreshed
      const newExpiryInfo = apiClient.getTokenExpiryInfo();
      if (newExpiryInfo.minutesUntilExpiry && newExpiryInfo.minutesUntilExpiry > 10) {
        addLog('✅ Token was proactively refreshed!');
      } else {
        addLog('Token was not refreshed (may not have been expiring soon)');
      }
    } catch (error: any) {
      addLog(`❌ API call failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Token Expiry Tracking Test</h1>
      
      {/* Current Token Status */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Current Token Status</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400">Expires At:</p>
            <p className="text-lg">
              {expiryInfo.expiresAt 
                ? new Date(expiryInfo.expiresAt).toLocaleString()
                : 'Not set (will not proactively refresh)'}
            </p>
          </div>
          
          <div>
            <p className="text-gray-400">Time Until Expiry:</p>
            <p className="text-lg">
              {expiryInfo.minutesUntilExpiry !== null
                ? `${expiryInfo.minutesUntilExpiry} minutes`
                : 'N/A'}
            </p>
          </div>
          
          <div>
            <p className="text-gray-400">Status:</p>
            <p className={`text-lg font-semibold ${
              expiryInfo.isExpired ? 'text-red-400' :
              expiryInfo.isExpiringSoon ? 'text-yellow-400' :
              'text-green-400'
            }`}>
              {expiryInfo.isExpired ? 'Expired' :
               expiryInfo.isExpiringSoon ? 'Expiring Soon (will refresh)' :
               'Valid'}
            </p>
          </div>
          
          <div>
            <p className="text-gray-400">Proactive Refresh:</p>
            <p className="text-lg">
              {expiryInfo.isExpiringSoon ? '✅ Enabled' : '❌ Not needed'}
            </p>
          </div>
        </div>
      </div>

      {/* Test Actions */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <button
              onClick={setShortExpiryToken}
              className="px-4 py-2 bg-yellow-500 rounded hover:bg-yellow-600"
            >
              Set Token to Expire in 4 Minutes
            </button>
            <button
              onClick={setLongExpiryToken}
              className="px-4 py-2 bg-green-500 rounded hover:bg-green-600"
            >
              Set Token to Expire in 30 Minutes
            </button>
          </div>
          
          <button
            onClick={testProactiveRefresh}
            className="px-4 py-2 bg-brand-500 rounded hover:bg-brand-600"
          >
            Test API Call (Will Proactively Refresh if Needed)
          </button>
        </div>
      </div>

      {/* Test Log */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test Log</h2>
        
        <div className="bg-gray-900 p-4 rounded max-h-60 overflow-y-auto">
          {testLog.length === 0 ? (
            <p className="text-gray-400">No test actions yet...</p>
          ) : (
            testLog.map((log, index) => (
              <p key={index} className="text-sm mb-1 font-mono">
                {log}
              </p>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
        <h3 className="text-blue-400 font-semibold mb-2">📘 How Proactive Token Refresh Works</h3>
        <ul className="text-sm text-gray-300 space-y-2">
          <li>• When the backend returns a token, it should include <code>expires_at</code> or <code>expires_in</code></li>
          <li>• The API client stores this expiry time in localStorage</li>
          <li>• Before each API request, it checks if token expires in less than 5 minutes</li>
          <li>• If yes, it proactively refreshes the token BEFORE making the request</li>
          <li>• This prevents 401 errors and provides a smoother user experience</li>
        </ul>
        
        <h3 className="text-blue-400 font-semibold mt-4 mb-2">🧪 Test Steps</h3>
        <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
          <li>Click "Set Token to Expire in 4 Minutes"</li>
          <li>Watch the status change to "Expiring Soon"</li>
          <li>Click "Test API Call" - it should proactively refresh</li>
          <li>Check the log to see if token was refreshed</li>
          <li>The expiry time should update to a new value</li>
        </ol>
      </div>
    </div>
  );
}