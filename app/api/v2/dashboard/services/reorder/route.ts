import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const { data: existingServices, error: fetchError } = await supabase
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

    // Update display_order for each service
    const updatePromises = serviceIds.map((serviceId, index) =>
      supabase
        .from('services')
        .update({
          display_order: index,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId)
        .eq('business_id', tenantId)
    );

    const results = await Promise.all(updatePromises);

    // Check if any updates failed
    const failedUpdates = results.filter(result => result.error);
    if (failedUpdates.length > 0) {
      console.error('Some service updates failed:', failedUpdates);
      return NextResponse.json(
        { error: 'Failed to update some services' },
        { status: 500 }
      );
    }

    // Broadcast update for real-time sync
    const channel = supabase.channel(`services:${tenantId}`);
    await channel.send({
      type: 'broadcast',
      event: 'services_reordered',
      payload: {
        businessId: tenantId,
        serviceIds,
        timestamp: new Date().toISOString()
      }
    });

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