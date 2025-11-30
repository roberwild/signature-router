import { NextRequest } from 'next/server';
import { requirePermission } from '~/lib/admin/permissions';
import { getSystemPerformanceData } from '~/data/admin/get-system-performance';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('SYSTEM_ADMIN');

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h';

    const data = await getSystemPerformanceData(timeframe);

    return Response.json(data);
  } catch (error) {
    console.error('Performance monitoring API error:', error);
    return Response.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}