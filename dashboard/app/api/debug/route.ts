import { NextResponse } from 'next/server';

export async function GET() {
  // Only show in non-production or remove after debugging
  const debugInfo = {
    env: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV,
    hasDatabase: !!process.env.DATABASE_URL,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasGoogleAuth: !!process.env.AUTH_GOOGLE_CLIENT_ID,
    hasStackAuth: !!process.env.STACK_SECRET_SERVER_KEY,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    // Test database connection
    dbTest: 'pending'
  };

  // Try to connect to database
  try {
    const { db } = await import('@workspace/database');
    const _result = await db.execute('SELECT 1 as test');
    debugInfo.dbTest = 'connected';
  } catch (error) {
    debugInfo.dbTest = error instanceof Error ? error.message : 'failed';
  }

  return NextResponse.json(debugInfo);
}