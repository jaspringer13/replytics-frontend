"use client"

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { 
  BusinessProfile as DashboardBusinessProfile, 
  Service as DashboardService, 
  OperatingHours as DashboardOperatingHours 
} from '@/app/models/dashboard';

// Re-export for components that import from this file
export type BusinessProfile = DashboardBusinessProfile;
export type Service = DashboardService;
export type OperatingHours = DashboardOperatingHours;

export interface SettingsData {
  profile: DashboardBusinessProfile | null;
  services: DashboardService[];
  hours: DashboardOperatingHours[];
}

export interface UseSettingsDataReturn {
  data: SettingsData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (updates: Partial<DashboardBusinessProfile>) => Promise<void>;
  createService: (service: Omit<DashboardService, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateService: (id: string, updates: Partial<DashboardService>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  reorderServices: (serviceIds: string[]) => Promise<void>;
  updateHours: (hours: DashboardOperatingHours[]) => Promise<void>;
}

export function useSettingsData(businessId: string): UseSettingsDataReturn {
  const [data, setData] = useState<SettingsData>({
    profile: null,
    services: [],
    hours: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!businessId) return;

    try {
      setLoading(true);
      setError(null);

      const [profile, services, hours] = await Promise.all([
        apiClient.getBusinessProfile(),
        apiClient.getServices(),
        apiClient.getBusinessHours(),
      ]);

      setData({
        profile,
        services,
        hours,
      });
    } catch (err) {
      console.error('Failed to load settings data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings data');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateProfile = useCallback(
    async (updates: Partial<DashboardBusinessProfile>) => {
      try {
        const updatedProfile = await apiClient.updateBusinessProfile(updates);
        setData((prev) => ({
          ...prev,
          profile: updatedProfile as DashboardBusinessProfile,
        }));
      } catch (err) {
        console.error('Failed to update profile:', err);
        throw err;
      }
    },
    []
  );

  const createService = useCallback(
    async (service: Omit<DashboardService, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const newService = await apiClient.createService(service);
        setData((prev) => ({
          ...prev,
          services: [...prev.services, newService as DashboardService],
        }));
      } catch (err) {
        console.error('Failed to create service:', err);
        throw err;
      }
    },
    []
  );

  const updateService = useCallback(
    async (id: string, updates: Partial<DashboardService>) => {
      try {
        const updatedService = await apiClient.updateService(id, updates);
        setData((prev) => ({
          ...prev,
          services: prev.services.map((s) => 
            s.id === id ? (updatedService as DashboardService) : s
          ),
        }));
      } catch (err) {
        console.error('Failed to update service:', err);
        throw err;
      }
    },
    []
  );

  const deleteService = useCallback(
    async (id: string) => {
      try {
        await apiClient.deleteService(id);
        setData((prev) => ({
          ...prev,
          services: prev.services.filter((s) => s.id !== id),
        }));
      } catch (err) {
        console.error('Failed to delete service:', err);
        throw err;
      }
    },
    []
  );

  const reorderServices = useCallback(
    async (serviceIds: string[]) => {
      try {
        await apiClient.reorderServices(serviceIds);
        // Reorder local services to match
        setData((prev) => {
          const serviceMap = new Map(prev.services.map(s => [s.id, s]));
          const reorderedServices = serviceIds
            .map(id => serviceMap.get(id))
            .filter((s): s is DashboardService => s !== undefined);
          return {
            ...prev,
            services: reorderedServices,
          };
        });
      } catch (err) {
        console.error('Failed to reorder services:', err);
        throw err;
      }
    },
    []
  );

  const updateHours = useCallback(
    async (hours: DashboardOperatingHours[]) => {
      try {
        await apiClient.updateBusinessHours(hours);
        setData((prev) => ({
          ...prev,
          hours: hours, // Use the hours we sent since API might not return the updated data
        }));
      } catch (err) {
        console.error('Failed to update hours:', err);
        throw err;
      }
    },
    []
  );

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    updateProfile,
    createService,
    updateService,
    deleteService,
    reorderServices,
    updateHours,
  };
}