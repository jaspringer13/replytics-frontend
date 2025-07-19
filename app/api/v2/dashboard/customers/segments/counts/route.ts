import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { CustomerSegment } from '@/app/models/dashboard';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

interface SegmentCounts {
  all: number;
  vip: number;
  regular: number;
  at_risk: number;
  new: number;
  dormant: number;
}

function buildSearchFilter(query: any, search: string) {
  const raw = search.toLowerCase();
  const escaped = raw.replace(/[%_,]/g, '\\$&');
  const searchTerm = `%${escaped}%`;
  return query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},ani_hash.ilike.${searchTerm}`);
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

    // Use database-level aggregation for better performance
    const supabase = getSupabaseServer();
    
    // Build the base query with search filter if provided
    let baseQuery = supabase
      .from('customer_segments')
      .eq('tenant_id', tenantId);

    if (search) {
      baseQuery = buildSearchFilter(baseQuery, search);
    }

    // Get total count
    const { count: totalCount, error: totalError } = await baseQuery
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('Error fetching total count:', totalError);
      return NextResponse.json(
        { error: 'Failed to fetch customer counts' },
        { status: 500 }
      );
    }

    // Get segment-specific counts using database aggregation
    const { data: segmentData, error: segmentError } = await baseQuery
      .select('segment, count(*)', { count: 'exact' })
      .group('segment');

    if (segmentError) {
      console.error('Error fetching segment data:', segmentError);
      return NextResponse.json(
        { error: 'Failed to fetch customer counts' },
        { status: 500 }
      );
    }

    // Initialize segment counts
    const segmentCounts: SegmentCounts = {
      all: totalCount || 0,
      vip: 0,
      regular: 0,
      at_risk: 0,
      new: 0,
      dormant: 0
    };

    // Populate counts from aggregated data
    segmentData?.forEach((item: any) => {
      const segment = item.segment as CustomerSegment;
      const count = item.count || 0;
      if (segment in segmentCounts) {
        segmentCounts[segment] = count;
      }
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