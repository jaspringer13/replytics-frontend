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
 * GET /api/v2/dashboard/phone-numbers/[phoneId]
 * Get a specific phone number
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Fetch the phone number with business ownership check
    const { data: phoneNumber, error } = await supabase
      .from('phone_numbers')
      .select(`
        *,
        businesses!inner(owner_id)
      `)
      .eq('id', phoneId)
      .eq('businesses.owner_id', user.id)
      .single();

    if (error || !phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number not found' },
        { status: 404 }
      );
    }

    // Transform to frontend format
    const formattedPhoneNumber = {
      id: phoneNumber.id,
      businessId: phoneNumber.business_id,
      phoneNumber: phoneNumber.phone_number,
      displayName: phoneNumber.display_name,
      description: phoneNumber.description,
      address: phoneNumber.address,
      timezone: phoneNumber.timezone,
      isActive: phoneNumber.status === 'active',
      isPrimary: phoneNumber.is_primary,
      voiceSettings: phoneNumber.voice_settings || { voiceId: 'kdmDKE6EkgrWrrykO9Qt' },
      conversationRules: phoneNumber.conversation_rules || {
        allowMultipleServices: true,
        allowCancellations: true,
        allowRescheduling: true,
        noShowBlockEnabled: false,
        noShowThreshold: 3
      },
      smsSettings: {
        enabled: phoneNumber.sms_enabled,
        remindersEnabled: true,
        reminderHours: phoneNumber.sms_reminder_hours || 24
      },
      operatingHours: phoneNumber.operating_hours || [],
      assignedStaffIds: phoneNumber.assigned_staff_ids || [],
      createdAt: phoneNumber.created_at,
      updatedAt: phoneNumber.updated_at
    };

    return NextResponse.json(formattedPhoneNumber);

  } catch (error) {
    console.error('Error in phone number GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v2/dashboard/phone-numbers/[phoneId]
 * Update a phone number
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = getSupabaseServer();
    const { phoneId } = params;
    const body = await request.json();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify ownership
    const { data: existingPhone, error: fetchError } = await supabase
      .from('phone_numbers')
      .select(`
        *,
        businesses!inner(owner_id)
      `)
      .eq('id', phoneId)
      .eq('businesses.owner_id', user.id)
      .single();

    if (fetchError || !existingPhone) {
      return NextResponse.json(
        { error: 'Phone number not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.displayName !== undefined) updateData.display_name = body.displayName;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.isActive !== undefined) updateData.status = body.isActive ? 'active' : 'suspended';
    if (body.isPrimary !== undefined) updateData.is_primary = body.isPrimary;
    if (body.voiceSettings !== undefined) updateData.voice_settings = body.voiceSettings;
    if (body.conversationRules !== undefined) updateData.conversation_rules = body.conversationRules;
    if (body.assignedStaffIds !== undefined) updateData.assigned_staff_ids = body.assignedStaffIds;

    if (body.smsSettings !== undefined) {
      updateData.sms_enabled = body.smsSettings.enabled;
      updateData.sms_reminder_hours = body.smsSettings.reminderHours;
    }

    // Update the phone number
    const { data: updatedPhone, error: updateError } = await supabase
      .from('phone_numbers')
      .update(updateData)
      .eq('id', phoneId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating phone number:', updateError);
      return NextResponse.json(
        { error: 'Failed to update phone number' },
        { status: 500 }
      );
    }

    // Broadcast update for real-time sync
    const channel = supabase.channel(`phone-number:${phoneId}`);
    await channel.subscribe();
    
    try {
      await channel.send({
        type: 'broadcast',
        event: 'phone_number_updated',
        payload: {
          phoneId,
          businessId: existingPhone.business_id,
          updates: body,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      await supabase.removeChannel(channel);
    }

    // Transform and return updated data
    const formattedPhoneNumber = {
      id: updatedPhone.id,
      businessId: updatedPhone.business_id,
      phoneNumber: updatedPhone.phone_number,
      displayName: updatedPhone.display_name,
      description: updatedPhone.description,
      address: updatedPhone.address,
      timezone: updatedPhone.timezone,
      isActive: updatedPhone.status === 'active',
      isPrimary: updatedPhone.is_primary,
      voiceSettings: updatedPhone.voice_settings || { voiceId: 'kdmDKE6EkgrWrrykO9Qt' },
      conversationRules: updatedPhone.conversation_rules || {
        allowMultipleServices: true,
        allowCancellations: true,
        allowRescheduling: true,
        noShowBlockEnabled: false,
        noShowThreshold: 3
      },
      smsSettings: {
        enabled: updatedPhone.sms_enabled,
        remindersEnabled: true,
        reminderHours: updatedPhone.sms_reminder_hours || 24
      },
      operatingHours: updatedPhone.operating_hours || [],
      assignedStaffIds: updatedPhone.assigned_staff_ids || [],
      createdAt: updatedPhone.created_at,
      updatedAt: updatedPhone.updated_at
    };

    return NextResponse.json(formattedPhoneNumber);

  } catch (error) {
    console.error('Error in phone number PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v2/dashboard/phone-numbers/[phoneId]/release
 * Release a phone number back to Twilio
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Verify ownership and check if it's the last phone number
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Check total phone numbers
    const { count, error: countError } = await supabase
      .from('phone_numbers')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .neq('status', 'released');

    if (countError || count === null || count <= 1) {
      return NextResponse.json(
        { error: 'Cannot release the only phone number' },
        { status: 400 }
      );
    }

    // Mark as released (soft delete)
    const { error: updateError } = await supabase
      .from('phone_numbers')
      .update({
        status: 'released',
        updated_at: new Date().toISOString()
      })
      .eq('id', phoneId)
      .eq('business_id', business.id);

    if (updateError) {
      console.error('Error releasing phone number:', updateError);
      return NextResponse.json(
        { error: 'Failed to release phone number' },
        { status: 500 }
      );
    }

    // In production, this would also release the number from Twilio

    return NextResponse.json({ 
      success: true,
      message: 'Phone number released successfully' 
    });

  } catch (error) {
    console.error('Error in phone number DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}