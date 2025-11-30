import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, platformEmailSettingsTable } from '@workspace/database';
import { auth } from '@workspace/auth';
import { eq } from 'drizzle-orm';

// Features schema
const featuresSchema = z.object({
  features: z.object({
    welcomeEmails: z.boolean(),
    passwordResetEmails: z.boolean(),
    invitationEmails: z.boolean(),
    feedbackEmails: z.boolean(),
    leadQualificationEmails: z.boolean(),
    contactFormEmails: z.boolean(),
    serviceRequestEmails: z.boolean(),
    userRegistrationNotifications: z.boolean(),
    surveyCompletionNotifications: z.boolean(),
    failedLoginNotifications: z.boolean(),
    systemErrorNotifications: z.boolean(),
  }),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = featuresSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { features } = validationResult.data;

    // Find existing settings
    const existingSettings = await db
      .select()
      .from(platformEmailSettingsTable)
      .limit(1);

    if (!existingSettings || existingSettings.length === 0) {
      return NextResponse.json(
        { error: 'Email settings not found. Please configure provider first.' },
        { status: 404 }
      );
    }

    // Update features
    const updated = await db
      .update(platformEmailSettingsTable)
      .set({
        features,
        updatedAt: new Date(),
      })
      .where(eq(platformEmailSettingsTable.id, existingSettings[0].id))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Feature settings updated successfully',
      id: updated[0]?.id,
    });
  } catch (error) {
    console.error('Feature settings error:', error);
    return NextResponse.json(
      { error: 'Failed to save feature settings' },
      { status: 500 }
    );
  }
}