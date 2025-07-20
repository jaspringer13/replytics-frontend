import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    phoneId: string;
  };
}

/**
 * POST /api/v2/dashboard/phone-numbers/[phoneId]/set-primary
 * Set a phone number as the primary for the business
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = getSupabaseServer();
    const { phoneId } = params;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify ownership and get business ID
    const { data: phoneNumber, error: fetchError } = await supabase
      .from('phone_numbers')
      .select(`
        id,
        business_id,
        status,
        is_primary,
        businesses!inner(owner_id)
      `)
      .eq('id', phoneId)
      .eq('businesses.owner_id', user.id)
      .single();

    if (fetchError || !phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number not found' },
        { status: 404 }
      );
    }

    // Check if phone is active
    if (phoneNumber.status !== 'active') {
      return NextResponse.json(
        { error: 'Cannot set an inactive phone number as primary' },
        { status: 400 }
      );
    }

    // Check if already primary
    if (phoneNumber.is_primary) {
      return NextResponse.json({
        message: 'Phone number is already the primary',
        phoneId
      });
    }

    // Start a transaction to update primary status
    // First, unset the current primary
    const { error: unsetError } = await supabase
      .from('phone_numbers')
      .update({
        is_primary: false,
        updated_at: new Date().toISOString()
      })
      .eq('business_id', phoneNumber.business_id)
      .eq('is_primary', true);

    if (unsetError) {
      console.error('Error unsetting current primary:', unsetError);
      return NextResponse.json(
        { error: 'Failed to update primary phone number' },
        { status: 500 }
      );
    }

    // Set the new primary
    const { error: setPrimaryError } = await supabase
      .from('phone_numbers')
      .update({
        is_primary: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', phoneId);

    if (setPrimaryError) {
      console.error('Error setting new primary:', setPrimaryError);
      return NextResponse.json(
        { error: 'Failed to set primary phone number' },
        { status: 500 }
      );
    }

    // CRITICAL: Broadcast primary phone change
    const businessChannel = supabase.channel(`business:${phoneNumber.business_id}`);
    await businessChannel.subscribe();
    
    try {
      await businessChannel.send({
        type: 'broadcast',
        event: 'primary_phone_changed',
        payload: {
          businessId: phoneNumber.business_id,
          newPrimaryPhoneId: phoneId,
          timestamp: new Date().toISOString(),
          requiresReload: true // All voice agents need to update their primary phone reference
        }
      });
    } finally {
      await supabase.removeChannel(businessChannel);
    }

    // Also update the business record with the new primary phone
    const { error: businessUpdateError } = await supabase
      .from('businesses')
      .update({
        primary_phone_id: phoneId,
        updated_at: new Date().toISOString()
      })
      .eq('id', phoneNumber.business_id);

    if (businessUpdateError) {
      console.error('Error updating business primary phone:', businessUpdateError);
      // Non-critical error, primary is already set on phone_numbers table
    }

    return NextResponse.json({
      success: true,
      message: 'Primary phone number updated successfully',
      phoneId,
      businessId: phoneNumber.business_id,
      realTimeUpdate: 'All voice agents will update to use this as the primary phone'
    });

  } catch (error) {
    console.error('Error setting primary phone:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}