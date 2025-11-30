import { NextRequest } from 'next/server';
import { requirePermission } from '~/lib/admin/permissions';
import { getCategoryAnalyticsData } from '~/data/admin/questionnaires/get-category-analytics';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('SYSTEM_ADMIN');

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d';

    const data = await getCategoryAnalyticsData(timeframe);

    return Response.json(data);
  } catch (error) {
    console.error('Category analytics API error:', error);
    return Response.json(
      { error: 'Failed to fetch category analytics data' },
      { status: 500 }
    );
  }
}