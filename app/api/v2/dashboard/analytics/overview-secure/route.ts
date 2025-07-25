import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: "Route temporarily disabled for build fix",
    status: "maintenance" 
  }, { status: 503 });
}