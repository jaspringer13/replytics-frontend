import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for metrics (for development/testing)
const metricsStore: Array<{
  metric: any;
  timestamp: string;
  id: string;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const metric = await request.json();
    
    // Validate metric structure
    if (!metric || !metric.name || typeof metric.value !== 'number') {
      return NextResponse.json({
        success: false,
        error: 'Invalid metric format',
      }, { status: 400 });
    }

    // Store metric with timestamp
    const storedMetric = {
      metric,
      timestamp: new Date().toISOString(),
      id: `${metric.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    metricsStore.push(storedMetric);
    
    // Log to console with prefix for easy identification
    console.log('[PERFORMANCE METRIC]', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating || 'N/A',
      timestamp: storedMetric.timestamp,
      id: storedMetric.id,
    });

    // Keep only last 100 metrics to prevent memory issues
    if (metricsStore.length > 100) {
      metricsStore.shift();
    }

    return NextResponse.json({
      success: true,
      data: {
        id: storedMetric.id,
        received: true,
        timestamp: storedMetric.timestamp,
      },
    });
  } catch (error: any) {
    console.error('[PERFORMANCE API ERROR]', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process metric',
    }, { status: 500 });
  }
}

// GET endpoint to retrieve stored metrics (for testing)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const name = searchParams.get('name');

    let metrics = [...metricsStore];

    // Filter by name if provided
    if (name) {
      metrics = metrics.filter(m => m.metric.name === name);
    }

    // Get most recent metrics
    metrics = metrics.slice(-limit).reverse();

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        total: metricsStore.length,
        filtered: metrics.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[PERFORMANCE API ERROR]', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to retrieve metrics',
    }, { status: 500 });
  }
}