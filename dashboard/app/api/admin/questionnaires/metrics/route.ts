import { NextResponse } from 'next/server';
import { getDashboardMetrics } from '~/data/admin/questionnaires/get-dashboard-metrics';
import { requirePermission } from '~/lib/admin/permissions';
import { logAdminAction } from '~/lib/admin/audit-logger';

export async function GET() {
  try {
    // Check permission
    await requirePermission('questionnaire.read');

    // Log the action
    await logAdminAction({
      action: 'questionnaire.view',
      resource: 'dashboard',
      metadata: { view: 'metrics' }
    });

    // Get metrics
    const metrics = await getDashboardMetrics();

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Failed to fetch dashboard metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}