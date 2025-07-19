import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DashboardOverview, DateRange, TrendData, ServicePerformance, SegmentDistribution } from '@/app/models/dashboard';

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required Supabase environment variables');
}

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
    
    // Validate dates
    if (isNaN(dateRange.start.getTime()) || isNaN(dateRange.end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    if (dateRange.start > dateRange.end) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Calculate previous period for comparison
    const periodLength = dateRange.end.getTime() - dateRange.start.getTime();
    const previousDateRange: DateRange = {
      start: new Date(dateRange.start.getTime() - periodLength),
      end: new Date(dateRange.start.getTime() - 1)
    };

    // Fetch all necessary data in parallel with resilient error handling
    const results = await Promise.allSettled([
      fetchMetrics(tenantId, dateRange),
      fetchMetrics(tenantId, previousDateRange),
      fetchServicePerformance(tenantId, dateRange),
      fetchCustomerSegments(tenantId),
      fetchRevenueTrend(tenantId, dateRange),
      fetchAppointmentTrend(tenantId, dateRange),
      fetchNewCustomerTrend(tenantId, dateRange)
    ]);
    
    // Extract successful results with fallbacks
    const currentMetrics = results[0].status === 'fulfilled' ? results[0].value : getDefaultMetrics();
    const previousMetrics = results[1].status === 'fulfilled' ? results[1].value : getDefaultMetrics();
    const servicePerformance = results[2].status === 'fulfilled' ? results[2].value : [];
    const customerSegments = results[3].status === 'fulfilled' ? results[3].value : { vip: 0, regular: 0, atRisk: 0, new: 0, dormant: 0 };
    const revenueTrend = results[4].status === 'fulfilled' ? results[4].value : [];
    const appointmentTrend = results[5].status === 'fulfilled' ? results[5].value : [];
    const newCustomerTrend = results[6].status === 'fulfilled' ? results[6].value : [];
    
    // Log any failures for monitoring
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const functionNames = ['currentMetrics', 'previousMetrics', 'servicePerformance', 'customerSegments', 'revenueTrend', 'appointmentTrend', 'newCustomerTrend'];
        console.error(`Failed to fetch ${functionNames[index]}:`, result.reason);
      }
    });

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

