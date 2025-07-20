import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { VoiceSettings } from '@/app/models/dashboard';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    phoneId: string;
  };
}

/**
 * GET /api/v2/dashboard/phone-numbers/[phoneId]/voice-settings
 * Get voice settings for a specific phone number
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
        voice_settings,
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

    const voiceSettings: VoiceSettings = phoneNumber.voice_settings || {
      voiceId: 'kdmDKE6EkgrWrrykO9Qt'
    };

    return NextResponse.json(voiceSettings);

  } catch (error) {
    console.error('Error fetching voice settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v2/dashboard/phone-numbers/[phoneId]/voice-settings
 * Update voice settings for a specific phone number
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = getSupabaseServer();
    const { phoneId } = params;
    const updates: Partial<VoiceSettings> = await request.json();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate voice ID if provided
    const VALID_VOICE_IDS = [
      'kdmDKE6EkgrWrrykO9Qt',
      'pNInz6obpgDQGcFmaJgB',
      'Yko7PKHZNXotIFUBG7I9',
      'VR6AewLTigWG4xSOukaG',
      'EXAVITQu4vr4xnSDxMaL',
      'ErXwobaYiN019PkySvjV'
    ];

    if (updates.voiceId && !VALID_VOICE_IDS.includes(updates.voiceId)) {
      return NextResponse.json(
        { error: 'Invalid voice ID' },
        { status: 400 }
      );
    }

    // Verify ownership and get current settings
    const { data: phoneNumber, error: fetchError } = await supabase
      .from('phone_numbers')
      .select(`
        id,
        business_id,
        voice_settings,
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

    const currentSettings = phoneNumber.voice_settings || { voiceId: 'kdmDKE6EkgrWrrykO9Qt' };
    const newSettings: VoiceSettings = {
      ...currentSettings,
      ...updates
    };

    // Update voice settings
    const { error: updateError } = await supabase
      .from('phone_numbers')
      .update({
        voice_settings: newSettings,
        updated_at: new Date().toISOString()
      })
      .eq('id', phoneId);

    if (updateError) {
      console.error('Error updating voice settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to update voice settings' },
        { status: 500 }
      );
    }

    // CRITICAL: Broadcast phone-specific voice settings update
    const channel = supabase.channel(`phone-voice-settings:${phoneId}`);
    await channel.subscribe();
    
    try {
      await channel.send({
        type: 'broadcast',
        event: 'phone_voice_settings_updated',
        payload: {
          phoneId,
          businessId: phoneNumber.business_id,
          settings: newSettings,
          timestamp: new Date().toISOString(),
          requiresReload: true // Signal to voice agent to hot-reload this phone's config
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
          type: 'voice_settings',
          settings: newSettings,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      await supabase.removeChannel(businessChannel);
    }

    return NextResponse.json({
      success: true,
      data: newSettings,
      message: 'Voice settings updated successfully',
      phoneId,
      realTimeUpdate: 'Voice agent will update in real-time for this phone number'
    });

  } catch (error) {
    console.error('Error updating voice settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}