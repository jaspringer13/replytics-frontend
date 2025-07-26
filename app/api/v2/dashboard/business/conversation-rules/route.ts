import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createClient } from '@supabase/supabase-js';
import { ConversationRules } from '@/app/models/dashboard';

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/v2/dashboard/business/conversation-rules
 * Get conversation rules for the voice agent
 * SECURITY: Bulletproof NextAuth session validation with tenant isolation
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY CRITICAL: Validate NextAuth session first - ZERO BYPASS ALLOWED
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId || !session?.user?.tenantId) {
      console.warn('[Security] Unauthorized access attempt to conversation rules');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use authenticated business context - bulletproof tenant isolation
    const { tenantId, businessId } = session.user;

    // SECURITY: Fetch conversation rules from database with authenticated context
    const { data: business, error } = await supabase
      .from('businesses')
      .select('conversation_rules')
      .eq('id', businessId)
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
 * SECURITY: Bulletproof NextAuth session validation with tenant isolation
 */
export async function PATCH(request: NextRequest) {
  try {
    // SECURITY CRITICAL: Validate NextAuth session first - ZERO BYPASS ALLOWED
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId || !session?.user?.tenantId) {
      console.warn('[Security] Unauthorized access attempt to conversation rules update');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use authenticated business context - bulletproof tenant isolation
    const { tenantId, businessId } = session.user;

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

    // SECURITY: Get current rules to merge with updates using authenticated context
    const { data: business, error: fetchError } = await supabase
      .from('businesses')
      .select('conversation_rules')
      .eq('id', businessId)
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

    // SECURITY: Update in database with authenticated context
    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        conversation_rules: newRules,
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId);

    if (updateError) {
      console.error('Error updating conversation rules:', updateError);
      return NextResponse.json(
        { error: 'Failed to update conversation rules' },
        { status: 500 }
      );
    }

    // Broadcast real-time update for voice agent with authenticated context
    const channel = supabase.channel(`conversation-rules:${businessId}`);
    
    // Send immediate notification
    await channel.send({
      type: 'broadcast',
      event: 'conversation_rules_updated',
      payload: {
        businessId: businessId,
        rules: newRules,
        timestamp: new Date().toISOString(),
        requiresReload: true // Signal to voice agent to update behavior
      }
    });

    // Also update via general business channel
    const businessChannel = supabase.channel(`business:${businessId}`);
    await businessChannel.send({
      type: 'broadcast',
      event: 'settings_updated',
      payload: {
        businessId: businessId,
        type: 'conversation_rules',
        rules: newRules,
        timestamp: new Date().toISOString()
      }
    });

    // Log important rule changes for audit with authenticated context
    if (updates.noShowBlockEnabled !== undefined || updates.allowCancellations !== undefined) {
      console.log(`Important conversation rule change for business ${businessId}:`, {
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