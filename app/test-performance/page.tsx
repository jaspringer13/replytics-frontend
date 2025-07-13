'use client';

import { useEffect, useState } from 'react';
import { getPerformanceTracker, markStatsLoaded, onPerformanceMetrics } from '@/lib/performance/metrics';

export default function TestPerformancePage() {
  const [metrics, setMetrics] = useState<any>({});
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    // Initialize performance tracking
    const tracker = getPerformanceTracker();
    
    // Subscribe to metrics updates
    onPerformanceMetrics((newMetrics) => {
      setMetrics(newMetrics);
    });

    // Simulate stats loading
    setTimeout(() => {
      setStatsLoading(false);
      markStatsLoaded();
    }, 800); // Simulate 800ms load time
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Performance Metrics Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Real-time Metrics</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label="First Contentful Paint (FCP)"
              value={metrics.FCP}
              target={500}
              unit="ms"
            />
            <MetricCard
              label="Largest Contentful Paint (LCP)"
              value={metrics.LCP}
              target={1000}
              unit="ms"
            />
            <MetricCard
              label="Time to Interactive (TTI)"
              value={metrics.TTI}
              target={1500}
              unit="ms"
            />
            <MetricCard
              label="Time to Stats Loaded"
              value={metrics.statsLoaded}
              target={1000}
              unit="ms"
            />
            <MetricCard
              label="Cumulative Layout Shift (CLS)"
              value={metrics.CLS}
              target={0.1}
              unit=""
              decimals={3}
            />
            <MetricCard
              label="Interaction to Next Paint (INP)"
              value={metrics.INP}
              target={200}
              unit="ms"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Stats Loading Simulation</h2>
          {statsLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span>Loading dashboard stats...</span>
            </div>
          ) : (
            <div className="text-green-600 font-medium">
              ✅ Stats loaded successfully!
            </div>
          )}
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p>Open the browser console to see detailed performance logs.</p>
          <p className="mt-2">
            This page tracks Core Web Vitals and custom metrics in real-time.
            Metrics are logged to the console as they become available.
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ 
  label, 
  value, 
  target, 
  unit = 'ms',
  decimals = 0 
}: { 
  label: string; 
  value?: number; 
  target: number; 
  unit?: string;
  decimals?: number;
}) {
  const isGood = value !== undefined && value <= target;
  const displayValue = value !== undefined ? value.toFixed(decimals) : '—';
  
  return (
    <div className="border rounded-lg p-4">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="flex items-baseline space-x-2">
        <span className={`text-2xl font-bold ${
          value === undefined ? 'text-gray-400' : 
          isGood ? 'text-green-600' : 'text-red-600'
        }`}>
          {displayValue}
        </span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Target: {target}{unit}
      </div>
    </div>
  );
}