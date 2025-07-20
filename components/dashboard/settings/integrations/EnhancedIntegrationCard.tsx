"use client"

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Check, 
  AlertTriangle, 
  ExternalLink,
  Settings,
  Loader2,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

interface IntegrationCardProps {
  integration: {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    status: 'connected' | 'available' | 'coming_soon' | 'error';
    lastSync?: string;
    features: string[];
    category: string;
    oauthUrl?: string;
  };
  onConnect: (id: string) => Promise<void>;
  onDisconnect: (id: string) => Promise<void>;
  onConfigure?: (id: string) => void;
  onTestConnection?: (id: string) => Promise<boolean>;
}

export function EnhancedIntegrationCard({ 
  integration, 
  onConnect, 
  onDisconnect,
  onConfigure,
  onTestConnection 
}: IntegrationCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);
  const { toast } = useToast();

  const getStatusIcon = () => {
    switch (integration.status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    switch (integration.status) {
      case 'connected':
        return <Badge className="bg-green-900/20 text-green-400 border-green-700">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'coming_soon':
        return <Badge variant="secondary">Coming Soon</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-400">Available</Badge>;
    }
  };

  const handleAction = async () => {
    setIsLoading(true);
    try {
      if (integration.status === 'connected') {
        await onDisconnect(integration.id);
      } else if (integration.status === 'available') {
        await onConnect(integration.id);
      }
    } catch (error) {
      toast.error(`Failed to ${integration.status === 'connected' ? 'disconnect' : 'connect'} ${integration.name}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!onTestConnection) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const success = await onTestConnection(integration.id);
      setTestResult(success ? 'success' : 'failed');
      
      if (success) {
        toast.success('Connection test successful!');
      } else {
        toast.error('Connection test failed. Please check your configuration.');
      }
      
      // Clear test result after 5 seconds
      setTimeout(() => setTestResult(null), 5000);
    } catch (error) {
      setTestResult('failed');
      toast.error('Failed to test connection');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="p-6 bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gray-700/50 rounded-lg text-brand-400">
              {integration.icon}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-white">{integration.name}</h3>
                {getStatusIcon()}
              </div>
              <p className="text-sm text-gray-400 mb-2">{integration.description}</p>
              
              {/* Last sync info */}
              {integration.status === 'connected' && integration.lastSync && (
                <p className="text-xs text-gray-500">
                  Last sync: {new Date(integration.lastSync).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          
          {getStatusBadge()}
        </div>
        
        {/* Features */}
        <div className="flex flex-wrap gap-2">
          {integration.features.map((feature) => (
            <Badge 
              key={feature} 
              variant="outline" 
              className="text-xs bg-gray-700/30 border-gray-600 text-gray-300"
            >
              {feature}
            </Badge>
          ))}
        </div>
        
        {/* Test Result */}
        {testResult && (
          <div className={cn(
            "p-3 rounded-lg text-sm flex items-center gap-2",
            testResult === 'success' 
              ? "bg-green-900/20 text-green-400 border border-green-700" 
              : "bg-red-900/20 text-red-400 border border-red-700"
          )}>
            {testResult === 'success' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Connection test successful
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                Connection test failed
              </>
            )}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {integration.status === 'connected' ? (
            <>
              {onTestConnection && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="text-gray-300 border-gray-600"
                >
                  {isTesting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Test
                    </>
                  )}
                </Button>
              )}
              
              {onConfigure && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onConfigure(integration.id)}
                  className="text-gray-300 border-gray-600"
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
                className="text-red-400 border-red-600 hover:bg-red-900/20"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Disconnect'
                )}
              </Button>
            </>
          ) : integration.status === 'available' ? (
            <Button 
              size="sm"
              onClick={handleAction}
              disabled={isLoading}
              className="bg-brand-600 hover:bg-brand-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Connect
                  {integration.oauthUrl && <ExternalLink className="w-4 h-4 ml-1" />}
                </>
              )}
            </Button>
          ) : integration.status === 'error' ? (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onConfigure?.(integration.id)}
                className="text-orange-400 border-orange-600"
              >
                <Settings className="w-4 h-4 mr-1" />
                Fix Configuration
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAction}
                disabled={isLoading}
                className="text-red-400 border-red-600"
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              disabled
              className="bg-gray-700 text-gray-500"
            >
              Coming Soon
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}