function getDefaultMetrics() {
  return {
    totalRevenue: 0,
    totalAppointments: 0,
    totalCustomers: 0,
    averageServiceValue: 0,
    bookingRate: 0,
    noShowRate: 0
  };
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
  // Define the expected type for the query result
  type AppointmentWithService = {
    service_id: string;
    price: number;
    services: {
      id: string;
      name: string;
      duration: number;
    } | {
      id: string;
      name: string;
      duration: number;
    }[];
  };

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
    .eq('status', 'completed') as { data: AppointmentWithService[] | null; error: any };

  if (error) {
    console.error('Error fetching service performance:', error);
    return [];
  }

  // Aggregate by service
  const serviceMap = new Map<string, ServicePerformance>();
  
  serviceData?.forEach((apt: AppointmentWithService) => {
    const serviceId = apt.service_id;
    // Handle services as array (Supabase join returns array even with !inner)
    const serviceName = Array.isArray(apt.services) ? apt.services[0]?.name : apt.services?.name;
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
  // Since caller_memory table may not exist, implement segmentation using appointments table
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('customer_id, price, status, created_at, appointment_time')
    .eq('business_id', tenantId);

  if (error) {
    console.error('Error fetching customer data for segmentation:', error);
    return {
      vip: 0,
      regular: 0,
      atRisk: 0,
      new: 0,
      dormant: 0
    };
  }

  // Aggregate customer data
  const customerData = new Map<string, {
    totalAppointments: number;
    lifetimeValue: number;
    firstAppointment: Date;
    lastAppointment: Date;
  }>();

  appointments?.forEach(apt => {
    const customerId = apt.customer_id;
    const existing = customerData.get(customerId) || {
      totalAppointments: 0,
      lifetimeValue: 0,
      firstAppointment: new Date(apt.created_at),
      lastAppointment: new Date(apt.appointment_time)
    };

    existing.totalAppointments++;
    if (apt.status === 'completed' && apt.price) {
      existing.lifetimeValue += apt.price;
    }

    const appointmentDate = new Date(apt.appointment_time);
    if (appointmentDate < existing.firstAppointment) {
      existing.firstAppointment = appointmentDate;
    }
    if (appointmentDate > existing.lastAppointment) {
      existing.lastAppointment = appointmentDate;
    }

    customerData.set(customerId, existing);
  });

  // Segment customers based on business logic
  const segmentCounts: SegmentDistribution = {
    vip: 0,
    regular: 0,
    atRisk: 0,
    new: 0,
    dormant: 0
  };

  const now = new Date();
  customerData.forEach((data, customerId) => {
    const daysSinceFirst = Math.floor((now.getTime() - data.firstAppointment.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceLast = Math.floor((now.getTime() - data.lastAppointment.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceFirst < 90) {
      segmentCounts.new++;
    } else if (daysSinceLast > 60) {
      segmentCounts.dormant++;
    } else if (data.lifetimeValue > 2000 && data.totalAppointments > 10) {
      segmentCounts.vip++;
    } else if (daysSinceLast > 45 && data.totalAppointments > 3) {
      segmentCounts.atRisk++;
    } else {
      segmentCounts.regular++;
    }
  });

  return segmentCounts;
}

async function fetchRevenueTrend(tenantId: string, dateRange: DateRange): Promise<{ date: string; value: number }[]> {
  // Fetch all revenue data in one query
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('price, appointment_time')
    .eq('business_id', tenantId)
    .gte('appointment_time', dateRange.start.toISOString())
    .lte('appointment_time', dateRange.end.toISOString())
    .eq('status', 'completed');

  if (error) {
    console.error('Error fetching revenue trend:', error);
    return [];
  }

  // Aggregate by day
  const revenueByDay = new Map<string, number>();
  
  appointments?.forEach(apt => {
    const date = new Date(apt.appointment_time).toISOString().split('T')[0];
    const currentRevenue = revenueByDay.get(date) || 0;
    revenueByDay.set(date, currentRevenue + (apt.price || 0));
  });

  // Generate complete date range with zeros for missing days
  const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
  const dataPoints: { date: string; value: number }[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(dateRange.start);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    dataPoints.push({
      date: dateStr,
      value: revenueByDay.get(dateStr) || 0
    });
  }

  return dataPoints;
}

async function fetchAppointmentTrend(tenantId: string, dateRange: DateRange): Promise<{ date: string; value: number }[]> {
  // Fetch all appointments in the date range
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('appointment_time')
    .eq('business_id', tenantId)
    .gte('appointment_time', dateRange.start.toISOString())
    .lte('appointment_time', dateRange.end.toISOString())
    .neq('status', 'cancelled');

  if (error) {
    console.error('Error fetching appointment trend:', error);
    return [];
  }

  // Aggregate appointments by day
  const appointmentsByDay = new Map<string, number>();
  
  appointments?.forEach(apt => {
    const date = new Date(apt.appointment_time).toISOString().split('T')[0];
    const currentCount = appointmentsByDay.get(date) || 0;
    appointmentsByDay.set(date, currentCount + 1);
  });

  // Generate complete date range with zeros for missing days
  const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
  const dataPoints: { date: string; value: number }[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(dateRange.start);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    dataPoints.push({
      date: dateStr,
      value: appointmentsByDay.get(dateStr) || 0
    });
  }

  return dataPoints;
}

async function fetchNewCustomerTrend(tenantId: string, dateRange: DateRange): Promise<{ date: string; value: number }[]> {
  // Find first appointment for each customer to identify new customers
  const { data: customerFirstAppointments, error } = await supabase
    .from('appointments')
    .select('customer_id, appointment_time')
    .eq('business_id', tenantId)
    .order('appointment_time', { ascending: true });

  if (error) {
    console.error('Error fetching customer first appointments:', error);
    return [];
  }

  // Get first appointment date for each customer
  const firstAppointmentMap = new Map<string, Date>();
  customerFirstAppointments?.forEach(apt => {
    if (!firstAppointmentMap.has(apt.customer_id)) {
      firstAppointmentMap.set(apt.customer_id, new Date(apt.appointment_time));
    }
  });

  // Count new customers by day within the date range
  const newCustomersByDay = new Map<string, number>();
  
  firstAppointmentMap.forEach((firstDate, customerId) => {
    if (firstDate >= dateRange.start && firstDate <= dateRange.end) {
      const dateStr = firstDate.toISOString().split('T')[0];
      const currentCount = newCustomersByDay.get(dateStr) || 0;
      newCustomersByDay.set(dateStr, currentCount + 1);
    }
  });

  // Generate complete date range with zeros for missing days
  const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
  const dataPoints: { date: string; value: number }[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(dateRange.start);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    dataPoints.push({
      date: dateStr,
      value: newCustomersByDay.get(dateStr) || 0
    });
  }

  return dataPoints;
}