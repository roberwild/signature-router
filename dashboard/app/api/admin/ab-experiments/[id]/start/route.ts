import { NextRequest } from 'next/server';
import { requirePermission } from '~/lib/admin/permissions';
import { ABTestingService } from '@workspace/database/src/services/ab-testing.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission('SYSTEM_ADMIN');
    
    await ABTestingService.startExperiment(params.id);
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Start experiment error:', error);
    return Response.json(
      { error: 'Failed to start experiment' },
      { status: 500 }
    );
  }
}
