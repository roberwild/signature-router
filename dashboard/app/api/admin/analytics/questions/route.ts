import { NextRequest } from 'next/server';
import { requirePermission } from '~/lib/admin/permissions';
import { getQuestionAnalyticsData } from '~/data/admin/questionnaires/get-question-analytics';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('SYSTEM_ADMIN');

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d';

    const data = await getQuestionAnalyticsData(timeframe);

    return Response.json(data);
  } catch (error) {
    console.error('Question analytics API error:', error);
    return Response.json(
      { error: 'Failed to fetch question analytics data' },
      { status: 500 }
    );
  }
}