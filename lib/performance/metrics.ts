import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

interface PerformanceMetrics {
  FCP?: number;
  LCP?: number;
  TTI?: number;
  CLS?: number;
  INP?: number;
  TTFB?: number;
  statsLoaded?: number;
}

class PerformanceTracker {
  private metrics: PerformanceMetrics = {};
  private navigationStart: number;
  private metricsCallbacks: ((metrics: PerformanceMetrics) => void)[] = [];

  constructor() {
    this.navigationStart = performance.timeOrigin || Date.now();
    this.initializeWebVitals();
    this.measureTTI();
  }

  private initializeWebVitals() {
    // First Contentful Paint
    onFCP((metric: Metric) => {
      this.metrics.FCP = metric.value;
      console.log('[Performance] FCP:', metric.value, 'ms');
      this.notifyCallbacks();
    });

    // Largest Contentful Paint
    onLCP((metric: Metric) => {
      this.metrics.LCP = metric.value;
      console.log('[Performance] LCP:', metric.value, 'ms');
      this.notifyCallbacks();
    });

    // Cumulative Layout Shift
    onCLS((metric: Metric) => {
      this.metrics.CLS = metric.value;
      console.log('[Performance] CLS:', metric.value);
      this.notifyCallbacks();
    });

    // Interaction to Next Paint (replaces FID)
    onINP((metric: Metric) => {
      this.metrics.INP = metric.value;
      console.log('[Performance] INP:', metric.value, 'ms');
      this.notifyCallbacks();
    });

    // Time to First Byte
    onTTFB((metric: Metric) => {
      this.metrics.TTFB = metric.value;
      console.log('[Performance] TTFB:', metric.value, 'ms');
      this.notifyCallbacks();
    });
  }

  private measureTTI() {
    // Time to Interactive approximation using Long Tasks API
    if ('PerformanceObserver' in window && 'PerformanceLongTaskTiming' in window) {
      let lastLongTask = 0;
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          lastLongTask = entry.startTime + entry.duration;
        }
      });

      observer.observe({ entryTypes: ['longtask'] });

      // Check for TTI every 500ms
      const checkTTI = setInterval(() => {
        const now = performance.now();
        // Consider interactive if no long tasks for 5 seconds
        if (now - lastLongTask > 5000 && this.metrics.FCP) {
          this.metrics.TTI = Math.max(lastLongTask, this.metrics.FCP);
          console.log('[Performance] TTI (estimated):', this.metrics.TTI, 'ms');
          this.notifyCallbacks();
          clearInterval(checkTTI);
          observer.disconnect();
        }
      }, 500);

      // Stop checking after 30 seconds
      setTimeout(() => {
        clearInterval(checkTTI);
        observer.disconnect();
      }, 30000);
    }
  }

  markStatsLoaded() {
    this.metrics.statsLoaded = performance.now();
    console.log('[Performance] Stats Loaded:', this.metrics.statsLoaded, 'ms');
    this.notifyCallbacks();
    
    // Log performance budget status
    this.checkPerformanceBudget();
  }

  private checkPerformanceBudget() {
    const budget = {
      FCP: 500,
      LCP: 1000,
      TTI: 1500,
      statsLoaded: 1000,
    };

    console.log('\n=== Performance Budget Status ===');
    
    Object.entries(budget).forEach(([metric, target]) => {
      const value = this.metrics[metric as keyof PerformanceMetrics];
      if (value !== undefined) {
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

    if (endpoint && navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, JSON.stringify(data));
    }
  }
}

// Create singleton instance
let tracker: PerformanceTracker | null = null;

export const getPerformanceTracker = (): PerformanceTracker => {
  if (!tracker && typeof window !== 'undefined') {
    tracker = new PerformanceTracker();
  }
  return tracker!;
};

// Export convenience functions
export const markStatsLoaded = () => {
  const t = getPerformanceTracker();
  if (t) t.markStatsLoaded();
};

export const onPerformanceMetrics = (callback: (metrics: PerformanceMetrics) => void) => {
  const t = getPerformanceTracker();
  if (t) t.onMetricsUpdate(callback);
};

export const sendPerformanceMetrics = (endpoint?: string) => {
  const t = getPerformanceTracker();
  if (t) t.sendToAnalytics(endpoint);
};