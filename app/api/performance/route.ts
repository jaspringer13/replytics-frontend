import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Required environment variables are not set: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

// Initialize Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_METRICS = parseInt(process.env.MAX_PERFORMANCE_METRICS || '1000');

interface PerformanceMetric {
  name: string;
  value: number;
  rating?: string;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    const metric: PerformanceMetric = await request.json();
    
    // Validate metric structure
    if (!metric || !metric.name || typeof metric.value !== 'number') {
      return NextResponse.json({
        success: false,
        error: 'Invalid metric format',
      }, { status: 400 });
    }

    // Prepare metric data for database
    const metricData = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating || null,
      metadata: metric,
      created_at: new Date().toISOString(),
    };
    
    // Store metric in Supabase
    const { data, error } = await supabase
      .from('performance_metrics')
      .insert([metricData])
      .select('id, created_at')
      .single();

    if (error) {
      console.error('[PERFORMANCE METRIC DB ERROR]', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to store metric in database',
      }, { status: 500 });
    }
    
    // Log to console with prefix for easy identification
    console.log('[PERFORMANCE METRIC]', {
      id: data.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating || 'N/A',
      timestamp: data.created_at,
    });

    // Clean up old metrics (keep only last 1000 to prevent table bloat)
    await cleanupOldMetrics();

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        received: true,
        timestamp: data.created_at,
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100); // Cap at 100
    const name = searchParams.get('name');

    // Build query
    let query = supabase
      .from('performance_metrics')
      .select('id, name, value, rating, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by name if provided
    if (name) {
      query = query.eq('name', name);
    }

    const { data: metrics, error } = await query;

    if (error) {
      console.error('[PERFORMANCE METRICS FETCH ERROR]', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to retrieve metrics from database',
      }, { status: 500 });
    }

    // Get total count for pagination info
    const { count, error: countError } = await supabase
      .from('performance_metrics')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('[PERFORMANCE METRICS COUNT ERROR]', countError);
    }

    // Transform data to match original format
    const transformedMetrics = metrics?.map(metric => ({
      id: metric.id,
      metric: metric.metadata,
      timestamp: metric.created_at,
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        metrics: transformedMetrics,
        total: count || 0,
        filtered: transformedMetrics.length,
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

// Helper function to clean up old metrics
async function cleanupOldMetrics() {
  try {
    // Delete metrics older than 30 days or keep only the most recent MAX_METRICS
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // First, try to delete old metrics
    await supabase
      .from('performance_metrics')
      .delete()
      .lt('created_at', thirtyDaysAgo);
      
    // Then, if we still have too many, keep only the most recent MAX_METRICS
    const { data: recentMetrics } = await supabase
      .from('performance_metrics')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(MAX_METRICS);
      
    if (recentMetrics && recentMetrics.length === MAX_METRICS) {
      const keepIds = recentMetrics.map(m => m.id);
      await supabase
        .from('performance_metrics')
        .delete()
        .not('id', 'in', `(${keepIds.join(',')})`);
    }
  } catch (error) {
    console.error('[METRICS CLEANUP ERROR]', error);
    // Don't throw - cleanup is non-critical
  }
}