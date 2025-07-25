import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createClient } from '@supabase/supabase-js';
import { Customer, CustomerSegment, PaginatedResponse, FilterOptions } from '@/app/models/dashboard';

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/v2/dashboard/customers
 * Get customers list with segmentation and filtering
 * SECURITY: Bulletproof NextAuth session validation with tenant isolation
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY CRITICAL: Validate NextAuth session first - ZERO BYPASS ALLOWED
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId || !session?.user?.tenantId) {
      console.warn('[Security] Unauthorized access attempt to customers list');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use authenticated business context - bulletproof tenant isolation
    const { tenantId, businessId } = session.user;

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

    // SECURITY: Fetch customers from caller_memory table with authenticated tenant context
    let query = supabase
      .from('caller_memory')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,ani_hash.ilike.%${searchTerm}%`);
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

    // SECURITY: Fetch appointment data for each customer with tenant context
    const customerIds = customers?.map(c => c.ani_hash) || [];
    const appointmentData = await fetchAppointmentData(businessId, customerIds);

    // Transform and segment customers
    const transformedCustomers: Customer[] = (customers || []).map(customer => {
      const appointments = appointmentData.get(customer.ani_hash) || {
        total: 0,
        noShows: 0,
        totalRevenue: 0,
        firstVisit: null,
        lastVisit: null
      };

      const segment = calculateSegment(customer, appointments);

      return {
        id: customer.ani_hash,
        businessId: businessId,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.ani_hash, // This is a hash, not the actual phone
        email: customer.email,
        totalAppointments: appointments.total,
        noShowCount: appointments.noShows,
        lifetimeValue: appointments.totalRevenue,
        averageServiceValue: appointments.total > 0 ? appointments.totalRevenue / appointments.total : 0,
        lastInteraction: appointments.lastVisit || new Date(customer.updated_at),
        firstInteraction: appointments.firstVisit || new Date(customer.created_at),
        segment,
        preferences: customer.preferences,
        flags: customer.flags
      };
    });

    // Filter by segment if specified
    const filteredCustomers = filters.segment
      ? transformedCustomers.filter(c => c.segment === filters.segment)
      : transformedCustomers;

    const response: PaginatedResponse<Customer> = {
      data: filteredCustomers,
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
    lastInteraction: 'updated_at',
    firstName: 'first_name',
    lastName: 'last_name',
    totalAppointments: 'updated_at', // We'll sort in memory for these
    lifetimeValue: 'updated_at'
  };
  return sortMap[sortBy] || 'updated_at';
}

async function fetchAppointmentData(businessId: string, customerIds: string[]) {
  if (customerIds.length === 0) return new Map();

  // SECURITY: Tenant-scoped appointment data fetching
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('customer_id, appointment_time, status, price')
    .eq('business_id', businessId)
    .in('customer_id', customerIds);

  if (error) {
    console.error('Error fetching appointment data:', error);
    return new Map();
  }

  // Aggregate appointment data by customer
  const customerAppointments = new Map<string, any>();

  appointments?.forEach(apt => {
    const existing = customerAppointments.get(apt.customer_id) || {
      total: 0,
      noShows: 0,
      totalRevenue: 0,
      firstVisit: null,
      lastVisit: null
    };

    existing.total += 1;
    if (apt.status === 'no_show') existing.noShows += 1;
    if (apt.status === 'completed') existing.totalRevenue += apt.price || 0;

    const aptDate = new Date(apt.appointment_time);
    if (!existing.firstVisit || aptDate < existing.firstVisit) {
      existing.firstVisit = aptDate;
    }
    if (!existing.lastVisit || aptDate > existing.lastVisit) {
      existing.lastVisit = aptDate;
    }

    customerAppointments.set(apt.customer_id, existing);
  });

  return customerAppointments;
}

function calculateSegment(customer: any, appointments: any): CustomerSegment {
  const daysSinceLastVisit = appointments.lastVisit
    ? Math.floor((Date.now() - appointments.lastVisit.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;

  const daysSinceFirstVisit = appointments.firstVisit
    ? Math.floor((Date.now() - appointments.firstVisit.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // New customer: First visit within 90 days
  if (daysSinceFirstVisit < 90) {
    return 'new';
  }

  // Dormant: No visit in 60+ days
  if (daysSinceLastVisit > 60) {
    return 'dormant';
  }

  // VIP: High lifetime value and regular visits
  if (appointments.totalRevenue > 2000 && appointments.total > 10) {
    return 'vip';
  }

  // At risk: Declining frequency (simplified logic)
  if (daysSinceLastVisit > 45 && appointments.total > 3) {
    return 'at_risk';
  }

  return 'regular';
}