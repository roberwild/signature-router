import { NextRequest } from 'next/server';
import { requirePermission } from '~/lib/admin/permissions';
import { ABTestingService } from '@workspace/database/src/services/ab-testing.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission('SYSTEM_ADMIN');
    
    await ABTestingService.stopExperiment(params.id);
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Stop experiment error:', error);
    return Response.json(
      { error: 'Failed to stop experiment' },
      { status: 500 }
    );
  }
}
