import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { requirePermission } from '~/lib/admin/permissions';
import { logAdminAction } from '~/lib/admin/audit-logger';
import { updateTimingStrategy } from '~/data/admin/questionnaires/get-timing-strategies';
import { z } from 'zod';

const updateTimingSchema = z.object({
  category: z.enum(['A1', 'B1', 'C1', 'D1']),
  initialWaitDays: z.number().min(0).max(365),
  cooldownHours: z.number().min(0).max(720),
  maxSessionsPerWeek: z.number().min(1).max(7),
  enabled: z.boolean().optional()
});

export async function PUT(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('questionnaire.write');
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateTimingSchema.parse(body);

    // Update timing strategy
    const updated = await updateTimingStrategy(
      validatedData.category,
      {
        initialWaitDays: validatedData.initialWaitDays,
        cooldownHours: validatedData.cooldownHours,
        maxSessionsPerWeek: validatedData.maxSessionsPerWeek,
        enabled: validatedData.enabled
      },
      session.user.id
    );

    // Log the action
    await logAdminAction({
      action: 'timing.update',
      resource: 'timing_strategy',
      resourceId: validatedData.category,
      metadata: {
        changes: validatedData
      }
    });

    return NextResponse.json({ 
      success: true,
      data: updated
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Failed to update timing strategy:', error);
    return NextResponse.json(
      { error: 'Failed to update timing strategy' },
      { status: 500 }
    );
  }
}