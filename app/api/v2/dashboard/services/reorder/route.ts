import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
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
 * SECURITY: Bulletproof NextAuth session validation with tenant isolation
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY CRITICAL: Validate NextAuth session first - ZERO BYPASS ALLOWED
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId || !session?.user?.tenantId) {
      console.warn('[Security] Unauthorized access attempt to service reorder');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use authenticated business context - bulletproof tenant isolation
    const { tenantId, businessId } = session.user;

    const { serviceIds }: ReorderRequest = await request.json();

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json(
        { error: 'Service IDs array is required' },
        { status: 400 }
      );
    }

    // SECURITY: Verify all services belong to authenticated business
    const { data: existingServices, error: fetchError } = await supabase
      .from('services')
      .select('id')
      .eq('business_id', businessId)
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

    // SECURITY: Update display_order for each service with authenticated context
    const updatePromises = serviceIds.map((serviceId, index) =>
      supabase
        .from('services')
        .update({
          display_order: index,
          updated_at: new Date().toISOString()
        })
        .eq('id', serviceId)
        .eq('business_id', businessId)
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

    // Broadcast update for real-time sync with authenticated context
    const channel = supabase.channel(`services:${businessId}`);
    await channel.send({
      type: 'broadcast',
      event: 'services_reordered',
      payload: {
        businessId: businessId,
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