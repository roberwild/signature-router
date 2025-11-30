import { NextRequest } from 'next/server';
import { requirePermission } from '~/lib/admin/permissions';
import { getAnalyticsData } from '~/data/admin/questionnaires/get-analytics-data';

export async function GET(_: NextRequest) {
  try {
    await requirePermission('SYSTEM_ADMIN');

    const data = await getAnalyticsData();

    return Response.json(data);
  } catch (error) {
    console.error('Analytics API error:', error);
    return Response.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}