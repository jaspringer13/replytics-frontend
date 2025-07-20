/**
 * Integration Testing and Connection Verification Patterns
 * 
 * Extracted patterns for testing third-party integrations
 * with proper error handling and user feedback
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  Zap
} from 'lucide-react';

// Connection Test Result Component
interface TestResultProps {
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string[];
}

export const TestResult: React.FC<TestResultProps> = ({ status, message, details }) => {
  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getAlertClass = () => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  return (
    <Alert className={getAlertClass()}>
      {getIcon()}
      <AlertDescription>
        <div className="font-medium">{message}</div>
        {details && details.length > 0 && (
          <ul className="mt-2 list-disc list-inside text-sm">
            {details.map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
};

// Integration Test Card Pattern
interface IntegrationTestCardProps {
  integration: {
    id: string;
    name: string;
    icon: React.ReactNode;
    endpoints: string[];
  };
  businessId: string;
}

export const IntegrationTestCard: React.FC<IntegrationTestCardProps> = ({ 
  integration, 
  businessId 
}) => {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<Map<string, TestResultProps>>(new Map());

  const runTests = async () => {
    setTesting(true);
    setTestResults(new Map());

    for (const endpoint of integration.endpoints) {
      try {
        // Simulate API test
        const response = await fetch('/api/v2/dashboard/integrations/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            integration_id: integration.id,
            endpoint,
            business_id: businessId,
          }),
        });

        const data = await response.json();

        setTestResults(prev => new Map(prev).set(endpoint, {
          status: response.ok ? 'success' : 'error',
          message: data.message || (response.ok ? 'Connection successful' : 'Connection failed'),
          details: data.details,
        }));

      } catch (error) {
        setTestResults(prev => new Map(prev).set(endpoint, {
          status: 'error',
          message: 'Network error',
          details: ['Failed to reach the API endpoint'],
        }));
      }
    }

    setTesting(false);
  };

  const allTestsPassed = Array.from(testResults.values()).every(result => result.status === 'success');
  const hasTestResults = testResults.size > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {integration.icon}
            <span>{integration.name} Connection Test</span>
          </div>
          {hasTestResults && (
            <Badge variant={allTestsPassed ? 'default' : 'destructive'}>
              {allTestsPassed ? 'All Tests Passed' : 'Some Tests Failed'}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Verify connection and permissions for {integration.name}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Test Connection
            </>
          )}
        </Button>

        {testResults.size > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Test Results:</h4>
            {integration.endpoints.map(endpoint => {
              const result = testResults.get(endpoint);
              if (!result) return null;

              return (
                <div key={endpoint} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{endpoint}</span>
                    <Badge 
                      variant={result.status === 'success' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {result.status}
                    </Badge>
                  </div>
                  <TestResult {...result} />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Automatic Connection Health Check Hook
export const useConnectionHealthCheck = (
  integrationId: string,
  businessId: string,
  intervalMs = 60000 // Check every minute
) => {
  const [health, setHealth] = useState<'healthy' | 'degraded' | 'offline' | 'checking'>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [nextCheck, setNextCheck] = useState<Date | null>(null);

  React.useEffect(() => {
    const checkHealth = async () => {
      setHealth('checking');
      
      try {
        const response = await fetch('/api/v2/dashboard/integrations/health', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ integration_id: integrationId, business_id: businessId }),
        });

        const data = await response.json();
        
        if (response.ok && data.healthy) {
          setHealth('healthy');
        } else if (response.ok && data.degraded) {
          setHealth('degraded');
        } else {
          setHealth('offline');
        }
        
        setLastCheck(new Date());
        setNextCheck(new Date(Date.now() + intervalMs));
        
      } catch (error) {
        setHealth('offline');
        setLastCheck(new Date());
      }
    };

    // Initial check
    checkHealth();

    // Set up interval
    const interval = setInterval(checkHealth, intervalMs);

    return () => clearInterval(interval);
  }, [integrationId, businessId, intervalMs]);

  return { health, lastCheck, nextCheck };
};

// Connection Health Indicator Component
interface HealthIndicatorProps {
  integrationId: string;
  businessId: string;
}

export const ConnectionHealthIndicator: React.FC<HealthIndicatorProps> = ({ 
  integrationId, 
  businessId 
}) => {
  const { health, lastCheck } = useConnectionHealthCheck(integrationId, businessId);

  const getHealthIcon = () => {
    switch (health) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-gray-600" />;
    }
  };

  const getHealthLabel = () => {
    switch (health) {
      case 'healthy':
        return 'Connected';
      case 'degraded':
        return 'Degraded';
      case 'offline':
        return 'Offline';
      case 'checking':
        return 'Checking...';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getHealthIcon()}
      <span className="text-sm font-medium">{getHealthLabel()}</span>
      {lastCheck && (
        <span className="text-xs text-muted-foreground">
          Last checked: {lastCheck.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

// Batch Connection Tester for Multiple Integrations
export const useBatchConnectionTest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<Map<string, boolean>>(new Map());

  const testConnections = async (integrations: Array<{ id: string; name: string }>, businessId: string) => {
    setTesting(true);
    setResults(new Map());

    const testPromises = integrations.map(async (integration) => {
      try {
        const response = await fetch('/api/v2/dashboard/integrations/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            integration_id: integration.id, 
            business_id: businessId 
          }),
        });

        return { id: integration.id, success: response.ok };
      } catch (error) {
        return { id: integration.id, success: false };
      }
    });

    const testResults = await Promise.all(testPromises);
    
    const resultsMap = new Map(
      testResults.map(result => [result.id, result.success])
    );
    
    setResults(resultsMap);
    setTesting(false);

    return resultsMap;
  };

  return { testConnections, testing, results };
};