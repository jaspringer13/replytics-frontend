'use client';

import { useEffect } from 'react';
import { getPerformanceTracker } from '@/lib/performance/metrics';

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
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
        }, 5000); // TODO: Make this timeout configurable
      };
      
      window.addEventListener('load', handleLoad);
      
      return () => {
        window.removeEventListener('load', handleLoad);
      };
    }
  }, []);

  return <>{children}</>;
}