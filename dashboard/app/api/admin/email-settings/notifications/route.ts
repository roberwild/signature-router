import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, platformEmailSettingsTable } from '@workspace/database';
import { auth } from '@workspace/auth';
import { eq } from 'drizzle-orm';

// Notifications schema
const notificationsSchema = z.object({
  notificationSettings: z.object({
    contactFormNotificationEmail: z.string().email('Must be a valid email address').optional().or(z.literal('')),
    serviceRequestNotificationEmail: z.string().email('Must be a valid email address').optional().or(z.literal('')),
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
    const validationResult = notificationsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { notificationSettings } = validationResult.data;

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

    // Update notification settings
    const updated = await db
      .update(platformEmailSettingsTable)
      .set({
        notificationSettings,
        updatedAt: new Date(),
      })
      .where(eq(platformEmailSettingsTable.id, existingSettings[0].id))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Notification settings updated successfully',
      id: updated[0]?.id,
    });
  } catch (error) {
    console.error('Notification settings error:', error);
    return NextResponse.json(
      { error: 'Failed to save notification settings' },
      { status: 500 }
    );
  }
}