import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, platformEmailSettingsTable } from '@workspace/database';
import { auth } from '@workspace/auth';
import { eq } from 'drizzle-orm';

// General settings schema
const generalSettingsSchema = z.object({
  emailFrom: z.string().email('Must be a valid email address'),
  emailFromName: z.string().optional(),
  replyTo: z.string().email('Must be a valid email address').optional().or(z.literal('')),
  feedbackInbox: z.string().email('Must be a valid email address').optional().or(z.literal('')),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = generalSettingsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { emailFrom, emailFromName, replyTo, feedbackInbox } = validationResult.data;

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

    // Update general settings
    const updated = await db
      .update(platformEmailSettingsTable)
      .set({
        emailFrom,
        emailFromName: emailFromName || null,
        replyTo: replyTo || null,
        feedbackInbox: feedbackInbox || null,
        updatedAt: new Date(),
      })
      .where(eq(platformEmailSettingsTable.id, existingSettings[0].id))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'General settings updated successfully',
      id: updated[0]?.id,
    });
  } catch (error) {
    console.error('General settings error:', error);
    return NextResponse.json(
      { error: 'Failed to save general settings' },
      { status: 500 }
    );
  }
}