import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Basic health check
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    };

    // Optional: Add database connection check
    // Uncomment if you want to verify DB connectivity
    /*
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthStatus.database = 'connected';
    } catch (error) {
      healthStatus.database = 'disconnected';
      healthStatus.status = 'degraded';
    }
    */

    return NextResponse.json(healthStatus, { 
      status: healthStatus.status === 'healthy' ? 200 : 503 
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 503 }
    );
  }
}