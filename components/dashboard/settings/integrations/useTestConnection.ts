"use client"

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface TestConnectionResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export function useTestConnection() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestConnectionResult | null>(null);

  const testConnection = async (integrationId: string): Promise<boolean> => {
    setTesting(true);
    setResult(null);

    try {
      const data = await apiClient.testIntegration(integrationId);
      
      setResult(data);
      return data.success;
      
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