import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createClient } from '@supabase/supabase-js';
import { BusinessProfile } from '@/app/models/dashboard';

// Initialize Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/v2/dashboard/business/profile
 * Get full business profile with all settings
 * SECURITY: Bulletproof NextAuth session validation with tenant isolation
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY CRITICAL: Validate NextAuth session first - ZERO BYPASS ALLOWED
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId || !session?.user?.tenantId) {
      console.warn('[Security] Unauthorized access attempt to business profile');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use authenticated business context - bulletproof tenant isolation
    const { tenantId, businessId } = session.user;

    // SECURITY: Fetch business profile from database with authenticated context
    const { data: business, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (error || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Transform database response to BusinessProfile type
    const profile: BusinessProfile = {
      id: business.id,
      name: business.name || '',
      phone: business.phone || '',
      email: business.email || '',
      address: business.address || {},
      timezone: business.timezone || 'America/New_York',
      website: business.website,
      voiceSettings: business.voice_settings || {
        voiceId: 'kdmDKE6EkgrWrrykO9Qt',
        speakingStyle: 'friendly_professional',
        speed: 1.0,
        pitch: 1.0
      },
      conversationRules: business.conversation_rules || {
        allowMultipleServices: true,
        allowCancellations: true,
        allowRescheduling: true,
        noShowBlockEnabled: false,
        noShowThreshold: 3
      },
      smsSettings: business.sms_settings || {
        enabled: true,
        remindersEnabled: true,
        reminderHours: 24,
        notifyOwnerBooking: true,
        notifyOwnerCancellation: true
      },
      createdAt: new Date(business.created_at),
      updatedAt: new Date(business.updated_at)
    };

    return NextResponse.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('Error fetching business profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v2/dashboard/business/profile
 * Update business profile information
 * SECURITY: Bulletproof NextAuth session validation with tenant isolation
 */
export async function PATCH(request: NextRequest) {
  try {
    // SECURITY CRITICAL: Validate NextAuth session first - ZERO BYPASS ALLOWED
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId || !session?.user?.tenantId) {
      console.warn('[Security] Unauthorized access attempt to business profile update');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use authenticated business context - bulletproof tenant isolation
    const { tenantId, businessId } = session.user;

    const updates = await request.json();

    // Validate updates
    const allowedFields = ['name', 'phone', 'email', 'address', 'timezone', 'website'];
    const updateData: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // SECURITY: Update business profile with authenticated context
    const { data, error } = await supabase
      .from('businesses')
      .update(updateData)
      .eq('id', businessId)
      .select()
      .single();

    if (error) {
      console.error('Error updating business profile:', error);
      return NextResponse.json(
        { error: 'Failed to update business profile' },
        { status: 500 }
      );
    }

    // Broadcast update via real-time channel for voice agent with authenticated context
    const channel = supabase.channel(`business:${businessId}`);
    await channel.send({
      type: 'broadcast',
      event: 'profile_updated',
      payload: {
        businessId: businessId,
        updates: updateData,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      data,
      message: 'Business profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating business profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}