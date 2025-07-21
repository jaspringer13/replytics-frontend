/**
 * Extracted Integration UI Patterns from Voice Bot Admin
 * 
 * Key improvements over current implementation:
 * 1. Unified integration status cards with consistent UI
 * 2. Real-time status updates with loading states
 * 3. OAuth flow handling with popup windows
 * 4. Feature badges to show capabilities
 * 5. Last sync timestamps
 * 6. Error states with retry logic
 * 7. Configuration preview within the same page
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Check, 
  AlertTriangle, 
  ExternalLink,
  Settings,
  Loader2
} from 'lucide-react';

// Improved Integration Status Card Pattern
interface IntegrationCardProps {
  integration: {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    status: 'connected' | 'disconnected' | 'error';
    lastSync?: string;
    features: string[];
  };
  onConnect: (id: string) => Promise<void>;
  onDisconnect: (id: string) => Promise<void>;
  onConfigure?: (id: string) => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({ 
  integration, 
  onConnect, 
  onDisconnect,
  onConfigure 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Not Connected</Badge>;
    }
  };

  const handleAction = async () => {
    setIsLoading(true);
    try {
      if (integration.status === 'connected') {
        await onDisconnect(integration.id);
      } else {
        await onConnect(integration.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-start space-x-4 p-4 border rounded-lg">
      <div className="flex-shrink-0">
        {integration.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium">{integration.name}</h3>
            {getStatusIcon(integration.status)}
            {getStatusBadge(integration.status)}
          </div>
          
          <div className="flex space-x-2">
            {integration.status === 'connected' ? (
              <>
                {onConfigure && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onConfigure(integration.id)}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Configure
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleAction}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Disconnect'
                  )}
                </Button>
              </>
            ) : (
              <Button 
                size="sm"
                onClick={handleAction}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Connect
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3">
          {integration.description}
        </p>
        
        {integration.status === 'connected' && integration.lastSync && (
          <p className="text-xs text-muted-foreground mb-3">
            Last sync: {new Date(integration.lastSync).toLocaleString()}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2">
          {integration.features.map((feature) => (
            <Badge key={feature} variant="outline" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

// OAuth Flow Handler Pattern
export const useOAuthIntegration = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWithOAuth = async (
    authUrl: string, 
    integrationName: string,
    onSuccess?: () => void
  ) => {
    setIsConnecting(true);
    setError(null);

    try {
      // Open OAuth popup
      const popup = window.open(
        authUrl, 
        `${integrationName}_auth`, 
        'width=600,height=700,left=200,top=100'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Poll for popup closure and check for success
      const pollTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollTimer);
          setIsConnecting(false);
          
          // Give backend time to process the OAuth callback
          setTimeout(() => {
            onSuccess?.();
          }, 2000);
        }
      }, 500);

      // Cleanup on component unmount
      return () => clearInterval(pollTimer);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setIsConnecting(false);
    }
  };

  return { connectWithOAuth, isConnecting, error };
};

// Integration Status Fetcher with Error Handling
export const useIntegrationStatus = (businessId: string) => {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // API call would go here
      const response = await fetch(`/api/v2/dashboard/integrations/status?business_id=${businessId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch integrations');
      }
      
      const data = await response.json();
      setIntegrations(data.integrations);
      
    } catch (err) {
      console.error('Failed to fetch integrations:', err);
      setError('Failed to load integrations. Please try again.');
      
      // Set default integrations on error
      setIntegrations(getDefaultIntegrations());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, [businessId]);

  return { integrations, loading, error, refetch: fetchIntegrations };
};

// Default integrations fallback
const getDefaultIntegrations = () => [
  {
    id: 'square',
    name: 'Square',
    description: 'Accept payments and manage bookings through Square',
    status: 'disconnected',
    features: ['Payment Processing', 'Booking Management', 'Customer Database'],
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync appointments with Google Calendar',
    status: 'disconnected',
    features: ['Calendar Sync', 'Availability Management', 'Event Notifications'],
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect with 3000+ apps through automated workflows',
    status: 'disconnected',
    features: ['Workflow Automation', 'Data Synchronization', 'Custom Triggers'],
  },
];

// Test Connection Pattern
export const useTestConnection = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const testConnection = async (integrationId: string, businessId: string) => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/v2/dashboard/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integration_id: integrationId, business_id: businessId }),
      });

      const data = await response.json();
      
      setResult({
        success: response.ok,
        message: data.message || (response.ok ? 'Connection successful!' : 'Connection failed'),
      });

      return response.ok;
    } catch (err) {
      setResult({
        success: false,
        message: 'Failed to test connection. Please try again.',
      });
      return false;
    } finally {
      setTesting(false);
    }
  };

  return { testConnection, testing, result };
};

// Integration Configuration Preview Pattern
interface ConfigurationPreviewProps {
  title: string;
  icon: React.ReactNode;
  config: Record<string, any>;
  isActive: boolean;
}

export const ConfigurationPreview: React.FC<ConfigurationPreviewProps> = ({
  title,
  icon,
  config,
  isActive,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isActive ? (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              Integration is active and configured correctly.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Integration is not configured. Please connect to enable this feature.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(config).map(([key, value]) => (
            <div key={key}>
              <label className="text-sm font-medium text-muted-foreground">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </label>
              <p className="text-sm font-medium">
                {value || 'Not configured'}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};