import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { requirePermission } from '~/lib/admin/permissions';
import { logAdminAction } from '~/lib/admin/audit-logger';
import { updateMultipleSettings } from '~/data/admin/questionnaires/get-global-settings';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  maxQuestionsPerSession: z.number().min(1).max(10),
  snoozeDurationOptions: z.array(z.string()).min(1),
  permanentDismissThreshold: z.number().min(1).max(10),
  defaultChannel: z.enum(['platform', 'email', 'whatsapp']),
  questionTimeoutMinutes: z.number().min(1).max(30),
  sessionTimeoutMinutes: z.number().min(5).max(120)
});

export async function PUT(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('settings.write');
    
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateSettingsSchema.parse(body);

    // Convert to database format
    const settingsToUpdate = [
      { settingKey: 'max_questions_per_session', settingValue: validatedData.maxQuestionsPerSession },
      { settingKey: 'snooze_duration_options', settingValue: validatedData.snoozeDurationOptions },
      { settingKey: 'permanent_dismiss_threshold', settingValue: validatedData.permanentDismissThreshold },
      { settingKey: 'default_channel', settingValue: validatedData.defaultChannel },
      { settingKey: 'question_timeout_minutes', settingValue: validatedData.questionTimeoutMinutes },
      { settingKey: 'session_timeout_minutes', settingValue: validatedData.sessionTimeoutMinutes }
    ];

    // Update settings
    await updateMultipleSettings(settingsToUpdate, session.user.id);

    // Log the action
    await logAdminAction({
      action: 'settings.update',
      resource: 'global_settings',
      metadata: {
        updatedSettings: Object.keys(validatedData),
        changes: validatedData
      }
    });

    return NextResponse.json({ 
      success: true,
      data: validatedData
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid settings data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}