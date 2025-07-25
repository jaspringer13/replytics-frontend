import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DashboardOverview, DateRange, TrendData, ServicePerformance, SegmentDistribution } from '@/app/models/dashboard';

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/v2/dashboard/analytics/overview
 * Get comprehensive dashboard overview with metrics and trends
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

    // Parse date range from query params
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || getDefaultStartDate();
    const endDate = searchParams.get('endDate') || getDefaultEndDate();

    const dateRange: DateRange = {
      start: new Date(startDate),
      end: new Date(endDate)
    };

    // Calculate previous period for comparison
    const periodLength = dateRange.end.getTime() - dateRange.start.getTime();
    const previousDateRange: DateRange = {
      start: new Date(dateRange.start.getTime() - periodLength),
      end: new Date(dateRange.start.getTime() - 1)
    };

    // Fetch all necessary data in parallel
    const [
      currentMetrics,
      previousMetrics,
      servicePerformance,
      customerSegments,
      revenueTrend,
      appointmentTrend,
      newCustomerTrend
    ] = await Promise.all([
      fetchMetrics(tenantId, dateRange),
      fetchMetrics(tenantId, previousDateRange),
      fetchServicePerformance(tenantId, dateRange),
      fetchCustomerSegments(tenantId),
      fetchRevenueTrend(tenantId, dateRange),
      fetchAppointmentTrend(tenantId, dateRange),
      fetchNewCustomerTrend(tenantId, dateRange)
    ]);

    // Calculate percent changes
    const revenueChange = calculatePercentChange(previousMetrics.totalRevenue, currentMetrics.totalRevenue);
    const appointmentChange = calculatePercentChange(previousMetrics.totalAppointments, currentMetrics.totalAppointments);
    const customerChange = calculatePercentChange(previousMetrics.totalCustomers, currentMetrics.totalCustomers);

    // Build response
    const overview: DashboardOverview = {
      dateRange,
      metrics: currentMetrics,
      trends: {
        revenue: {
          current: currentMetrics.totalRevenue,
          previous: previousMetrics.totalRevenue,
          percentChange: revenueChange,
          dataPoints: revenueTrend
        },
        appointments: {
          current: currentMetrics.totalAppointments,
          previous: previousMetrics.totalAppointments,
          percentChange: appointmentChange,
          dataPoints: appointmentTrend
        },
        newCustomers: {
          current: currentMetrics.totalCustomers - previousMetrics.totalCustomers,
          previous: previousMetrics.totalCustomers,
          percentChange: customerChange,
          dataPoints: newCustomerTrend
        }
      },
      topServices: servicePerformance,
      customerSegments
    };

    return NextResponse.json({
      success: true,
      data: overview
    });

  } catch (error) {
    console.error('Error in analytics overview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions

function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30); // Last 30 days
  return date.toISOString().split('T')[0];
}

function getDefaultEndDate(): string {
  return new Date().toISOString().split('T')[0];
}

