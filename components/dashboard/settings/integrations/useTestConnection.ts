"use client"

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface TestConnectionResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

export function useTestConnection() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestConnectionResult | null>(null);

  const testConnection = async (integrationId: string): Promise<boolean> => {
    setTesting(true);
    setResult(null);

    try {
      // This would be a new API method that needs to be added to apiClient
      // For now, we'll simulate the API call
      const response = await fetch('/api/v2/dashboard/integrations/test', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ 
          integration_id: integrationId
        }),
      });

      const data = await response.json();
      
      const testResult: TestConnectionResult = {
        success: response.ok,
        message: data.message || (response.ok ? 'Connection successful!' : 'Connection failed'),
        details: data.details
      };
      
      setResult(testResult);
      return testResult.success;
      
    } catch (err) {
      const testResult: TestConnectionResult = {
        success: false,
        message: 'Failed to test connection. Please try again.',
      };
      
      setResult(testResult);
      return false;
      
    } finally {
      setTesting(false);
    }
  };

  const clearResult = () => {
    setResult(null);
  };

  return { testConnection, testing, result, clearResult };
}