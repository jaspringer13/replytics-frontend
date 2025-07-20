import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    phoneId: string;
  };
}

interface SMSSettings {
  enabled: boolean;
  remindersEnabled: boolean;
  reminderHours: number;
}

/**
 * GET /api/v2/dashboard/phone-numbers/[phoneId]/sms-settings
 * Get SMS settings for a specific phone number
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

    // Fetch phone number with ownership check
    const { data: phoneNumber, error } = await supabase
      .from('phone_numbers')
      .select(`
        sms_enabled,
        sms_reminder_hours,
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

    const smsSettings: SMSSettings = {
      enabled: phoneNumber.sms_enabled ?? true,
      remindersEnabled: true, // Default for now, could be stored in DB later
      reminderHours: phoneNumber.sms_reminder_hours || 24
    };

    return NextResponse.json(smsSettings);

  } catch (error) {
    console.error('Error fetching SMS settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v2/dashboard/phone-numbers/[phoneId]/sms-settings
 * Update SMS settings for a specific phone number
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = getSupabaseServer();
    const { phoneId } = params;
    const updates: Partial<SMSSettings> = await request.json();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate reminder hours if provided
    if (updates.reminderHours !== undefined) {
      if (updates.reminderHours < 1 || updates.reminderHours > 72) {
        return NextResponse.json(
          { error: 'Reminder hours must be between 1 and 72' },
          { status: 400 }
        );
      }
    }

    // Verify ownership
    const { data: phoneNumber, error: fetchError } = await supabase
      .from('phone_numbers')
      .select(`
        id,
        business_id,
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

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.enabled !== undefined) {
      updateData.sms_enabled = updates.enabled;
    }

    if (updates.reminderHours !== undefined) {
      updateData.sms_reminder_hours = updates.reminderHours;
    }

    // Update SMS settings
    const { error: updateError } = await supabase
      .from('phone_numbers')
      .update(updateData)
      .eq('id', phoneId);

    if (updateError) {
      console.error('Error updating SMS settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to update SMS settings' },
        { status: 500 }
      );
    }

    // CRITICAL: Broadcast phone-specific SMS settings update
    const channel = supabase.channel(`phone-sms-settings:${phoneId}`);
    await channel.subscribe();
    
    try {
      await channel.send({
        type: 'broadcast',
        event: 'phone_sms_settings_updated',
        payload: {
          phoneId,
          businessId: phoneNumber.business_id,
          settings: {
            enabled: updates.enabled ?? updateData.sms_enabled,
            remindersEnabled: updates.remindersEnabled ?? true,
            reminderHours: updates.reminderHours ?? updateData.sms_reminder_hours
          },
          timestamp: new Date().toISOString(),
          requiresReload: false // SMS settings don't require voice agent reload
        }
      });
    } finally {
      await supabase.removeChannel(channel);
    }

    // Also broadcast to business-wide channel
    const businessChannel = supabase.channel(`business:${phoneNumber.business_id}`);
    await businessChannel.subscribe();
    
    try {
      await businessChannel.send({
        type: 'broadcast',
        event: 'phone_settings_updated',
        payload: {
          phoneId,
          businessId: phoneNumber.business_id,
          type: 'sms_settings',
          settings: {
            enabled: updates.enabled,
            remindersEnabled: updates.remindersEnabled,
            reminderHours: updates.reminderHours
          },
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      await supabase.removeChannel(businessChannel);
    }

    return NextResponse.json({
      success: true,
      data: {
        enabled: updates.enabled,
        remindersEnabled: updates.remindersEnabled,
        reminderHours: updates.reminderHours
      },
      message: 'SMS settings updated successfully',
      phoneId,
      realTimeUpdate: 'SMS service will update settings in real-time for this phone number'
    });

  } catch (error) {
    console.error('Error updating SMS settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}