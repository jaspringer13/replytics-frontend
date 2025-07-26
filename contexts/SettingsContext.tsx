"use client"

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useSettingsData, UseSettingsDataReturn } from '@/lib/hooks/useSettingsData';
import { useRealtimeConfig, UseRealtimeConfigReturn } from '@/lib/hooks/useRealtimeConfig';
import { usePhoneNumbers, UsePhoneNumbersReturn } from '@/lib/hooks/usePhoneNumbers';
import { usePhoneSettings, UsePhoneSettingsReturn } from '@/lib/hooks/usePhoneSettings';

export interface SettingsTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortLabel?: string;
}

interface SettingsContextValue {
  businessId: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  settingsData: UseSettingsDataReturn;
  realtimeConfig: UseRealtimeConfigReturn;
  phoneNumbers: UsePhoneNumbersReturn;
  selectedPhoneId: string | null;
  setSelectedPhoneId: (phoneId: string) => void;
  phoneSettings: UsePhoneSettingsReturn | null;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

interface SettingsProviderProps {
  businessId: string;
  children: ReactNode;
}

export function SettingsProvider({ businessId, children }: SettingsProviderProps) {
  const [activeTab, setActiveTab] = useState('business-profile');
  const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null);
  
  const settingsData = useSettingsData(businessId);
  const phoneNumbers = usePhoneNumbers(businessId);
  
  // Auto-select primary or first phone when loaded
  useEffect(() => {
    if (!selectedPhoneId && !phoneNumbers.loading && phoneNumbers.phoneNumbers.length > 0) {
      const primaryPhone = phoneNumbers.phoneNumbers.find(p => p.isPrimary);
      const firstActive = phoneNumbers.phoneNumbers.find(p => p.isActive);
      const phoneToSelect = primaryPhone || firstActive || phoneNumbers.phoneNumbers[0];
      if (phoneToSelect) {
        setSelectedPhoneId(phoneToSelect.id);
      }
    }
  }, [phoneNumbers.phoneNumbers, phoneNumbers.loading, selectedPhoneId]);
  
  // Load phone-specific settings when phone is selected
  const phoneSettings = usePhoneSettings(selectedPhoneId);
  
  // Create phone-specific real-time config connection
  const realtimeConfig = useRealtimeConfig(
    selectedPhoneId || businessId, 
    {
      onError: (error) => {
        console.error('Real-time config error:', error);
      },
      autoReconnect: true,
      isPhoneSpecific: !!selectedPhoneId,
    }
  );

  const value: SettingsContextValue = {
    businessId,
    activeTab,
    setActiveTab,
    settingsData,
    realtimeConfig,
    phoneNumbers,
    selectedPhoneId,
    setSelectedPhoneId,
    phoneSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Export specific hooks for convenience
export function useSettingsTab() {
  const { activeTab, setActiveTab } = useSettings();
  return { activeTab, setActiveTab };
}

export function useBusinessId() {
  const { businessId } = useSettings();
  return businessId;
}

export function useSelectedPhone() {
  const { selectedPhoneId, setSelectedPhoneId, phoneNumbers } = useSettings();
  const selectedPhone = phoneNumbers.phoneNumbers.find(p => p.id === selectedPhoneId);
  return { 
    selectedPhoneId, 
    setSelectedPhoneId, 
    selectedPhone,
    phoneNumbers: phoneNumbers.phoneNumbers,
    loading: phoneNumbers.loading 
  };
}

export function usePhoneSpecificSettings() {
  const { phoneSettings, selectedPhoneId } = useSettings();
  return { phoneSettings, selectedPhoneId };
}