import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { ConversationRules } from '@/app/models/dashboard';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    phoneId: string;
  };
}

/**
 * GET /api/v2/dashboard/phone-numbers/[phoneId]/conversation-rules
 * Get conversation rules for a specific phone number
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
        conversation_rules,
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

    const conversationRules: ConversationRules = phoneNumber.conversation_rules || {
      allowMultipleServices: true,
      allowCancellations: true,
      allowRescheduling: true,
      noShowBlockEnabled: false,
      noShowThreshold: 3
    };

    return NextResponse.json(conversationRules);

  } catch (error) {
    console.error('Error fetching conversation rules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v2/dashboard/phone-numbers/[phoneId]/conversation-rules
 * Update conversation rules for a specific phone number
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = getSupabaseServer();
    const { phoneId } = params;
    const updates: Partial<ConversationRules> = await request.json();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate no-show threshold if provided
    if (updates.noShowThreshold !== undefined) {
      if (updates.noShowThreshold < 1 || updates.noShowThreshold > 10) {
        return NextResponse.json(
          { error: 'No-show threshold must be between 1 and 10' },
          { status: 400 }
        );
      }
    }

    // Verify ownership and get current rules
    const { data: phoneNumber, error: fetchError } = await supabase
      .from('phone_numbers')
      .select(`
        id,
        business_id,
        conversation_rules,
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

    const currentRules = phoneNumber.conversation_rules || {
      allowMultipleServices: true,
      allowCancellations: true,
      allowRescheduling: true,
      noShowBlockEnabled: false,
      noShowThreshold: 3
    };

    const newRules: ConversationRules = {
      ...currentRules,
      ...updates
    };

    // Update conversation rules
    const { error: updateError } = await supabase
      .from('phone_numbers')
      .update({
        conversation_rules: newRules,
        updated_at: new Date().toISOString()
      })
      .eq('id', phoneId);

    if (updateError) {
      console.error('Error updating conversation rules:', updateError);
      return NextResponse.json(
        { error: 'Failed to update conversation rules' },
        { status: 500 }
      );
    }

    // CRITICAL: Broadcast phone-specific conversation rules update
    const channel = supabase.channel(`phone-conversation-rules:${phoneId}`);
    await channel.subscribe();
    
    try {
      await channel.send({
        type: 'broadcast',
        event: 'phone_conversation_rules_updated',
        payload: {
          phoneId,
          businessId: phoneNumber.business_id,
          rules: newRules,
          timestamp: new Date().toISOString(),
          requiresReload: true // Signal to voice agent to hot-reload this phone's rules
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
          type: 'conversation_rules',
          settings: newRules,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      await supabase.removeChannel(businessChannel);
    }

    return NextResponse.json({
      success: true,
      data: newRules,
      message: 'Conversation rules updated successfully',
      phoneId,
      realTimeUpdate: 'Voice agent will update rules in real-time for this phone number'
    });

  } catch (error) {
    console.error('Error updating conversation rules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}