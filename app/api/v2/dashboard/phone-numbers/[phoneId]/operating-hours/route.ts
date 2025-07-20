import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { ValidTimezone } from '@/app/models/dashboard';

interface OperatingHoursDay {
  day: string;
  enabled: boolean;
  hours?: Array<{
    open: string;
    close: string;
  }>;
}

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    phoneId: string;
  };
}

/**
 * GET /api/v2/dashboard/phone-numbers/[phoneId]/operating-hours
 * Get operating hours for a specific phone number
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
        operating_hours,
        timezone,
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

    return NextResponse.json({
      operatingHours: phoneNumber.operating_hours || [],
      timezone: phoneNumber.timezone || 'America/New_York'
    });

  } catch (error) {
    console.error('Error fetching operating hours:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v2/dashboard/phone-numbers/[phoneId]/operating-hours
 * Update operating hours for a specific phone number
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

    // Validate operating hours if provided
    if (body.operatingHours !== undefined) {
      if (!Array.isArray(body.operatingHours) || body.operatingHours.length !== 7) {
        return NextResponse.json(
          { error: 'Operating hours must be an array of 7 days' },
          { status: 400 }
        );
      }

      // Validate each day
      for (const day of body.operatingHours) {
        if (!day.day || typeof day.enabled !== 'boolean') {
          return NextResponse.json(
            { error: 'Invalid operating hours format' },
            { status: 400 }
          );
        }

        if (day.enabled && day.hours) {
          for (const period of day.hours) {
            if (!period.open || !period.close) {
              return NextResponse.json(
                { error: 'Each time period must have open and close times' },
                { status: 400 }
              );
            }

            // Validate time format (HH:MM)
            const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(period.open) || !timeRegex.test(period.close)) {
              return NextResponse.json(
                { error: 'Time must be in HH:MM format' },
                { status: 400 }
              );
            }

            // Ensure open time is before close time
            const openTime = period.open.split(':').map(Number);
            const closeTime = period.close.split(':').map(Number);
            const openMinutes = openTime[0] * 60 + openTime[1];
            const closeMinutes = closeTime[0] * 60 + closeTime[1];

            if (openMinutes >= closeMinutes) {
              return NextResponse.json(
                { error: 'Open time must be before close time' },
                { status: 400 }
              );
            }
          }
        }
      }
    }

    // Validate timezone if provided
    const VALID_TIMEZONES: ValidTimezone[] = [
      'America/New_York',
      'America/Chicago', 
      'America/Denver',
      'America/Los_Angeles',
      'America/Phoenix',
      'America/Anchorage',
      'Pacific/Honolulu'
    ];

    if (body.timezone && !VALID_TIMEZONES.includes(body.timezone)) {
      return NextResponse.json(
        { error: 'Invalid timezone' },
        { status: 400 }
      );
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

    if (body.operatingHours !== undefined) {
      updateData.operating_hours = body.operatingHours;
    }

    if (body.timezone !== undefined) {
      updateData.timezone = body.timezone;
    }

    // Update phone number
    const { error: updateError } = await supabase
      .from('phone_numbers')
      .update(updateData)
      .eq('id', phoneId);

    if (updateError) {
      console.error('Error updating operating hours:', updateError);
      return NextResponse.json(
        { error: 'Failed to update operating hours' },
        { status: 500 }
      );
    }

    // CRITICAL: Broadcast phone-specific operating hours update
    const channel = supabase.channel(`phone-operating-hours:${phoneId}`);
    await channel.subscribe();
    
    try {
      await channel.send({
        type: 'broadcast',
        event: 'phone_operating_hours_updated',
        payload: {
          phoneId,
          businessId: phoneNumber.business_id,
          operatingHours: body.operatingHours,
          timezone: body.timezone,
          timestamp: new Date().toISOString(),
          requiresReload: true // Signal to voice agent to hot-reload this phone's schedule
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
          type: 'operating_hours',
          settings: {
            operatingHours: body.operatingHours,
            timezone: body.timezone
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
        operatingHours: body.operatingHours,
        timezone: body.timezone
      },
      message: 'Operating hours updated successfully',
      phoneId,
      realTimeUpdate: 'Voice agent will update schedule in real-time for this phone number'
    });

  } catch (error) {
    console.error('Error updating operating hours:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}