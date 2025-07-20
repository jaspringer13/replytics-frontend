import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/react-query';

interface BillingInfo {
  usage: {
    minutes: number;
    calls: number;
    sms: number;
    recordings: number;
  };
  limits: {
    minutes: number;
    calls: number;
    sms: number;
    recordings: number;
  };
  billingPeriod: {
    start: string;
    end: string;
  };
  percentages: {
    minutes: number;
    calls: number;
    sms: number;
    recordings: number;
  };
  daysRemaining: number;
  plan?: string;
}

export function useBilling() {
  return useQuery({
    queryKey: queryKeys.billing(),
    queryFn: async (): Promise<BillingInfo> => {
      const billing = await apiClient.fetchBillingInfo();
      
      // Calculate usage percentages
      const percentages = {
        minutes: billing.limits.minutes > 0 
          ? (billing.usage.minutes / billing.limits.minutes) * 100 
          : 0,
        calls: billing.limits.calls > 0 
          ? (billing.usage.calls / billing.limits.calls) * 100 
          : 0,
        sms: billing.limits.sms > 0 
          ? (billing.usage.sms / billing.limits.sms) * 100 
          : 0,
        recordings: billing.limits.recordings > 0 
          ? (billing.usage.recordings / billing.limits.recordings) * 100 
          : 0,
      };
      
      // Calculate days remaining in billing period
      const endDate = new Date(billing.billingPeriod.end);
      const today = new Date();
      // Use UTC dates to avoid timezone issues in billing period calculations
      const endDateUTC = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
      const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      const daysRemaining = Math.max(0, Math.ceil((endDateUTC.getTime() - todayUTC.getTime()) / (1000 * 60 * 60 * 24)));
      
      return {
        ...billing,
        percentages,
        daysRemaining,
      };
    },
    // Refresh billing info every 5 minutes
    refetchInterval: 5 * 60 * 1000,
    // Keep stale for 10 minutes
    staleTime: 10 * 60 * 1000,
  });
}

// Helper hook for usage alerts
export function useBillingAlerts() {
  const { data: billing } = useBilling();
  
  if (!billing) return { alerts: [] };
  
  const alerts: Array<{
    type: 'warning' | 'critical';
    resource: string;
    message: string;
    percentage: number;
  }> = [];
  const WARNING_THRESHOLD = 80;
  const CRITICAL_THRESHOLD = 95;
  
  Object.entries(billing.percentages).forEach(([resource, percentage]) => {
    if (percentage >= CRITICAL_THRESHOLD) {
      alerts.push({
        type: 'critical' as const,
        resource,
        message: `${resource.charAt(0).toUpperCase() + resource.slice(1)} usage is at ${Math.round(percentage)}% of limit`,
        percentage,
      });
    } else if (percentage >= WARNING_THRESHOLD) {
      alerts.push({
        type: 'warning' as const,
        resource,
        message: `${resource.charAt(0).toUpperCase() + resource.slice(1)} usage is at ${Math.round(percentage)}% of limit`,
        percentage,
      });
    }
  });
  
  return { alerts };
}