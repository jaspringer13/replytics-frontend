/**
 * Prometheus Metrics API Endpoint
 * 
 * Exposes application metrics in Prometheus format for monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMetrics, BusinessMetricsTracker } from '@/lib/monitoring/metrics-collector';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Track the metrics collection request
    BusinessMetricsTracker.trackAnalyticsQuery(
      'metrics_export',
      'system',
      0,
      true,
      'simple'
    );

    // Get all metrics in Prometheus format
    const metrics = await getMetrics();
    
    // Track successful metrics collection
    const duration = Date.now() - startTime;
    BusinessMetricsTracker.trackAnalyticsQuery(
      'metrics_export',
      'system',
      duration,
      true,
      'simple'
    );
    
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    });
  } catch (error) {
    console.error('Metrics collection error:', error);
    
    // Track failed metrics collection
    const duration = Date.now() - startTime;
    BusinessMetricsTracker.trackAnalyticsQuery(
      'metrics_export',
      'system',
      duration,
      false,
      'simple'
    );
    
    return NextResponse.json(
      { 
        error: 'Failed to collect metrics',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}