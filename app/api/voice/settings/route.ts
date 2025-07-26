import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyVoiceKey } from '@/lib/voice-auth';

/**
 * GET /api/voice/settings?number=+1234567890
 * Get voice settings for a business by phone number
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  if (!verifyVoiceKey(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const phoneNumber = searchParams.get('number');

  if (!phoneNumber) {
    return NextResponse.json(
      { error: 'Phone number parameter is required' },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Look up business by phone number
    const { data: phoneMapping, error: phoneError } = await supabase
      .from('phone_numbers')
      .select('business_id')
      .eq('twilio_number', phoneNumber)
      .single();

    if (phoneError || !phoneMapping) {
      return NextResponse.json(
        { error: 'Phone number not found' },
        { status: 404 }
      );
    }

    // Get business voice settings
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, voice_settings, conversation_rules, timezone')
      .eq('id', phoneMapping.business_id)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Return voice settings with business context
    return NextResponse.json({
      business_id: business.id,
      business_name: business.name,
      timezone: business.timezone || 'America/New_York',
      voice_settings: business.voice_settings || {
        voiceId: 'kdmDKE6EkgrWrrykO9Qt',
        speakingStyle: 'friendly_professional',
        speed: 1.0,
        pitch: 1.0
      },
      conversation_rules: business.conversation_rules || {
        allowMultipleServices: true,
        allowCancellations: true,
        allowRescheduling: true,
        noShowBlockEnabled: false,
        noShowThreshold: 3
      }
    });

  } catch (error) {
    console.error('Error fetching voice settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}