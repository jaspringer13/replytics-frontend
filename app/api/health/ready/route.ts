import { NextRequest, NextResponse } from 'next/server';

/**
 * Readiness probe endpoint for Kubernetes
 * Checks if the application is ready to receive traffic
 * This is separate from the health check to provide faster, lighter checks
 */
export async function GET() {
  try {
    // Quick readiness check without heavy operations
    const uptime = process.uptime();
    
    // Application is ready if it's been running for more than 5 seconds
    if (uptime > 5) {
      return NextResponse.json({
        status: 'ready',
        uptime: Math.floor(uptime),
        timestamp: new Date().toISOString()
      }, { status: 200 });
    } else {
      return NextResponse.json({
        status: 'not_ready',
        uptime: Math.floor(uptime),
        timestamp: new Date().toISOString(),
        reason: 'Application still starting up'
      }, { status: 503 });
    }
  } catch (error) {
    console.error('Readiness check failed:', error);
    return NextResponse.json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed'
    }, { status: 503 });
  }
}

/**
 * HEAD request for lightweight readiness checks
 */
export async function HEAD() {
  try {
    const uptime = process.uptime();
    
    if (uptime > 5) {
      return new NextResponse(null, { status: 200 });
    } else {
      return new NextResponse(null, { status: 503 });
    }
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}