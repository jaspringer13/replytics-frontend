import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { VoiceSettings } from '@/app/models/dashboard';

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Fixed voice ID - no customization allowed
const DEFAULT_VOICE_ID = 'kdmDKE6EkgrWrrykO9Qt';

/**
 * GET /api/v2/dashboard/business/voice-settings
 * Get voice configuration for the business
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

    // Fetch voice settings from database
    const { data: business, error } = await supabase
      .from('businesses')
      .select('voice_settings')
      .eq('id', tenantId)
      .single();

    if (error || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Return voice settings with defaults if not set
    const voiceSettings: VoiceSettings = business.voice_settings || {
      voiceId: DEFAULT_VOICE_ID
    };

    return NextResponse.json({
      success: true,
      data: voiceSettings
    });

  } catch (error) {
    console.error('Error fetching voice settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// No PATCH method - voice settings cannot be customized

/**
 * POST /api/v2/dashboard/business/voice-settings/test
 * Test voice settings with a sample message
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

    const { message = 'Hello! This is a test of your voice settings.', settings } = await request.json();

    // Here you would integrate with your voice synthesis service
    // For now, return a mock response
    return NextResponse.json({
      success: true,
      message: 'Voice test initiated',
      audioUrl: `/api/v2/dashboard/business/voice-settings/test-audio?voice=${settings?.voiceId || 'default'}`,
      duration: 3.5
    });

  } catch (error) {
    console.error('Error testing voice settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}