import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { Service, ServiceCreate } from '@/app/models/dashboard';

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required Supabase environment variables');
}

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
/**
 * GET /api/v2/dashboard/services
 * List all services for the business
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

    // Validate tenantId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      return NextResponse.json(
        { error: 'Invalid tenant ID format' },
        { status: 400 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Build query
    let query = getSupabaseServer()
      .from('services')
      .select('*')
      .eq('business_id', tenantId)
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
      active: service.active,
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

    // Validate tenantId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      return NextResponse.json(
        { error: 'Invalid tenant ID format' },
        { status: 400 }
      );
    }

    const serviceData: ServiceCreate = await request.json();

    // Validate required fields
    if (!serviceData.name || !serviceData.duration || serviceData.price === undefined) {
      return NextResponse.json(
        { error: 'Name, duration, and price are required' },
        { status: 400 }
      );
    }

    // Validate data types
    if (typeof serviceData.name !== 'string' || 
        typeof serviceData.duration !== 'number' || 
        typeof serviceData.price !== 'number') {
      return NextResponse.json(
        { error: 'Invalid data types' },
        { status: 400 }
      );
    }

    // Validate string length
    if (serviceData.name.length > 255) {
      return NextResponse.json(
        { error: 'Service name too long (max 255 characters)' },
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

    // Get current max display order
    const { data: existingServices } = await getSupabaseServer()
      .from('services')
      .select('display_order')
      .eq('business_id', tenantId)
      .order('display_order', { ascending: false })
      .limit(1);

    const maxOrder = existingServices?.[0]?.display_order || 0;

    // Create service
    const { data: newService, error } = await getSupabaseServer()
      .from('services')
      .insert({
        business_id: tenantId,
        name: serviceData.name,
        duration: serviceData.duration,
        price: serviceData.price,
        description: serviceData.description,
        active: serviceData.active !== false, // Default to true
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

    // Broadcast update for real-time sync
    const channel = getSupabaseServer().channel(`services:${tenantId}`);
    // Send broadcast without destructuring - channel.send doesn't return error property
    await channel.send({
      type: 'broadcast',
      event: 'service_created',
      payload: {
        businessId: tenantId,
        service: newService,
        timestamp: new Date().toISOString()
      }
    });
    
    // Clean up the channel
    await getSupabaseServer().removeChannel(channel);

    // Transform response
    const service: Service = {
      id: newService.id,
      businessId: newService.business_id,
      name: newService.name,
      duration: newService.duration,
      price: newService.price,
      description: newService.description,
      active: newService.active,
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