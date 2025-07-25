import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OperatingHours } from '@/app/models/dashboard';

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * GET /api/v2/dashboard/hours
 * Get all business hours for the week
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Fetch operating hours from database
    const { data: hours, error } = await supabase
      .from('operating_hours')
      .select('*')
      .eq('business_id', tenantId)
      .order('day_of_week', { ascending: true });

    if (error) {
      console.error('Error fetching operating hours:', error);
      return NextResponse.json(
        { error: 'Failed to fetch operating hours' },
        { status: 500 }
      );
    }

    // If no hours exist, create default hours (9 AM - 5 PM, closed Sunday)
    if (!hours || hours.length === 0) {
      const defaultHours = await createDefaultHours(tenantId);
      return NextResponse.json({
        success: true,
        data: defaultHours,
        isDefault: true
      });
    }

    // Transform to OperatingHours type
    const transformedHours: OperatingHours[] = hours.map(hour => ({
      id: hour.id,
      businessId: hour.business_id,
      dayOfWeek: hour.day_of_week,
      openTime: hour.open_time,
      closeTime: hour.close_time,
      isClosed: hour.is_closed,
      createdAt: new Date(hour.created_at),
      updatedAt: new Date(hour.updated_at)
    }));

    return NextResponse.json({
      success: true,
      data: transformedHours
    });

  } catch (error) {
    console.error('Error in GET hours:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v2/dashboard/hours
 * Update business hours (bulk update)
 */
export async function PATCH(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const updates: Partial<OperatingHours>[] = await request.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates must be an array' },
        { status: 400 }
      );
    }

    // Validate each update
    for (const update of updates) {
      if (update.dayOfWeek === undefined || update.dayOfWeek < 0 || update.dayOfWeek > 6) {
        return NextResponse.json(
          { error: 'Invalid day of week' },
          { status: 400 }
        );
      }

      if (!update.isClosed) {
        if (!update.openTime || !update.closeTime) {
          return NextResponse.json(
            { error: `Open and close times required for ${DAYS_OF_WEEK[update.dayOfWeek]}` },
            { status: 400 }
          );
        }

        // Validate time format (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(update.openTime) || !timeRegex.test(update.closeTime)) {
          return NextResponse.json(
            { error: 'Invalid time format. Use HH:MM' },
            { status: 400 }
          );
        }

        // Validate close time is after open time
        if (update.openTime >= update.closeTime) {
          return NextResponse.json(
            { error: `Close time must be after open time for ${DAYS_OF_WEEK[update.dayOfWeek]}` },
            { status: 400 }
          );
        }
      }
    }

    // Update each day's hours
    const updatePromises = updates.map(async (update) => {
      // Check if hours exist for this day
      const { data: existing } = await supabase
        .from('operating_hours')
        .select('id')
        .eq('business_id', tenantId)
        .eq('day_of_week', update.dayOfWeek!)
        .single();

      if (existing) {
        // Update existing hours
        return supabase
          .from('operating_hours')
          .update({
            open_time: update.openTime,
            close_time: update.closeTime,
            is_closed: update.isClosed || false,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Insert new hours
        return supabase
          .from('operating_hours')
          .insert({
            business_id: tenantId,
            day_of_week: update.dayOfWeek,
            open_time: update.openTime,
            close_time: update.closeTime,
            is_closed: update.isClosed || false
          });
      }
    });

    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Errors updating hours:', errors);
      return NextResponse.json(
        { error: 'Failed to update some hours' },
        { status: 500 }
      );
    }

    // Broadcast update for real-time sync
    const channel = supabase.channel(`hours:${tenantId}`);
    await channel.send({
      type: 'broadcast',
      event: 'hours_updated',
      payload: {
        businessId: tenantId,
        updates,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Business hours updated successfully'
    });

  } catch (error) {
    console.error('Error in PATCH hours:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to create default operating hours
 */
async function createDefaultHours(businessId: string): Promise<OperatingHours[]> {
  const defaultHours = [
    { day_of_week: 0, open_time: null, close_time: null, is_closed: true }, // Sunday
    { day_of_week: 1, open_time: '09:00', close_time: '17:00', is_closed: false }, // Monday
    { day_of_week: 2, open_time: '09:00', close_time: '17:00', is_closed: false }, // Tuesday
    { day_of_week: 3, open_time: '09:00', close_time: '17:00', is_closed: false }, // Wednesday
    { day_of_week: 4, open_time: '09:00', close_time: '17:00', is_closed: false }, // Thursday
    { day_of_week: 5, open_time: '09:00', close_time: '17:00', is_closed: false }, // Friday
    { day_of_week: 6, open_time: '10:00', close_time: '16:00', is_closed: false }, // Saturday
  ];

  const { data, error } = await supabase
    .from('operating_hours')
    .insert(
      defaultHours.map(h => ({
        business_id: businessId,
        ...h
      }))
    )
    .select();

  if (error) {
    console.error('Error creating default hours:', error);
    return [];
  }

  return data.map(hour => ({
    id: hour.id,
    businessId: hour.business_id,
    dayOfWeek: hour.day_of_week,
    openTime: hour.open_time,
    closeTime: hour.close_time,
    isClosed: hour.is_closed,
    createdAt: new Date(hour.created_at),
    updatedAt: new Date(hour.updated_at)
  }));
}