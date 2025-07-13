'use client';

import { useEffect } from 'react';
import { getPerformanceTracker } from '@/lib/performance/metrics';

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize performance tracking on mount
    const tracker = getPerformanceTracker();
    
    // Optional: Send metrics to analytics after page load
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        // Wait a bit to collect all metrics
        setTimeout(() => {
          const metrics = tracker.getMetrics();
          console.log('[Performance] Final metrics:', metrics);
          
          // You can send to analytics here
          // tracker.sendToAnalytics('/api/analytics/performance');
        }, 5000);
      });
    }
  }, []);

  return <>{children}</>;
}