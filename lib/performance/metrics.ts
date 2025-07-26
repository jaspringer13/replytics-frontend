// Conditional import to avoid SSR issues
let webVitals: any = null;
if (typeof window !== 'undefined') {
  webVitals = require('web-vitals');
}

interface CustomMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  entries: any[];
}

export interface PerformanceMetrics {
  FCP?: number;
  LCP?: number;
  TTI?: number;
  CLS?: number;
  INP?: number;
  TTFB?: number;
  statsLoaded?: number;
}

export interface PerformanceBudget {
  FCP?: number;
  LCP?: number;
  TTI?: number;
  statsLoaded?: number;
}

class PerformanceTracker {
  private metrics: PerformanceMetrics = {};
  private navigationStart: number;
  private metricsCallbacks: ((metrics: PerformanceMetrics) => void)[] = [];
  private ttiCleanup: (() => void) | null = null;
  private performanceBudget: PerformanceBudget;

  constructor(budget?: PerformanceBudget) {
    this.navigationStart = performance.timeOrigin || Date.now();
    this.performanceBudget = budget || {
      FCP: 500,
      LCP: 1000,
      TTI: 1500,
      statsLoaded: 1000,
    };
    this.initializeWebVitals();
    this.measureTTI();
  }

  private initializeWebVitals() {
    if (!webVitals) return;

    // First Contentful Paint
    webVitals.onFCP((metric: any) => {
      this.metrics.FCP = metric.value;
      console.log('[Performance] FCP:', metric.value, 'ms');
      this.sendMetricToEndpoint(metric);
      this.notifyCallbacks();
    });

    // Largest Contentful Paint
    webVitals.onLCP((metric: any) => {
      this.metrics.LCP = metric.value;
      console.log('[Performance] LCP:', metric.value, 'ms');
      this.sendMetricToEndpoint(metric);
      this.notifyCallbacks();
    });

    // Cumulative Layout Shift
    webVitals.onCLS((metric: any) => {
      this.metrics.CLS = metric.value;
      console.log('[Performance] CLS:', metric.value);
      this.sendMetricToEndpoint(metric);
      this.notifyCallbacks();
    });

    // Interaction to Next Paint (replaces FID)
    webVitals.onINP((metric: any) => {
      this.metrics.INP = metric.value;
      console.log('[Performance] INP:', metric.value, 'ms');
      this.sendMetricToEndpoint(metric);
      this.notifyCallbacks();
    });

    // Time to First Byte
    webVitals.onTTFB((metric: any) => {
      this.metrics.TTFB = metric.value;
      console.log('[Performance] TTFB:', metric.value, 'ms');
      this.sendMetricToEndpoint(metric);
      this.notifyCallbacks();
    });
  }

