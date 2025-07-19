import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Helper to validate tenant access
async function validateTenantAccess(tenantId: string, userId: string): Promise<boolean> {
  const { data, error } = await getSupabaseServer()
    .from('business_users')
    .select('role')
    .eq('business_id', tenantId)
    .eq('user_id', userId)
    .single();
  
  return !error && !!data;
}

interface ReorderRequest {
  serviceIds: string[];
}

/**
 * POST /api/v2/dashboard/services/reorder
 * Reorder services by updating their display_order
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check user's access to this tenant
    const tenantId = request.headers.get('X-Tenant-ID');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }
    const hasAccess = await validateTenantAccess(tenantId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { serviceIds }: ReorderRequest = await request.json();

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json(
        { error: 'Service IDs array is required' },
        { status: 400 }
      );
    }

    // Verify all services belong to the business
    const { data: existingServices, error: fetchError } = await getSupabaseServer()
      .from('services')
      .select('id')
      .eq('business_id', tenantId)
      .in('id', serviceIds);

    if (fetchError) {
      console.error('Error fetching services:', fetchError);
      return NextResponse.json(
        { error: 'Failed to verify services' },
        { status: 500 }
      );
    }

    // Check if all provided service IDs exist
    const existingIds = existingServices?.map(s => s.id) || [];
    const invalidIds = serviceIds.filter(id => !existingIds.includes(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid service IDs: ${invalidIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Use database transaction for atomic service reordering
    const { data, error: reorderError } = await getSupabaseServer().rpc('reorder_services', {
      p_business_id: tenantId,
      p_service_ids: serviceIds
    });

    if (reorderError) {
      console.error('Error reordering services:', reorderError);
      return NextResponse.json(
        { error: 'Failed to reorder services' },
        { status: 500 }
      );
    }

    // Broadcast update for real-time sync
    const channel = getSupabaseServer().channel(`services:${tenantId}`);
    await channel.send({
      type: 'broadcast',
      event: 'services_reordered',
      payload: {
        businessId: tenantId,
        serviceIds,
        timestamp: new Date().toISOString()
      }
    });

    // Clean up the channel
    getSupabaseServer().removeChannel(channel);

    return NextResponse.json({
      success: true,
      message: 'Services reordered successfully',
      serviceIds
    });

  } catch (error) {
    console.error('Error in reorder services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}