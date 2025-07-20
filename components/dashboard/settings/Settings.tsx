"use client"

import React from 'react';
import { Tabs } from '@/components/ui/tabs';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';
import { SettingsLoadingWrapper } from './SettingsLoadingWrapper';
import { SettingsHeader } from './SettingsHeader';
import { SettingsTabNavigation } from './SettingsTabNavigation';
import { SettingsTabContent } from './SettingsTabContent';

interface SettingsProps {
  businessId: string;
}

/**
 * Main Settings component that coordinates all settings functionality.
 * This component has been refactored to separate concerns:
 * - Data fetching is handled by useSettingsData hook
 * - Real-time config is handled by useRealtimeConfig hook
 * - State management is handled by SettingsProvider
 * - UI components are separated into smaller, focused components
 */
export function Settings({ businessId }: SettingsProps) {
  return (
    <SettingsProvider businessId={businessId}>
      <SettingsContent />
    </SettingsProvider>
  );
}

/**
 * Internal component that uses the Settings context.
 * Separated to allow the provider to wrap it.
 */
function SettingsContent() {
  const { activeTab, settingsData } = useSettings();
  const { loading, error, refetch } = settingsData;

  return (
    <SettingsLoadingWrapper
      loading={loading}
      error={error}
      onRetry={refetch}
    >
      <div className="max-w-7xl mx-auto p-6">
        <SettingsHeader />
        
        <Tabs value={activeTab} className="space-y-6">
          <SettingsTabNavigation />
          <SettingsTabContent />
        </Tabs>
      </div>
    </SettingsLoadingWrapper>
  );
}