import { NextRequest, NextResponse } from 'next/server';
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Build query
    let query = supabase
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

    // Get current max display order
    const { data: existingServices } = await supabase
      .from('services')
      .select('display_order')
      .eq('business_id', tenantId)
      .order('display_order', { ascending: false })
      .limit(1);

    const maxOrder = existingServices?.[0]?.display_order || 0;

    // Create service
    const { data: newService, error } = await supabase
      .from('services')
      .insert({
        business_id: tenantId,
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

    // Broadcast update for real-time sync
    const channel = supabase.channel(`services:${tenantId}`);
    await channel.send({
      type: 'broadcast',
      event: 'service_created',
      payload: {
        businessId: tenantId,
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