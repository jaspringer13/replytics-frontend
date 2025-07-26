"use client"

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { PhoneNumber, PhoneNumberOption } from '@/app/models/phone-number';

export interface UsePhoneNumbersReturn {
  phoneNumbers: PhoneNumberOption[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addPhoneNumber: (displayName: string, areaCode?: string) => Promise<string>;
  setPrimaryPhone: (phoneId: string) => Promise<void>;
  suspendPhone: (phoneId: string) => Promise<void>;
  releasePhone: (phoneId: string) => Promise<void>;
}

export function usePhoneNumbers(businessId: string): UsePhoneNumbersReturn {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhoneNumbers = useCallback(async () => {
    if (!businessId) return;

    try {
      setLoading(true);
      setError(null);

      const phones = await apiClient.getPhoneNumbers();
      
      // Map to PhoneNumberOption format and handle backend field naming
      const phoneOptions: PhoneNumberOption[] = phones.map(phone => ({
        id: phone.id,
        phoneNumber: phone.phoneNumber,
        displayName: phone.displayName,
        isPrimary: (phone as PhoneNumber & { is_primary?: boolean }).is_primary ?? phone.isPrimary ?? false,
        isActive: phone.isActive !== false, // Default to true if not specified
      }));

      setPhoneNumbers(phoneOptions);
    } catch (err) {
      console.error('Failed to load phone numbers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load phone numbers');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchPhoneNumbers();
  }, [fetchPhoneNumbers]);

  const addPhoneNumber = useCallback(
    async (displayName: string, areaCode?: string): Promise<string> => {
      try {
        const newPhone = await apiClient.provisionPhoneNumber({
          displayName,
          areaCode,
        });
        
        // Add to local state
        const newOption: PhoneNumberOption = {
          id: newPhone.id,
          phoneNumber: newPhone.phoneNumber,
          displayName: newPhone.displayName,
          isPrimary: (newPhone as PhoneNumber & { is_primary?: boolean }).is_primary ?? newPhone.isPrimary ?? false,
          isActive: newPhone.isActive !== false,
        };
        
        setPhoneNumbers(prev => [...prev, newOption]);
        return newPhone.id;
      } catch (err) {
        console.error('Failed to add phone number:', err);
        throw err;
      }
    },
    [businessId]
  );

  const setPrimaryPhone = useCallback(
    async (phoneId: string) => {
      try {
        await apiClient.setPrimaryPhoneNumber(phoneId);
        
        // Update local state
        setPhoneNumbers(prev =>
          prev.map(phone => ({
            ...phone,
            isPrimary: phone.id === phoneId,
          }))
        );
      } catch (err) {
        console.error('Failed to set primary phone:', err);
        throw err;
      }
    },
    [businessId]
  );

  const suspendPhone = useCallback(
    async (phoneId: string) => {
      try {
        await apiClient.suspendPhoneNumber(phoneId);
        
        // Update local state
        setPhoneNumbers(prev =>
          prev.map(phone =>
            phone.id === phoneId ? { ...phone, isActive: false } : phone
          )
        );
      } catch (err) {
        console.error('Failed to suspend phone:', err);
        throw err;
      }
    },
    []
  );

  const releasePhone = useCallback(
    async (phoneId: string) => {
      try {
        await apiClient.releasePhoneNumber(phoneId);
        
        // Remove from local state
        setPhoneNumbers(prev => prev.filter(phone => phone.id !== phoneId));
      } catch (err) {
        console.error('Failed to release phone:', err);
        throw err;
      }
    },
    []
  );

  return {
    phoneNumbers,
    loading,
    error,
    refetch: fetchPhoneNumbers,
    addPhoneNumber,
    setPrimaryPhone,
    suspendPhone,
    releasePhone,
  };
}