'use client';

import { useEffect } from 'react';
import { getPerformanceTracker } from '@/lib/performance/metrics';

interface PerformanceProviderProps {
  children: React.ReactNode;
  metricsTimeout?: number;
}

export function PerformanceProvider({ 
  children, 
  metricsTimeout = parseInt(process.env.NEXT_PUBLIC_PERFORMANCE_METRICS_TIMEOUT || '5000')
}: PerformanceProviderProps) {
  useEffect(() => {
    // Initialize performance tracking on mount
    const tracker = getPerformanceTracker();
    
    // Optional: Send metrics to analytics after page load
    if (typeof window !== 'undefined') {
      const handleLoad = () => {
        // Wait a bit to collect all metrics
        setTimeout(() => {
          const metrics = tracker.getMetrics();
          if (process.env.NODE_ENV === 'development') {
            console.log('[Performance] Final metrics:', metrics);
          }
          
          // You can send to analytics here
          // tracker.sendToAnalytics('/api/analytics/performance');
        }, metricsTimeout);
      };
      
      window.addEventListener('load', handleLoad);
      
      return () => {
        window.removeEventListener('load', handleLoad);
      };
    }
  }, []);

  return <>{children}</>;
}