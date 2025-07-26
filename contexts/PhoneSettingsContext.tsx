"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { PhoneNumber, PhoneNumberOption, PhoneNumberCreate, PhoneNumberUpdate } from '@/app/models/phone-number';
import { useSettingsData, UseSettingsDataReturn } from '@/lib/hooks/useSettingsData';
import { useRealtimeConfig } from '@/lib/hooks/useRealtimeConfig';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/useToast';

interface PhoneSettingsContextValue {
  // Phone number management
  phoneNumbers: PhoneNumberOption[];
  selectedPhoneId: string | null;
  selectedPhone: PhoneNumber | null;
  setSelectedPhoneId: (phoneId: string) => void;
  loadingPhones: boolean;
  
  // Phone-specific settings
  phoneSettings: UseSettingsDataReturn;
  
  // Actions
  addPhoneNumber: (phoneData: PhoneNumberCreate) => Promise<void>;
  updatePhoneSettings: (updates: PhoneNumberUpdate) => Promise<void>;
  deletePhoneNumber: (phoneId: string) => Promise<void>;
  refreshPhoneNumbers: () => Promise<void>;
}

const PhoneSettingsContext = createContext<PhoneSettingsContextValue | null>(null);

interface PhoneSettingsProviderProps {
  businessId: string;
  children: ReactNode;
}

export function PhoneSettingsProvider({ businessId, children }: PhoneSettingsProviderProps) {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberOption[]>([]);
  const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null);
  const [selectedPhone, setSelectedPhone] = useState<PhoneNumber | null>(null);
  const [loadingPhones, setLoadingPhones] = useState(true);
  const { toast } = useToast();

  // Phone-specific settings (always called but handles null phoneId gracefully)
  const phoneSettings = useSettingsData(selectedPhoneId);

  // Real-time updates for the selected phone
  const realtimeConfig = useRealtimeConfig(selectedPhoneId, {
    onError: (error) => {
      console.error('Real-time config error:', error);
    },
    autoReconnect: true,
  });

  // Load phone numbers for the business
  const loadPhoneNumbers = useCallback(async () => {
    try {
      setLoadingPhones(true);
      const phones = await apiClient.getPhoneNumbers();
      
      const phoneOptions: PhoneNumberOption[] = phones.map(p => ({
        id: p.id,
        phoneNumber: p.phoneNumber,
        displayName: p.displayName,
        isPrimary: p.isPrimary,
        isActive: p.isActive,
      }));
      
      setPhoneNumbers(phoneOptions);
      
      // Auto-select primary or first active phone
      if (!selectedPhoneId && phoneOptions.length > 0) {
        const primaryPhone = phoneOptions.find(p => p.isPrimary);
        const firstActive = phoneOptions.find(p => p.isActive);
        const phoneToSelect = primaryPhone || firstActive || phoneOptions[0];
        setSelectedPhoneId(phoneToSelect.id);
      }
    } catch (error) {
      console.error('Failed to load phone numbers:', error);
      toast.error('Failed to load phone numbers');
    } finally {
      setLoadingPhones(false);
    }
  }, [selectedPhoneId, toast]);

  // Load full phone details when selection changes
  const loadPhoneDetails = async (phoneId: string) => {
    try {
      const phone = await apiClient.getPhoneNumber(phoneId);
      setSelectedPhone(phone);
    } catch (error) {
      console.error('Failed to load phone details:', error);
      toast.error('Failed to load phone details');
    }
  };

  // Initial load
  useEffect(() => {
    loadPhoneNumbers();
  }, [loadPhoneNumbers]);

  // Load phone details when selection changes
  useEffect(() => {
    if (selectedPhoneId) {
      loadPhoneDetails(selectedPhoneId);
    } else {
      setSelectedPhone(null);
    }
  }, [selectedPhoneId]);

  // Actions
  const addPhoneNumber = async (phoneData: PhoneNumberCreate) => {
    try {
      const newPhone = await apiClient.createPhoneNumber(phoneData);
      await loadPhoneNumbers();
      setSelectedPhoneId(newPhone.id);
      toast.success('Phone number added successfully');
    } catch (error) {
      console.error('Failed to add phone number:', error);
      toast.error('Failed to add phone number');
      throw error;
    }
  };

  const updatePhoneSettings = async (updates: PhoneNumberUpdate) => {
    if (!selectedPhoneId) return;
    
    try {
      await apiClient.updatePhoneNumber(selectedPhoneId, updates);
      await loadPhoneDetails(selectedPhoneId);
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings');
      throw error;
    }
  };

  const deletePhoneNumber = async (phoneId: string) => {
    try {
      await apiClient.deletePhoneNumber(phoneId);
      const freshPhones = await apiClient.getPhoneNumbers();
      
      // If deleted phone was selected, select another
      if (phoneId === selectedPhoneId) {
        const remaining = freshPhones.filter(p => p.id !== phoneId);
        if (remaining.length > 0) {
          setSelectedPhoneId(remaining[0].id);
        } else {
          setSelectedPhoneId(null);
        }
      }
      
      await loadPhoneNumbers();
      toast.success('Phone number deleted');
    } catch (error) {
      console.error('Failed to delete phone number:', error);
      toast.error('Failed to delete phone number');
      throw error;
    }
  };

  const value: PhoneSettingsContextValue = {
    phoneNumbers,
    selectedPhoneId,
    selectedPhone,
    setSelectedPhoneId,
    loadingPhones,
    phoneSettings,
    addPhoneNumber,
    updatePhoneSettings,
    deletePhoneNumber,
    refreshPhoneNumbers: loadPhoneNumbers,
  };

  return (
    <PhoneSettingsContext.Provider value={value}>
      {children}
    </PhoneSettingsContext.Provider>
  );
}

export function usePhoneSettings() {
  const context = useContext(PhoneSettingsContext);
  if (!context) {
    throw new Error('usePhoneSettings must be used within a PhoneSettingsProvider');
  }
  return context;
}

// Convenience hooks
export function useSelectedPhone() {
  const { selectedPhone, selectedPhoneId } = usePhoneSettings();
  return { selectedPhone, selectedPhoneId };
}

export function usePhoneNumbers() {
  const { phoneNumbers, loadingPhones, refreshPhoneNumbers } = usePhoneSettings();
  return { phoneNumbers, loadingPhones, refreshPhoneNumbers };
}