'use client';

import { useEffect, useState } from 'react';
import { getPerformanceTracker, markStatsLoaded } from '@/lib/performance/metrics';

interface MetricDisplay {
  name: string;
  value: number | undefined;
  rating?: string;
  timestamp: number;
}

export default function PerformanceSmokeTest() {
  const [metrics, setMetrics] = useState<MetricDisplay[]>([]);
  const [forceLayoutShift, setForceLayoutShift] = useState(false);
  const [statsTriggered, setStatsTriggered] = useState(false);

  useEffect(() => {
    // Initialize performance tracker and listen for updates
    const tracker = getPerformanceTracker();
    
    tracker.onMetricsUpdate((performanceMetrics) => {
      const newMetrics: MetricDisplay[] = [];
      
      Object.entries(performanceMetrics).forEach(([name, value]) => {
        if (value !== undefined) {
          newMetrics.push({
            name,
            value,
            timestamp: Date.now(),
            rating: getMetricRating(name, value),
          });
        }
      });
      
      setMetrics(newMetrics);
    });

    // Force layout shift after 2 seconds
    setTimeout(() => {
      setForceLayoutShift(true);
    }, 2000);
  }, []);

  const getMetricRating = (name: string, value: number): string => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      CLS: { good: 0.1, poor: 0.25 },
      INP: { good: 200, poor: 500 },
      TTFB: { good: 800, poor: 1800 },
      TTI: { good: 3800, poor: 7300 },
      statsLoaded: { good: 1000, poor: 3000 },
    };

    const threshold = thresholds[name];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const getMetricColor = (rating?: string): string => {
    switch (rating) {
      case 'good':
        return 'text-green-600';
      case 'needs-improvement':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const triggerStatsLoaded = () => {
    markStatsLoaded();
    setStatsTriggered(true);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Performance Metrics Smoke Test</h1>
        
        {/* Force LCP with large content */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Large Content Paint Trigger</h2>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-64 rounded-lg flex items-center justify-center">
            <p className="text-white text-xl font-bold">
              This large element should trigger LCP measurement
            </p>
          </div>
        </div>

        {/* Force CLS with layout shift */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Cumulative Layout Shift Test</h2>
          {!forceLayoutShift ? (
            <div className="h-20 bg-gray-200 rounded flex items-center justify-center">
              <p>Content will shift in 2 seconds...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-40 bg-red-200 rounded flex items-center justify-center">
                <p className="text-lg font-semibold">Layout has shifted!</p>
              </div>
              <p className="text-sm text-gray-600">
                This content appeared and caused a layout shift
              </p>
            </div>
          )}
        </div>

        {/* Manual trigger for stats loaded */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Manual Metric Trigger</h2>
          <button
            onClick={triggerStatsLoaded}
            disabled={statsTriggered}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              statsTriggered
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {statsTriggered ? 'Stats Loaded Triggered' : 'Trigger Stats Loaded'}
          </button>
        </div>

        {/* Real-time metrics display */}
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Captured Metrics</h2>
          {metrics.length === 0 ? (
            <p className="text-gray-500">Waiting for metrics...</p>
          ) : (
            <div className="space-y-3">
              {metrics.map((metric, index) => (
                <div
                  key={`${metric.name}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold text-lg">{metric.name}</span>
                    <span className={`text-lg ${getMetricColor(metric.rating)}`}>
                      {metric.name === 'CLS' 
                        ? (metric.value?.toFixed(3) ?? 'N/A')
                        : `${Math.round(metric.value ?? 0)}ms`
                      }
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        metric.rating === 'good'
                          ? 'bg-green-100 text-green-800'
                          : metric.rating === 'needs-improvement'
                          ? 'bg-yellow-100 text-yellow-800'
                          : metric.rating === 'poor'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {metric.rating || 'unknown'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(metric.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">How to use this test:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Open browser developer console to see detailed logs</li>
            <li>Look for [PERFORMANCE METRIC CAPTURED] messages</li>
            <li>Verify metrics are sent to /api/performance endpoint</li>
            <li>Check for [PERFORMANCE METRIC SENT] confirmations</li>
            <li>Interact with the page to trigger INP measurement</li>
            <li>Click the button to trigger custom statsLoaded metric</li>
          </ol>
        </div>
      </div>
    </div>
  );
}