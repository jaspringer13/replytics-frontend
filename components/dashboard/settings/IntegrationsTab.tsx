"use client"

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Calendar, CreditCard, Zap, MessageSquare, Phone, ExternalLink } from 'lucide-react';

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
}

const integrations: Integration[] = [
  {
    id: 'square',
    name: 'Square',
    description: 'Process payments and sync inventory',
    icon: <CreditCard className="w-6 h-6" />,
    status: 'coming_soon',
    category: 'Payments'
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync appointments with Google Calendar',
    icon: <Calendar className="w-6 h-6" />,
    status: 'coming_soon',
    category: 'Calendar'
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
    status: 'connected',
    category: 'Communication'
  }
];

export function IntegrationsTab({ businessId }: IntegrationsTabProps) {
  const handleConfigure = (integrationId: string) => {
    console.log('Configure integration:', integrationId);
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
                      integration.status === 'connected' ? 'default' : 
                      integration.status === 'available' ? 'outline' : 
                      'secondary'
                    }
                  >
                    {integration.status === 'connected' ? 'Connected' : 
                     integration.status === 'available' ? 'Available' : 
                     'Coming Soon'}
                  </Badge>
                </div>

                <div className="flex justify-end">
                  {integration.status === 'connected' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConfigure(integration.id)}
                      className="text-gray-300 border-gray-600"
                    >
                      Configure
                    </Button>
                  ) : integration.status === 'available' ? (
                    <Button
                      size="sm"
                      onClick={() => handleConfigure(integration.id)}
                      className="bg-brand-500 hover:bg-brand-600"
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
        <Button variant="outline" className="text-blue-400 border-blue-600 hover:bg-blue-900/30">
          <ExternalLink className="w-4 h-4 mr-2" />
          Request Integration
        </Button>
      </Card>
    </div>
  );
}