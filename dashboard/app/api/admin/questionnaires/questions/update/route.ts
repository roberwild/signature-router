import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { requirePermission } from '~/lib/admin/permissions';
import { logAdminAction } from '~/lib/admin/audit-logger';
import { updateQuestionConfig } from '~/data/admin/questionnaires/get-question-configs';
import { z } from 'zod';

const updateSchema = z.object({
  updates: z.array(z.object({
    questionId: z.string(),
    priority: z.number().min(0).max(100),
    orderIndex: z.number().min(0),
    isCritical: z.boolean(),
    enabled: z.boolean()
  }))
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
    const { updates } = updateSchema.parse(body);

    // Update each question
    const promises = updates.map(update =>
      updateQuestionConfig(
        update.questionId,
        {
          priority: update.priority,
          orderIndex: update.orderIndex,
          isCritical: update.isCritical,
          enabled: update.enabled
        },
        session.user?.id || ''
      )
    );

    await Promise.all(promises);

    // Log the action
    await logAdminAction({
      action: 'question.update',
      resource: 'question_configs',
      metadata: {
        updatedCount: updates.length,
        questionIds: updates.map(u => u.questionId)
      }
    });

    return NextResponse.json({ 
      success: true,
      updatedCount: updates.length
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Failed to update questions:', error);
    return NextResponse.json(
      { error: 'Failed to update questions' },
      { status: 500 }
    );
  }
}