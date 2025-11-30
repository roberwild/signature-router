import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { requirePermission } from '~/lib/admin/permissions';
import { logAdminAction } from '~/lib/admin/audit-logger';
import { 
  updateBehavioralTrigger,
  deleteBehavioralTrigger,
  updateTriggerQuestions 
} from '~/data/admin/questionnaires/get-behavioral-triggers';
import { z } from 'zod';

const updateTriggerSchema = z.object({
  triggerName: z.string().min(1).optional(),
  triggerType: z.enum(['page_view', 'action', 'time_based', 'score_based']).optional(),
  triggerConditions: z.record(z.any()).optional(),
  delayHours: z.number().min(0).max(720).optional(),
  enabled: z.boolean().optional(),
  questionIds: z.array(z.string()).optional()
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validatedData = updateTriggerSchema.parse(body);

    // Update trigger
    const { questionIds, ...triggerData } = validatedData;
    
    let updated;
    if (Object.keys(triggerData).length > 0) {
      updated = await updateBehavioralTrigger(params.id, triggerData, session.user.id);
    }

    // Update question mappings if provided
    if (questionIds !== undefined) {
      await updateTriggerQuestions(params.id, questionIds);
    }

    // Log the action
    await logAdminAction({
      action: 'trigger.update',
      resource: 'behavioral_trigger',
      resourceId: params.id,
      metadata: {
        changes: validatedData
      }
    });

    return NextResponse.json({ 
      success: true,
      data: updated || { id: params.id, ...triggerData }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Failed to update trigger:', error);
    return NextResponse.json(
      { error: 'Failed to update trigger' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Delete trigger
    await deleteBehavioralTrigger(params.id);

    // Log the action
    await logAdminAction({
      action: 'trigger.delete',
      resource: 'behavioral_trigger',
      resourceId: params.id
    });

    return NextResponse.json({ 
      success: true 
    });
  } catch (error) {
    console.error('Failed to delete trigger:', error);
    return NextResponse.json(
      { error: 'Failed to delete trigger' },
      { status: 500 }
    );
  }
}