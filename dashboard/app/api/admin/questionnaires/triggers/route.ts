import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { requirePermission } from '~/lib/admin/permissions';
import { logAdminAction } from '~/lib/admin/audit-logger';
import { 
  createBehavioralTrigger,
  updateTriggerQuestions 
} from '~/data/admin/questionnaires/get-behavioral-triggers';
import { z } from 'zod';

const createTriggerSchema = z.object({
  triggerName: z.string().min(1),
  triggerType: z.enum(['page_view', 'action', 'time_based', 'score_based']),
  triggerConditions: z.record(z.any()),
  delayHours: z.number().min(0).max(720),
  enabled: z.boolean(),
  questionIds: z.array(z.string())
});

export async function POST(request: NextRequest) {
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
    const validatedData = createTriggerSchema.parse(body);

    // Create trigger
    const created = await createBehavioralTrigger(
      {
        triggerName: validatedData.triggerName,
        triggerType: validatedData.triggerType,
        triggerConditions: validatedData.triggerConditions,
        delayHours: validatedData.delayHours,
        enabled: validatedData.enabled
      },
      session.user.id
    );

    // Update question mappings
    await updateTriggerQuestions(created.id, validatedData.questionIds);

    // Log the action
    await logAdminAction({
      action: 'trigger.create',
      resource: 'behavioral_trigger',
      resourceId: created.id,
      metadata: {
        triggerName: validatedData.triggerName,
        triggerType: validatedData.triggerType,
        questionCount: validatedData.questionIds.length
      }
    });

    // Return the created trigger with questions
    const response = {
      ...created,
      questionIds: validatedData.questionIds,
      questions: validatedData.questionIds.map((id, index) => ({
        questionId: id,
        questionText: id, // Would normally fetch from DB
        orderIndex: index
      }))
    };

    return NextResponse.json({ 
      success: true,
      data: response
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Failed to create trigger:', error);
    return NextResponse.json(
      { error: 'Failed to create trigger' },
      { status: 500 }
    );
  }
}