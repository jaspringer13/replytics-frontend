import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';


interface ReorderRequest {
  serviceIds: string[];
}

/**
 * POST /api/v2/dashboard/services/reorder
 * Reorder services by updating their display_order
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
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
    await channel.unsubscribe();
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