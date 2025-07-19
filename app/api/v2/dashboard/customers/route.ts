import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { Customer, CustomerSegment, PaginatedResponse, FilterOptions } from '@/app/models/dashboard';


/**
 * GET /api/v2/dashboard/customers
 * Get customers list with segmentation and filtering
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
    const filters: FilterOptions = {
      search: searchParams.get('search') || undefined,
      segment: searchParams.get('segment') as CustomerSegment | undefined,
      sortBy: searchParams.get('sortBy') || 'lastInteraction',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20')
    };

    // Validate pagination
    if (filters.page! < 1) filters.page = 1;
    if (filters.pageSize! < 1 || filters.pageSize! > 100) filters.pageSize = 20;

    // Use materialized view for efficient segment filtering
    let query = getSupabaseServer()
      .from('customer_segments')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    // Apply segment filter at database level
    if (filters.segment) {
      query = query.eq('segment', filters.segment);
    }

    // Apply search filter
    if (filters.search) {
      const raw = filters.search.toLowerCase();
      const escaped = raw.replace(/[%_,]/g, '\\$&');
      const searchTerm = `%${escaped}%`;
      query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},ani_hash.ilike.${searchTerm}`);
    }

    // Apply sorting
    const sortColumn = getSortColumn(filters.sortBy as string);
    query = query.order(sortColumn, { ascending: filters.sortOrder === 'asc' });

    // Apply pagination
    const offset = (filters.page! - 1) * filters.pageSize!;
    query = query.range(offset, offset + filters.pageSize! - 1);

    const { data: customers, error, count } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch customers' },
        { status: 500 }
      );
    }

    // Transform customers (segments already calculated in view)
    const transformedCustomers: Customer[] = (customers || []).map(customer => ({
      id: customer.ani_hash,
      businessId: tenantId,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.ani_hash, // This is a hash, not the actual phone
      email: customer.email,
      totalAppointments: customer.total_appointments,
      noShowCount: customer.no_show_count,
      lifetimeValue: customer.total_revenue,
      averageServiceValue: customer.average_service_value,
      lastInteraction: customer.last_visit || new Date(customer.updated_at),
      firstInteraction: customer.first_visit || new Date(customer.created_at),
      segment: customer.segment as CustomerSegment,
      preferences: customer.preferences,
      flags: customer.flags
    }));

    const response: PaginatedResponse<Customer> = {
      data: transformedCustomers,
      total: count || 0,
      page: filters.page!,
      pageSize: filters.pageSize!,
      hasMore: (count || 0) > offset + filters.pageSize!
    };

    return NextResponse.json({
      success: true,
      ...response
    });

  } catch (error) {
    console.error('Error in GET customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions

function getSortColumn(sortBy: string): string {
  const sortMap: Record<string, string> = {
    lastInteraction: 'last_visit',
    firstName: 'first_name',
    lastName: 'last_name',
    totalAppointments: 'total_appointments',
    lifetimeValue: 'total_revenue'
  };
  return sortMap[sortBy] || 'last_visit';
}

