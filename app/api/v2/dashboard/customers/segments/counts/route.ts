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

    // Use a single aggregation query for all segment counts
    let aggregationQuery = getSupabaseServer()
      .from('customer_segments')
      .select('segment')
      .eq('tenant_id', tenantId);

    if (search) {
      aggregationQuery = buildSearchFilter(aggregationQuery, search);
    }

    const { data: segmentData, error: segmentError } = await aggregationQuery;

    if (segmentError) {
      console.error('Error fetching segment data:', segmentError);
      return NextResponse.json(
        { error: 'Failed to fetch customer counts' },
        { status: 500 }
      );
    }

    // Count segments in memory
    const segmentCounts: SegmentCounts = {
      all: 0,
      vip: 0,
      regular: 0,
      at_risk: 0,
      new: 0,
      dormant: 0
    };

    segmentData?.forEach(item => {
      segmentCounts.all++;
      if (item.segment in segmentCounts) {
        segmentCounts[item.segment as CustomerSegment]++;
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