  private measureTTI() {
    // Time to Interactive approximation using Long Tasks API
    if ('PerformanceObserver' in window && 'PerformanceLongTaskTiming' in window) {
      let lastLongTask = 0;
      let checkTTI: NodeJS.Timeout;
      let observer: PerformanceObserver;
      
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          lastLongTask = entry.startTime + entry.duration;
        }
      });

      observer.observe({ entryTypes: ['longtask'] });

      // Check for TTI every 500ms
      checkTTI = setInterval(() => {
        const now = performance.now();
        // Consider interactive if no long tasks for 5 seconds
        if (now - lastLongTask > 5000 && this.metrics.FCP) {
          this.metrics.TTI = Math.max(lastLongTask, this.metrics.FCP);
          console.log('[Performance] TTI (estimated):', this.metrics.TTI, 'ms');
          this.notifyCallbacks();
          clearInterval(checkTTI);
          observer.disconnect();
          this.ttiCleanup = null;
        }
      }, 500);

      // Store cleanup function
      this.ttiCleanup = () => {
        if (checkTTI) clearInterval(checkTTI);
        if (observer) observer.disconnect();
      };

      // Stop checking after 30 seconds
      setTimeout(() => {
        if (checkTTI) clearInterval(checkTTI);
        if (observer) observer.disconnect();
        this.ttiCleanup = null;
      }, 30000);
    }
  }

  private async sendCustomMetric(name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') {
    const customMetric: CustomMetric = {
      name,
      value,
      rating,
      delta: 0,
      id: `${name}-${Date.now()}`,
      navigationType: 'navigate',
      entries: [],
    };
    
    await this.sendMetricToEndpoint(customMetric);
  }

  private async sendMetricToEndpoint(metric: any) {
    try {
      // Add browser console logging with clear prefix
      console.log(`[PERFORMANCE METRIC CAPTURED] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
      });

      // Validate metric before sending
      if (!metric.name || typeof metric.value !== 'number') {
        console.warn('[Performance] Invalid metric format:', metric);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
          entries: metric.entries,
        }),
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`[PERFORMANCE METRIC SENT] ${metric.name}:`, result);
    } catch (error) {
      console.error(`[PERFORMANCE METRIC ERROR] Failed to send ${metric.name}:`, error);
    }
  }

  markStatsLoaded() {
    this.metrics.statsLoaded = performance.now();
    console.log('[Performance] Stats Loaded:', this.metrics.statsLoaded, 'ms');
    
    // Send custom metric for stats loaded with proper typing
    const rating = this.metrics.statsLoaded < 1000 ? 'good' : 
                   this.metrics.statsLoaded < 3000 ? 'needs-improvement' : 'poor';
    this.sendCustomMetric('statsLoaded', this.metrics.statsLoaded, rating);
    
    this.notifyCallbacks();
    
    // Log performance budget status
    this.checkPerformanceBudget();
  }

  private checkPerformanceBudget() {
    const budget = this.performanceBudget;

    console.log('\n=== Performance Budget Status ===');
    
    Object.entries(budget).forEach(([metric, target]) => {
      const value = this.metrics[metric as keyof PerformanceMetrics];
      if (value !== undefined && target !== undefined) {
        const status = value <= target ? '✅' : '❌';
        const diff = value - target;
        console.log(
          `${status} ${metric}: ${value.toFixed(0)}ms (target: ${target}ms, ${
            diff > 0 ? '+' : ''
          }${diff.toFixed(0)}ms)`
        );
      }
    });
    
    console.log('================================\n');
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void) {
    this.metricsCallbacks.push(callback);
    // Immediately call with current metrics
    if (Object.keys(this.metrics).length > 0) {
      callback(this.metrics);
    }
  }

  private notifyCallbacks() {
    this.metricsCallbacks.forEach(cb => cb(this.metrics));
  }

  sendToAnalytics(endpoint?: string) {
    const data = {
      metrics: this.metrics,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    console.log('[Performance] Sending metrics:', data);

    if (endpoint) {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, JSON.stringify(data));
      } else {
        // Fallback for browsers without sendBeacon support
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          keepalive: true
        }).catch(error => console.warn('[Performance] Failed to send metrics:', error));
      }
    }
  }

  cleanup() {
    if (this.ttiCleanup) {
      this.ttiCleanup();
      this.ttiCleanup = null;
    }
    this.metricsCallbacks = [];
  }
}

// Create singleton instance
let tracker: PerformanceTracker | null = null;

export const getPerformanceTracker = (budget?: PerformanceBudget): PerformanceTracker => {
  if (!tracker && typeof window !== 'undefined') {
    tracker = new PerformanceTracker(budget);
  }
  if (!tracker) {
    throw new Error('PerformanceTracker not available in this environment');
  }
  return tracker;
};

// Export convenience functions
export const markStatsLoaded = () => {
  try {
    const t = getPerformanceTracker();
    if (t) t.markStatsLoaded();
  } catch (error) {
    console.warn('[Performance] Failed to mark stats loaded:', error);
  }
};

export const onPerformanceMetrics = (callback: (metrics: PerformanceMetrics) => void) => {
  try {
    const t = getPerformanceTracker();
    if (t) t.onMetricsUpdate(callback);
  } catch (error) {
    console.warn('[Performance] Failed to register metrics callback:', error);
  }
};

export const sendPerformanceMetrics = (endpoint?: string) => {
  try {
    const t = getPerformanceTracker();
    if (t) t.sendToAnalytics(endpoint);
  } catch (error) {
    console.warn('[Performance] Failed to send metrics:', error);
  }
};

export const cleanupPerformanceTracker = () => {
  try {
    if (tracker) {
      tracker.cleanup();
      tracker = null;
    }
  } catch (error) {
    console.warn('[Performance] Failed to cleanup tracker:', error);
  }
};