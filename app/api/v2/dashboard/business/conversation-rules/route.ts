import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { ConversationRules } from '@/app/models/dashboard';


/**
 * GET /api/v2/dashboard/business/conversation-rules
 * Get conversation rules for the voice agent
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

    // Fetch conversation rules from database
    const { data: business, error } = await getSupabaseServer()
      .from('businesses')
      .select('conversation_rules')
      .eq('id', tenantId)
      .single();

    if (error || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Return conversation rules with defaults if not set
    const conversationRules: ConversationRules = business.conversation_rules || {
      allowMultipleServices: true,
      allowCancellations: true,
      allowRescheduling: true,
      noShowBlockEnabled: false,
      noShowThreshold: 3
    };

    return NextResponse.json({
      success: true,
      data: conversationRules
    });

  } catch (error) {
    console.error('Error fetching conversation rules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v2/dashboard/business/conversation-rules
 * Update conversation rules - affects voice agent behavior
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

    const updates: Partial<ConversationRules> = await request.json();

    // Validate conversation rules
    if (updates.noShowThreshold !== undefined) {
      if (typeof updates.noShowThreshold !== 'number' || updates.noShowThreshold < 1 || updates.noShowThreshold > 10) {
        return NextResponse.json(
          { error: 'No-show threshold must be between 1 and 10' },
          { status: 400 }
        );
      }
    }

    // Boolean validations
    const booleanFields = ['allowMultipleServices', 'allowCancellations', 'allowRescheduling', 'noShowBlockEnabled'];
    for (const field of booleanFields) {
      if (updates[field as keyof ConversationRules] !== undefined && 
          typeof updates[field as keyof ConversationRules] !== 'boolean') {
        return NextResponse.json(
          { error: `${field} must be a boolean value` },
          { status: 400 }
        );
      }
    }

    // Get current rules to merge with updates
    const { data: business, error: fetchError } = await getSupabaseServer()
      .from('businesses')
      .select('conversation_rules')
      .eq('id', tenantId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch current rules' },
        { status: 500 }
      );
    }

    const currentRules = business?.conversation_rules || {
      allowMultipleServices: true,
      allowCancellations: true,
      allowRescheduling: true,
      noShowBlockEnabled: false,
      noShowThreshold: 3
    };

    // Merge updates with current rules
    const newRules: ConversationRules = {
      ...currentRules,
      ...updates
    };

    // Update in database
    const { error: updateError } = await getSupabaseServer()
      .from('businesses')
      .update({
        conversation_rules: newRules,
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantId);

    if (updateError) {
      console.error('Error updating conversation rules:', updateError);
      return NextResponse.json(
        { error: 'Failed to update conversation rules' },
        { status: 500 }
      );
    }

    // Broadcast real-time update for voice agent
    const channel = getSupabaseServer().channel(`conversation-rules:${tenantId}`);
    
    // Send immediate notification
    await channel.send({
      type: 'broadcast',
      event: 'conversation_rules_updated',
      payload: {
        businessId: tenantId,
        rules: newRules,
        timestamp: new Date().toISOString(),
        requiresReload: true // Signal to voice agent to update behavior
      }
    });
    
    // Also update via general business channel
    const businessChannel = getSupabaseServer().channel(`business:${tenantId}`);
    await businessChannel.send({
      type: 'broadcast',
      event: 'settings_updated',
      payload: {
        businessId: tenantId,
        type: 'conversation_rules',
        rules: newRules,
        timestamp: new Date().toISOString()
      }
    });
    
    // Clean up channels
    await channel.unsubscribe();
    await businessChannel.unsubscribe();
    await getSupabaseServer().removeChannel(channel);
    await getSupabaseServer().removeChannel(businessChannel);

    // Log important rule changes for audit
    if (updates.noShowBlockEnabled !== undefined || updates.allowCancellations !== undefined) {
      console.log(`Important conversation rule change for business ${tenantId}:`, {
        changes: updates,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      data: newRules,
      message: 'Conversation rules updated successfully',
      realTimeUpdate: 'Voice agent will update behavior in real-time'
    });

  } catch (error) {
    console.error('Error updating conversation rules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}