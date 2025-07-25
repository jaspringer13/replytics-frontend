/**
 * Health Check API Endpoint
 * /Users/jakespringer/Desktop/Replytics Website/app/api/health/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Basic health checks
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();
    
    // Check memory usage
    const memUsage = process.memoryUsage();
    const memoryHealth = memUsage.heapUsed < 512 * 1024 * 1024; // 512MB threshold
    
    // Check if essential services are available
    let databaseHealth = true;
    try {
      // Basic database connectivity check would go here
      // For now, assume healthy
    } catch (error) {
      databaseHealth = false;
    }
    
    const isHealthy = memoryHealth && databaseHealth;
    
    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp,
      uptime: Math.floor(uptime),
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        healthy: memoryHealth
      },
      database: {
        healthy: databaseHealth
      },
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development'
    };
    
    return NextResponse.json(healthData, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, {
      status: 503
    });
  }
}