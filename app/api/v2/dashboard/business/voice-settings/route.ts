import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { VoiceSettings } from '@/app/models/dashboard';

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Required environment variables are not set: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Available voice IDs from ElevenLabs or similar service
const AVAILABLE_VOICES = {
  'kdmDKE6EkgrWrrykO9Qt': 'Professional Female',
  'pNInz6obpgDQGcFmaJgB': 'Friendly Male',
  'Yko7PKHZNXotIFUBG7I9': 'Professional Male',
  'VR6AewLTigWG4xSOukaG': 'Warm Female'
};

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
      voiceId: 'kdmDKE6EkgrWrrykO9Qt',
      speakingStyle: 'friendly_professional',
      speed: 1.0,
      pitch: 1.0
    };

    return NextResponse.json({
      success: true,
      data: voiceSettings,
      availableVoices: AVAILABLE_VOICES
    });

  } catch (error) {
    console.error('Error fetching voice settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v2/dashboard/business/voice-settings
 * Update voice settings - triggers real-time update to voice agent
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

    const updates: Partial<VoiceSettings> = await request.json();

    // Validate voice settings
    if (updates.voiceId && !AVAILABLE_VOICES[updates.voiceId as keyof typeof AVAILABLE_VOICES]) {
      return NextResponse.json(
        { error: 'Invalid voice ID' },
        { status: 400 }
      );
    }

    if (updates.speed !== undefined && (updates.speed < 0.5 || updates.speed > 2.0)) {
      return NextResponse.json(
        { error: 'Speed must be between 0.5 and 2.0' },
        { status: 400 }
      );
    }

    if (updates.pitch !== undefined && (updates.pitch < 0.5 || updates.pitch > 2.0)) {
      return NextResponse.json(
        { error: 'Pitch must be between 0.5 and 2.0' },
        { status: 400 }
      );
    }

    const validStyles = ['friendly_professional', 'casual', 'formal', 'enthusiastic'];
    if (updates.speakingStyle && !validStyles.includes(updates.speakingStyle)) {
      return NextResponse.json(
        { error: 'Invalid speaking style' },
        { status: 400 }
      );
    }

    // Get current settings to merge with updates
    const { data: business, error: fetchError } = await supabase
      .from('businesses')
      .select('voice_settings')
      .eq('id', tenantId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch current settings' },
        { status: 500 }
      );
    }

    const currentSettings = business?.voice_settings || {
      voiceId: 'kdmDKE6EkgrWrrykO9Qt',
      speakingStyle: 'friendly_professional',
      speed: 1.0,
      pitch: 1.0
    };

    // Merge updates with current settings
    const newSettings: VoiceSettings = {
      ...currentSettings,
      ...updates
    };

    // Update in database
    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        voice_settings: newSettings,
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantId);

    if (updateError) {
      console.error('Error updating voice settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to update voice settings' },
        { status: 500 }
      );
    }

    // CRITICAL: Broadcast real-time update for voice agent
    const channel = supabase.channel(`voice-settings:${tenantId}`);
    
    try {
      // Send immediate notification
      await channel.send({
        type: 'broadcast',
        event: 'voice_settings_updated',
        payload: {
          businessId: tenantId,
          settings: newSettings,
          timestamp: new Date().toISOString(),
          requiresReload: true // Signal to voice agent to hot-reload config
        }
      });
    } finally {
      // Clean up channel
      await supabase.removeChannel(channel);
    }

    // Also update via general business channel
    const businessChannel = supabase.channel(`business:${tenantId}`);
    try {
      await businessChannel.send({
        type: 'broadcast',
        event: 'settings_updated',
        payload: {
          businessId: tenantId,
          type: 'voice_settings',
          settings: newSettings,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      // Clean up channel
      await supabase.removeChannel(businessChannel);
    }

    return NextResponse.json({
      success: true,
      data: newSettings,
      message: 'Voice settings updated successfully',
      realTimeUpdate: 'Voice agent will update in real-time'
    });

  } catch (error) {
    console.error('Error updating voice settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
      audioUrl: `/api/v2/dashboard/business/voice-settings/test-audio?voice=${encodeURIComponent(settings?.voiceId || 'default')}`,
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