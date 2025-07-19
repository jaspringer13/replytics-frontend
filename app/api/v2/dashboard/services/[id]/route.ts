import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { ServiceUpdate } from '@/app/models/dashboard';


/**
 * PATCH /api/v2/dashboard/services/[id]
 * Update a specific service
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const serviceId = params.id;
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    let updates: ServiceUpdate;
    try {
      updates = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate updates
    if (updates.duration !== undefined && (updates.duration < 15 || updates.duration > 480)) {
      return NextResponse.json(
        { error: 'Duration must be between 15 and 480 minutes' },
        { status: 400 }
      );
    }

    if (updates.price !== undefined && updates.price < 0) {
      return NextResponse.json(
        { error: 'Price cannot be negative' },
        { status: 400 }
      );
    }

    // Verify service belongs to business
    const { data: existingService, error: fetchError } = await getSupabaseServer()
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .eq('business_id', tenantId)
      .single();

    if (fetchError || !existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    // Only include fields that are being updated
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.active !== undefined) updateData.active = updates.active;
    if (updates.displayOrder !== undefined) updateData.display_order = updates.displayOrder;

    // Update service
    const { data: updatedService, error: updateError } = await getSupabaseServer()
      .from('services')
      .update(updateData)
      .eq('id', serviceId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating service:', updateError);
      return NextResponse.json(
        { error: 'Failed to update service' },
        { status: 500 }
      );
    }

    // Broadcast update for real-time sync
    const channel = getSupabaseServer().channel(`services:${tenantId}`);
    await channel.subscribe();
    
    await channel.send({
      type: 'broadcast',
      event: 'service_updated',
      payload: {
        businessId: tenantId,
        serviceId,
        updates: updateData,
        timestamp: new Date().toISOString()
      }
    });
    
    await getSupabaseServer().removeChannel(channel);

    return NextResponse.json({
      success: true,
      data: updatedService,
      message: 'Service updated successfully'
    });

  } catch (error) {
    console.error('Error in PATCH service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v2/dashboard/services/[id]
 * Delete a service (soft delete by setting active = false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const serviceId = params.id;
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Verify service belongs to business
    const { data: existingService, error: fetchError } = await getSupabaseServer()
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .eq('business_id', tenantId)
      .single();

    if (fetchError || !existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Check if service has future appointments
    const { data: appointments, error: appointmentError } = await getSupabaseServer()
      .from('appointments')
      .select('id')
      .eq('service_id', serviceId)
      .gte('appointment_time', new Date().toISOString())
      .limit(1);

    if (!appointmentError && appointments && appointments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete service with future appointments' },
        { status: 400 }
      );
    }

    // Soft delete by setting active = false
    const { error: updateError } = await getSupabaseServer()
      .from('services')
      .update({
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId);

    if (updateError) {
      console.error('Error deleting service:', updateError);
      return NextResponse.json(
        { error: 'Failed to delete service' },
        { status: 500 }
      );
    }

    // Broadcast update for real-time sync
    const channel = getSupabaseServer().channel(`services:${tenantId}`);
    await channel.subscribe();
    
    await channel.send({
      type: 'broadcast',
      event: 'service_deleted',
      payload: {
        businessId: tenantId,
        serviceId,
        timestamp: new Date().toISOString()
      }
    });
    
    await getSupabaseServer().removeChannel(channel);

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}