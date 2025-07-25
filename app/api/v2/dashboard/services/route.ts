import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createClient } from '@supabase/supabase-js';
import { Service, ServiceCreate } from '@/app/models/dashboard';

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/v2/dashboard/services
 * List all services for the business
 * SECURITY: Bulletproof NextAuth session validation with tenant isolation
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY CRITICAL: Validate NextAuth session first - ZERO BYPASS ALLOWED
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId || !session?.user?.tenantId) {
      console.warn('[Security] Unauthorized access attempt to services list');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use authenticated business context - bulletproof tenant isolation
    const { tenantId, businessId } = session.user;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // SECURITY: All data queries use authenticated tenant/business context for bulletproof isolation
    let query = supabase
      .from('services')
      .select('*')
      .eq('business_id', businessId)
      .order('display_order', { ascending: true });

    // Filter out inactive services unless requested
    if (!includeInactive) {
      query = query.eq('active', true);
    }

    const { data: services, error } = await query;

    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 }
      );
    }

    // Transform to Service type
    const transformedServices: Service[] = (services || []).map(service => ({
      id: service.id,
      businessId: service.business_id,
      name: service.name,
      duration: service.duration,
      price: service.price,
      description: service.description,
      isActive: service.active,
      displayOrder: service.display_order,
      createdAt: new Date(service.created_at),
      updatedAt: new Date(service.updated_at)
    }));

    return NextResponse.json({
      success: true,
      data: transformedServices,
      total: transformedServices.length
    });

  } catch (error) {
    console.error('Error in GET services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/dashboard/services
 * Create a new service
 * SECURITY: Bulletproof NextAuth session validation with tenant isolation
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY CRITICAL: Validate NextAuth session first - ZERO BYPASS ALLOWED
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId || !session?.user?.tenantId) {
      console.warn('[Security] Unauthorized access attempt to service creation');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use authenticated business context - bulletproof tenant isolation
    const { tenantId, businessId } = session.user;

    const serviceData: ServiceCreate = await request.json();

    // Validate required fields
    if (!serviceData.name || !serviceData.duration || serviceData.price === undefined) {
      return NextResponse.json(
        { error: 'Name, duration, and price are required' },
        { status: 400 }
      );
    }

    // Validate duration
    if (serviceData.duration < 15 || serviceData.duration > 480) {
      return NextResponse.json(
        { error: 'Duration must be between 15 and 480 minutes' },
        { status: 400 }
      );
    }

    // Validate price
    if (serviceData.price < 0) {
      return NextResponse.json(
        { error: 'Price cannot be negative' },
        { status: 400 }
      );
    }

    // SECURITY: Tenant-scoped query for max display order
    const { data: existingServices } = await supabase
      .from('services')
      .select('display_order')
      .eq('business_id', businessId)
      .order('display_order', { ascending: false })
      .limit(1);

    const maxOrder = existingServices?.[0]?.display_order || 0;

    // SECURITY: Create service with authenticated business context
    const { data: newService, error } = await supabase
      .from('services')
      .insert({
        business_id: businessId,
        name: serviceData.name,
        duration: serviceData.duration,
        price: serviceData.price,
        description: serviceData.description,
        active: serviceData.isActive !== false, // Default to true
        display_order: maxOrder + 1
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating service:', error);
      return NextResponse.json(
        { error: 'Failed to create service' },
        { status: 500 }
      );
    }

    // Broadcast update for real-time sync with authenticated context
    const channel = supabase.channel(`services:${businessId}`);
    await channel.send({
      type: 'broadcast',
      event: 'service_created',
      payload: {
        businessId: businessId,
        service: newService,
        timestamp: new Date().toISOString()
      }
    });

    // Transform response
    const service: Service = {
      id: newService.id,
      businessId: newService.business_id,
      name: newService.name,
      duration: newService.duration,
      price: newService.price,
      description: newService.description,
      isActive: newService.active,
      displayOrder: newService.display_order,
      createdAt: new Date(newService.created_at),
      updatedAt: new Date(newService.updated_at)
    };

    return NextResponse.json({
      success: true,
      data: service,
      message: 'Service created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}