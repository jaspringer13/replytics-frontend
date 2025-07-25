import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { verifyVoiceKey } from '@/lib/voice-auth';

/**
 * Hash ANI with tenant secret for privacy
 */
function hashAni(ani: string, tenantId: string): string {
  const secret = process.env.VOICE_AGENT_AUTH_KEY || 'default-secret';
  return createHash('sha256')
    .update(`${ani}:${tenantId}:${secret}`)
    .digest('hex');
}

/**
 * GET /api/voice/ani?ani=+1234567890&business_id=uuid
 * Lookup caller memory by ANI
 */
export async function GET(request: NextRequest) {
  if (!verifyVoiceKey(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const ani = searchParams.get('ani');
  const businessId = searchParams.get('business_id');

  if (!ani || !businessId) {
    return NextResponse.json(
      { error: 'ANI and business_id parameters are required' },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const aniHash = hashAni(ani, businessId);
    
    const { data: memory, error } = await supabase
      .from('caller_memory')
      .select('*')
      .eq('ani_hash', aniHash)
      .eq('tenant_id', businessId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching caller memory:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      found: !!memory,
      data: memory || null
    });

  } catch (error) {
    console.error('Error in ANI lookup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/voice/ani
 * Upsert caller memory
 */
export async function POST(request: NextRequest) {
  if (!verifyVoiceKey(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { ani, business_id, data } = body;

    if (!ani || !business_id || !data) {
      return NextResponse.json(
        { error: 'ANI, business_id, and data are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const aniHash = hashAni(ani, business_id);
    
    const { error } = await supabase
      .from('caller_memory')
      .upsert({
        ani_hash: aniHash,
        tenant_id: business_id,
        ...data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'ani_hash,tenant_id'
      });

    if (error) {
      console.error('Error upserting caller memory:', error);
      return NextResponse.json(
        { error: 'Failed to update caller memory' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ani_hash: aniHash
    });

  } catch (error) {
    console.error('Error in ANI upsert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}