"use client"

import React, { lazy, Suspense } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { useSettings } from '@/contexts/SettingsContext';

// Lazy load tab components for better performance
const BusinessProfileTab = lazy(() => 
  import('./BusinessProfileTab').then(m => ({ default: m.BusinessProfileTab }))
);
const ServicesManagementTab = lazy(() => 
  import('./ServicesManagementTab').then(m => ({ default: m.ServicesManagementTab }))
);
const HoursEditor = lazy(() => 
  import('./HoursEditor').then(m => ({ default: m.HoursEditor }))
);
const VoiceConversationTab = lazy(() => 
  import('./VoiceConversationTab').then(m => ({ default: m.VoiceConversationTab }))
);
const SMSConfigurationTab = lazy(() => 
  import('./SMSConfigurationTab').then(m => ({ default: m.SMSConfigurationTab }))
);
const IntegrationsTab = lazy(() => 
  import('./IntegrationsTab').then(m => ({ default: m.IntegrationsTab }))
);
const StaffManagementTab = lazy(() => 
  import('./staff/StaffManagementTab').then(m => ({ default: m.StaffManagementTab }))
);

function TabLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-pulse text-gray-400">Loading...</div>
    </div>
  );
}

export function SettingsTabContent() {
  const { businessId } = useSettings();

  return (
    <>
      <TabsContent value="business-profile">
        <Suspense fallback={<TabLoadingFallback />}>
          <BusinessProfileTab />
        </Suspense>
      </TabsContent>

      <TabsContent value="services">
        <Suspense fallback={<TabLoadingFallback />}>
          <ServicesManagementTab />
        </Suspense>
      </TabsContent>

      <TabsContent value="hours">
        <Suspense fallback={<TabLoadingFallback />}>
          <HoursEditor />
        </Suspense>
      </TabsContent>

      <TabsContent value="voice-conversation">
        <Suspense fallback={<TabLoadingFallback />}>
          <VoiceConversationTab />
        </Suspense>
      </TabsContent>

      <TabsContent value="sms">
        <Suspense fallback={<TabLoadingFallback />}>
          <SMSConfigurationTab />
        </Suspense>
      </TabsContent>

      <TabsContent value="integrations">
        <Suspense fallback={<TabLoadingFallback />}>
          <IntegrationsTab />
        </Suspense>
      </TabsContent>

      <TabsContent value="staff">
        <Suspense fallback={<TabLoadingFallback />}>
          <StaffManagementTab />
        </Suspense>
      </TabsContent>
    </>
  );
}