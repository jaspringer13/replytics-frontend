/**
 * Enhanced Health Check API Endpoint
 * 
 * Provides comprehensive system health information for monitoring and alerting
 * This is an enhanced version that works alongside the existing basic health check
 */

import { NextRequest, NextResponse } from 'next/server';
import { healthChecker, initializeHealthChecker } from '@/lib/monitoring/health-checker';
import { getSupabaseServer } from '@/lib/supabase-server';

// Initialize health checker with Supabase client
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    const supabase = getSupabaseServer();
    initializeHealthChecker(supabase);
    initialized = true;
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    await ensureInitialized();
    
    // Run comprehensive health checks
    const healthReport = await healthChecker.runAllChecks();
    
    // Determine HTTP status code based on overall health
    const statusCode = healthReport.overall === 'healthy' ? 200 : 
                      healthReport.overall === 'degraded' ? 200 : 503;

    // Add execution time and system info
    const executionTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: healthReport.overall,
      timestamp: healthReport.timestamp,
      executionTimeMs: executionTime,
      checks: healthReport.checks,
      system: {
        version: process.env.npm_package_version || '0.1.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.floor(process.uptime()),
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      metadata: {
        endpoint: '/api/health/enhanced',
        userAgent: request.headers.get('user-agent') || 'unknown',
        method: request.method
      }
    }, {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Health-Status': healthReport.overall,
        'X-Health-Execution-Time': executionTime.toString(),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    });
    
  } catch (error) {
    console.error('Enhanced health check system failure:', error);
    
    const executionTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      executionTimeMs: executionTime,
      error: 'Enhanced health check system failure',
      details: error instanceof Error ? error.message : String(error),
      system: {
        version: process.env.npm_package_version || '0.1.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.floor(process.uptime()),
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Health-Status': 'unhealthy',
        'X-Health-Execution-Time': executionTime.toString()
      }
    });
  }
}

// Support for HEAD requests (common for health checks)
export async function HEAD(request: NextRequest) {
  try {
    await ensureInitialized();
    const healthReport = await healthChecker.runAllChecks();
    const statusCode = healthReport.overall === 'healthy' ? 200 : 
                      healthReport.overall === 'degraded' ? 200 : 503;
    
    return new NextResponse(null, {
      status: statusCode,
      headers: {
        'X-Health-Status': healthReport.overall,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 500,
      headers: {
        'X-Health-Status': 'unhealthy',
        'Cache-Control': 'no-cache'
      }
    });
  }
}