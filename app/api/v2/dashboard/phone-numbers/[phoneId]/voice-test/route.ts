import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { voiceSynthesisService } from '@/lib/voice-synthesis';
import { VoiceSettings } from '@/app/models/dashboard';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    phoneId: string;
  };
}

/**
 * POST /api/v2/dashboard/phone-numbers/[phoneId]/voice-test
 * Test voice settings for a specific phone number
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = getSupabaseServer();
    const { phoneId } = params;
    const body = await request.json();
    
    const { voiceId, text = 'Hello! Welcome to our business. How can I help you today?' } = body;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate text length
    if (text.length > 500) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 500 characters allowed.' },
        { status: 400 }
      );
    }

    // Fetch phone number with ownership check
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

    // Use provided voiceId or current settings
    const voiceSettings: VoiceSettings = {
      voiceId: voiceId || phoneNumber.voice_settings?.voiceId || 'kdmDKE6EkgrWrrykO9Qt'
    };

    // Generate test audio
    const result = await voiceSynthesisService.synthesizeVoice({
      text,
      settings: voiceSettings,
      tenantId: `${phoneNumber.business_id}-${phoneId}` // Include phone ID for unique caching
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Voice synthesis failed' },
        { status: 500 }
      );
    }

    // Log test for monitoring
    console.log(`Voice test generated for phone ${phoneId}:`, {
      businessId: phoneNumber.business_id,
      voiceId: voiceSettings.voiceId,
      textLength: text.length,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Voice test generated successfully',
      audioUrl: result.audioUrl,
      duration: result.duration,
      voiceSettings,
      phoneId
    });

  } catch (error) {
    console.error('Error testing voice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}