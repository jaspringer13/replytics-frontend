import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CustomerSegment } from '@/app/models/dashboard';

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Required Supabase environment variables are not set');
}

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

interface SegmentCounts {
  all: number;
  vip: number;
  regular: number;
  at_risk: number;
  new: number;
  dormant: number;
}

/**
 * GET /api/v2/dashboard/customers/segments/counts
 * Get customer segment counts with optional search filter
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // Base query for all customers
    let query = supabase
      .from('customer_segments')
      .select('segment', { count: 'exact' })
      .eq('tenant_id', tenantId);

    // Apply search filter if provided
    if (search) {
      const raw = search.toLowerCase();
      const escaped = raw.replace(/[%_,]/g, '\\$&');
      const searchTerm = `%${escaped}%`;
      query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},ani_hash.ilike.${searchTerm}`);
    }

    // Get total count
    const { count: totalCount, error: totalError } = await query;

    if (totalError) {
      console.error('Error fetching total count:', totalError);
      return NextResponse.json(
        { error: 'Failed to fetch customer counts' },
        { status: 500 }
      );
    }

    // Get segment-specific counts
    const segments: CustomerSegment[] = ['vip', 'regular', 'at_risk', 'new', 'dormant'];
    const segmentCounts: SegmentCounts = {
      all: totalCount || 0,
      vip: 0,
      regular: 0,
      at_risk: 0,
      new: 0,
      dormant: 0
    };

    // Fetch counts for each segment in parallel
    const segmentPromises = segments.map(async (segment) => {
      let segmentQuery = supabase
        .from('customer_segments')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('segment', segment);

      // Apply same search filter if provided
      if (search) {
        const raw = search.toLowerCase();
        const escaped = raw.replace(/[%_,]/g, '\\$&');
        const searchTerm = `%${escaped}%`;
        segmentQuery = segmentQuery.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},ani_hash.ilike.${searchTerm}`);
      }

      const { count, error } = await segmentQuery;
      
      if (error) {
        console.error(`Error fetching ${segment} count:`, error);
        return { segment, count: 0 };
      }
      
      return { segment, count: count || 0 };
    });

    const segmentResults = await Promise.all(segmentPromises);
    
    // Populate segment counts
    segmentResults.forEach(({ segment, count }) => {
      segmentCounts[segment] = count;
    });

    return NextResponse.json({
      success: true,
      data: segmentCounts
    });

  } catch (error) {
    console.error('Error in GET segment counts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}