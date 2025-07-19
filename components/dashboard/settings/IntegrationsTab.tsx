"use client"

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Calendar, CreditCard, Zap, MessageSquare, Phone, ExternalLink, Settings, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface IntegrationsTabProps {
  businessId: string;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'available' | 'coming_soon';
  category: string;
  configUrl?: string;
  oauthUrl?: string;
}

interface IntegrationConfig {
  [key: string]: {
    connected: boolean;
    settings?: Record<string, any>;
    lastSync?: string;
  };
}

interface ConfigModalProps {
  integration: Integration;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: Record<string, any>) => void;
  currentConfig?: Record<string, any>;
}

function ConfigModal({ integration, isOpen, onClose, onSave, currentConfig }: ConfigModalProps) {
  const [config, setConfig] = useState(currentConfig || {});

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Configure {integration.name}</h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          {integration.id === 'twilio' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Account SID
                </label>
                <input
                  type="text"
                  value={config.accountSid || ''}
                  onChange={(e) => setConfig({ ...config, accountSid: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="Enter Twilio Account SID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Auth Token
                </label>
                <input
                  type="password"
                  value={config.authToken || ''}
                  onChange={(e) => setConfig({ ...config, authToken: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="Enter Twilio Auth Token"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={config.phoneNumber || ''}
                  onChange={(e) => setConfig({ ...config, phoneNumber: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="+1234567890"
                />
              </div>
            </>
          )}
          
          {integration.id === 'google-calendar' && (
            <div className="text-gray-400">
              <p>You'll be redirected to Google to authorize calendar access.</p>
            </div>
          )}
          
          {integration.id === 'square' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Application ID
                </label>
                <input
                  type="text"
                  value={config.applicationId || ''}
                  onChange={(e) => setConfig({ ...config, applicationId: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="Enter Square Application ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Access Token
                </label>
                <input
                  type="password"
                  value={config.accessToken || ''}
                  onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="Enter Square Access Token"
                />
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}

const integrations: Integration[] = [
  {
    id: 'square',
    name: 'Square',
    description: 'Process payments and sync inventory',
    icon: <CreditCard className="w-6 h-6" />,
    status: 'available',
    category: 'Payments'
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync appointments with Google Calendar',
    icon: <Calendar className="w-6 h-6" />,
    status: 'available',
    category: 'Calendar',
    oauthUrl: '/api/auth/google-calendar'
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect with 5,000+ apps',
    icon: <Zap className="w-6 h-6" />,
    status: 'coming_soon',
    category: 'Automation'
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Voice and SMS services',
    icon: <Phone className="w-6 h-6" />,
    status: 'available',
    category: 'Communication'
  }
];

export function IntegrationsTab({ businessId }: IntegrationsTabProps) {
  const { toast } = useToast();
  const [integrationConfigs, setIntegrationConfigs] = useState<IntegrationConfig>({});
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load integration configurations for this business
  useEffect(() => {
    const loadIntegrationConfigs = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/v2/dashboard/business/integrations?businessId=${businessId}`, {
        //   headers: { 'X-Tenant-ID': businessId }
        // });
        // const data = await response.json();
        
        // Mock data for now - in a real app this would come from the API
        setIntegrationConfigs({
          twilio: {
            connected: true,
            settings: {
              accountSid: 'AC***************',
              phoneNumber: '+1234567890'
            },
            lastSync: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Failed to load integration configs:', error);
        toast.error('Failed to load integration settings');
      }
    };

    if (businessId) {
      loadIntegrationConfigs();
    }
  }, [businessId, toast]);

  const handleConfigure = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration) return;

    if (integration.status === 'coming_soon') {
      toast.error('This integration is not yet available');
      return;
    }

    // Handle OAuth integrations (like Google Calendar)
    if (integration.oauthUrl) {
      const authUrl = `${integration.oauthUrl}?businessId=${businessId}&redirect_uri=${encodeURIComponent(window.location.origin + '/dashboard/settings?tab=integrations')}`;
      window.location.href = authUrl;
      return;
    }

    // Handle configuration modal for API-key based integrations
    setSelectedIntegration(integration);
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = async (config: Record<string, any>) => {
    if (!selectedIntegration) return;

    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/v2/dashboard/business/integrations/${selectedIntegration.id}`, {
      //   method: 'POST',
      //   headers: { 
      //     'Content-Type': 'application/json', 
      //     'X-Tenant-ID': businessId 
      //   },
      //   body: JSON.stringify(config)
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to save configuration');
      // }

      // Update local state (in real app, this would be returned from the API)
      setIntegrationConfigs(prev => ({
        ...prev,
        [selectedIntegration.id]: {
          connected: true,
          settings: config,
          lastSync: new Date().toISOString()
        }
      }));

      toast.success(`${selectedIntegration.name} configured successfully`);
    } catch (error) {
      console.error('Failed to save integration config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return;

    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/v2/dashboard/business/integrations/${integrationId}`, {
      //   method: 'DELETE',
      //   headers: { 'X-Tenant-ID': businessId }
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to disconnect integration');
      // }

      setIntegrationConfigs(prev => {
        const updated = { ...prev };
        delete updated[integrationId];
        return updated;
      });

      const integration = integrations.find(i => i.id === integrationId);
      toast.success(`${integration?.name} disconnected successfully`);
    } catch (error) {
      console.error('Failed to disconnect integration:', error);
      toast.error('Failed to disconnect integration');
    } finally {
      setLoading(false);
    }
  };

  const categorizedIntegrations = integrations.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = [];
    }
    acc[integration.category].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

  return (
    <div className="space-y-6">
      {Object.entries(categorizedIntegrations).map(([category, categoryIntegrations]) => (
        <div key={category}>
          <h3 className="text-lg font-medium text-white mb-4">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryIntegrations.map((integration) => (
              <Card 
                key={integration.id}
                className="p-6 bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-700/50 rounded-lg text-brand-400">
                      {integration.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{integration.name}</h4>
                      <p className="text-sm text-gray-400">{integration.description}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      integrationConfigs[integration.id]?.connected ? 'default' : 
                      integration.status === 'available' ? 'outline' : 
                      'secondary'
                    }
                  >
                    {integrationConfigs[integration.id]?.connected ? 'Connected' : 
                     integration.status === 'available' ? 'Available' : 
                     'Coming Soon'}
                  </Badge>
                </div>

                {integrationConfigs[integration.id]?.connected && (
                  <div className="text-xs text-green-400 mb-2">
                    ✓ Connected • Last sync: {new Date(integrationConfigs[integration.id].lastSync!).toLocaleDateString()}
                  </div>
                )}
                
                <div className="flex justify-end gap-2">
                  {integrationConfigs[integration.id]?.connected ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfigure(integration.id)}
                        className="text-gray-300 border-gray-600"
                        disabled={loading}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Configure
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(integration.id)}
                        className="text-red-400 border-red-600 hover:bg-red-900/20"
                        disabled={loading}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : integration.status === 'available' ? (
                    <Button
                      size="sm"
                      onClick={() => handleConfigure(integration.id)}
                      className="bg-brand-500 hover:bg-brand-600"
                      disabled={loading}
                    >
                      Connect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled
                      className="bg-gray-700 text-gray-400"
                    >
                      Coming Soon
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Card className="p-6 bg-blue-900/20 border-blue-700">
        <h3 className="text-lg font-medium text-white mb-2">Need a different integration?</h3>
        <p className="text-gray-400 mb-4">
          We're constantly adding new integrations. Let us know what you need!
        </p>
        <Button 
          variant="outline" 
          className="text-blue-400 border-blue-600 hover:bg-blue-900/30"
          onClick={() => window.open('mailto:support@replytics.com?subject=Integration Request&body=Hi, I would like to request a new integration for:', '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Request Integration
        </Button>
      </Card>
      
      <ConfigModal
        integration={selectedIntegration!}
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleSaveConfig}
        currentConfig={selectedIntegration ? integrationConfigs[selectedIntegration.id]?.settings : undefined}
      />
    </div>
  );
}