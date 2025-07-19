"use client"

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building, Mic, Clock, Users, Link2, MessageSquare, Briefcase } from 'lucide-react';
import { BusinessProfileTab } from './BusinessProfileTab';
import { ServicesManagementTab } from './ServicesManagementTab';
import { OperatingHoursTab } from './OperatingHoursTab';
import { VoiceConversationTab } from './VoiceConversationTab';
import { SMSConfigurationTab } from './SMSConfigurationTab';
import { IntegrationsTab } from './IntegrationsTab';
import { StaffManagementTab } from './StaffManagementTab';
import { apiClient } from '@/lib/api-client';
import { realtimeConfigManager } from '@/lib/realtime-config';

interface SettingsProps {
  businessId: string;
}

export function Settings({ businessId }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('business-profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize real-time configuration updates
    if (businessId) {
      realtimeConfigManager.initialize(businessId).catch((err) => {
        console.error('Failed to initialize real-time config:', err);
      });

      return () => {
        realtimeConfigManager.disconnect();
      };
    }
  }, [businessId]);

  useEffect(() => {
    // Initial data loading
    const loadInitialData = async () => {
      try {
        setLoading(true);
        // Pre-load some essential data
        await Promise.all([
          apiClient.getBusinessProfile(),
          apiClient.getServices(),
          apiClient.getBusinessHours()
        ]);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load initial settings data:', err);
        setError('Failed to load settings. Please try again.');
        setLoading(false);
      }
    };

    loadInitialData();
  }, [businessId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-400">Loading settings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Business Settings</h1>
        <p className="text-gray-400">Manage your business configuration and AI voice agent settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 lg:grid-cols-7 gap-2 bg-gray-800/50 p-1">
          <TabsTrigger value="business-profile" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            <span className="hidden lg:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            <span className="hidden lg:inline">Services</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden lg:inline">Hours</span>
          </TabsTrigger>
          <TabsTrigger value="voice-conversation" className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            <span className="hidden lg:inline">Voice & AI</span>
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden lg:inline">SMS</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            <span className="hidden lg:inline">Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden lg:inline">Staff</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business-profile">
          <BusinessProfileTab businessId={businessId} />
        </TabsContent>

        <TabsContent value="services">
          <ServicesManagementTab businessId={businessId} />
        </TabsContent>

        <TabsContent value="hours">
          <OperatingHoursTab businessId={businessId} />
        </TabsContent>

        <TabsContent value="voice-conversation">
          <VoiceConversationTab businessId={businessId} />
        </TabsContent>

        <TabsContent value="sms">
          <SMSConfigurationTab businessId={businessId} />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsTab businessId={businessId} />
        </TabsContent>

        <TabsContent value="staff">
          <StaffManagementTab businessId={businessId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}