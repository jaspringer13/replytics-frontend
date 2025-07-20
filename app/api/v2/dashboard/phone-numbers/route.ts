import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * GET /api/v2/dashboard/phone-numbers
 * Get all phone numbers for the authenticated business
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get business ID for the user
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

    // Fetch all phone numbers for the business
    const { data: phoneNumbers, error } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('business_id', business.id)
      .order('is_primary', { ascending: false })
      .order('created_at');

    if (error) {
      console.error('Error fetching phone numbers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch phone numbers' },
        { status: 500 }
      );
    }

    // Transform to frontend format
    const formattedPhoneNumbers = (phoneNumbers || []).map(phone => ({
      id: phone.id,
      businessId: phone.business_id,
      phoneNumber: phone.phone_number,
      displayName: phone.display_name,
      description: phone.description,
      address: phone.address,
      timezone: phone.timezone,
      isActive: phone.status === 'active',
      isPrimary: phone.is_primary,
      voiceSettings: phone.voice_settings || { voiceId: 'kdmDKE6EkgrWrrykO9Qt' },
      conversationRules: phone.conversation_rules || {
        allowMultipleServices: true,
        allowCancellations: true,
        allowRescheduling: true,
        noShowBlockEnabled: false,
        noShowThreshold: 3
      },
      smsSettings: {
        enabled: phone.sms_enabled,
        remindersEnabled: true,
        reminderHours: phone.sms_reminder_hours || 24
      },
      operatingHours: phone.operating_hours || [],
      assignedStaffIds: phone.assigned_staff_ids || [],
      createdAt: phone.created_at,
      updatedAt: phone.updated_at
    }));

    return NextResponse.json(formattedPhoneNumbers);

  } catch (error) {
    console.error('Error in phone numbers GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/dashboard/phone-numbers
 * Provision a new phone number (placeholder - actual Twilio integration would go here)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const body = await request.json();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get business ID for the user
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

    const { displayName, areaCode, timezone = 'America/New_York', description } = body;

    if (!displayName) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }

    // In production, this would integrate with Twilio to provision a real number
    // For now, return a mock response
    return NextResponse.json({
      message: 'Phone number provisioning is not yet implemented',
      placeholder: {
        id: `placeholder-${Date.now()}`,
        businessId: business.id,
        phoneNumber: `+1${areaCode || '555'}5551234`,
        displayName,
        description,
        timezone,
        isActive: false,
        isPrimary: false,
        voiceSettings: { voiceId: 'kdmDKE6EkgrWrrykO9Qt' },
        conversationRules: {
          allowMultipleServices: true,
          allowCancellations: true,
          allowRescheduling: true,
          noShowBlockEnabled: false,
          noShowThreshold: 3
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in phone numbers POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}