function calculatePercentChange(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

async function fetchMetrics(tenantId: string, dateRange: DateRange) {
  // Fetch appointments and calculate revenue
  const { data: appointments, error: appointmentError } = await supabase
    .from('appointments')
    .select('id, service_id, price, status')
    .eq('business_id', tenantId)
    .gte('appointment_time', dateRange.start.toISOString())
    .lte('appointment_time', dateRange.end.toISOString())
    .neq('status', 'cancelled');

  if (appointmentError) {
    console.error('Error fetching appointments:', appointmentError);
    throw appointmentError;
  }

  // Calculate metrics
  const totalRevenue = appointments?.reduce((sum, apt) => sum + (apt.price || 0), 0) || 0;
  const totalAppointments = appointments?.length || 0;
  const completedAppointments = appointments?.filter(apt => apt.status === 'completed').length || 0;
  const noShowAppointments = appointments?.filter(apt => apt.status === 'no_show').length || 0;

  // Fetch unique customers
  const { data: customers, error: customerError } = await supabase
    .from('appointments')
    .select('customer_id')
    .eq('business_id', tenantId)
    .gte('appointment_time', dateRange.start.toISOString())
    .lte('appointment_time', dateRange.end.toISOString())
    .neq('status', 'cancelled');

  if (customerError) {
    console.error('Error fetching customers:', customerError);
    throw customerError;
  }

  const uniqueCustomers = new Set(customers?.map(c => c.customer_id) || []);

  return {
    totalRevenue,
    totalAppointments,
    totalCustomers: uniqueCustomers.size,
    averageServiceValue: totalAppointments > 0 ? totalRevenue / totalAppointments : 0,
    bookingRate: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0,
    noShowRate: totalAppointments > 0 ? (noShowAppointments / totalAppointments) * 100 : 0
  };
}

async function fetchServicePerformance(tenantId: string, dateRange: DateRange): Promise<ServicePerformance[]> {
  // Fetch service data with appointments
  const { data: serviceData, error } = await supabase
    .from('appointments')
    .select(`
      service_id,
      price,
      services!inner (
        id,
        name,
        duration
      )
    `)
    .eq('business_id', tenantId)
    .gte('appointment_time', dateRange.start.toISOString())
    .lte('appointment_time', dateRange.end.toISOString())
    .eq('status', 'completed');

  if (error) {
    console.error('Error fetching service performance:', error);
    return [];
  }

  // Aggregate by service
  const serviceMap = new Map<string, ServicePerformance>();
  
  serviceData?.forEach(apt => {
    const serviceId = apt.service_id;
    // Handle services as array (Supabase join returns array even with !inner)
    const serviceName = Array.isArray(apt.services) ? apt.services[0]?.name : (apt.services as any)?.name;
    const existing = serviceMap.get(serviceId) || {
      serviceId,
      serviceName: serviceName || 'Unknown Service',
      revenue: 0,
      appointmentCount: 0,
      averagePrice: 0,
      utilization: 0
    };

    existing.revenue += apt.price || 0;
    existing.appointmentCount += 1;
    
    serviceMap.set(serviceId, existing);
  });

  // Calculate averages and sort by revenue
  const services = Array.from(serviceMap.values())
    .map(service => ({
      ...service,
      averagePrice: service.appointmentCount > 0 ? service.revenue / service.appointmentCount : 0
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5); // Top 5 services

  return services;
}

async function fetchCustomerSegments(tenantId: string): Promise<SegmentDistribution> {
  // For now, return mock data - this would be calculated based on customer behavior
  // In production, this would analyze visit frequency, spending, and recency
  return {
    vip: 24,
    regular: 156,
    atRisk: 18,
    new: 32,
    dormant: 45
  };
}

async function fetchRevenueTrend(tenantId: string, dateRange: DateRange): Promise<{ date: string; value: number }[]> {
  // Generate daily revenue data points
  const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
  const dataPoints: { date: string; value: number }[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(dateRange.start);
    date.setDate(date.getDate() + i);
    
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: dayRevenue } = await supabase
      .from('appointments')
      .select('price')
      .eq('business_id', tenantId)
      .gte('appointment_time', dayStart.toISOString())
      .lte('appointment_time', dayEnd.toISOString())
      .eq('status', 'completed');

    const revenue = dayRevenue?.reduce((sum, apt) => sum + (apt.price || 0), 0) || 0;
    
    dataPoints.push({
      date: date.toISOString().split('T')[0],
      value: revenue
    });
  }

  return dataPoints;
}

async function fetchAppointmentTrend(tenantId: string, dateRange: DateRange): Promise<{ date: string; value: number }[]> {
  // For brevity, returning simplified data
  // In production, this would fetch actual daily appointment counts
  const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(dateRange.start);
    date.setDate(date.getDate() + i);
    return {
      date: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 15) + 5 // Mock data
    };
  });
}

async function fetchNewCustomerTrend(tenantId: string, dateRange: DateRange): Promise<{ date: string; value: number }[]> {
  // For brevity, returning simplified data
  // In production, this would track first-time customers per day
  const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(dateRange.start);
    date.setDate(date.getDate() + i);
    return {
      date: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 5) // Mock data
    };
  });
}