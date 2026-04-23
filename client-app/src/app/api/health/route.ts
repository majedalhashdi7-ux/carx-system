import { NextResponse } from 'next/server';

/**
 * Health Check API Endpoint
 * GET /api/health
 * 
 * Returns the health status of the HM CAR application
 */
export async function GET() {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'HM CAR Client',
      version: process.env.SYSTEM_VERSION || '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks: {
        database: 'not_checked', // Client doesn't directly connect to DB
        api: 'not_checked',
      },
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
