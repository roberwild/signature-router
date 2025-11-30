import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, platformEmailSettingsTable } from '@workspace/database';
import { auth } from '@workspace/auth';
import { eq } from 'drizzle-orm';
import {  encryptProviderConfig } from '../utils/encryption';

// Provider configuration schema
const providerSchema = z.object({
  provider: z.enum(['nodemailer', 'resend', 'sendgrid', 'postmark']),
  providerConfig: z.record(z.any()),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = providerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { provider, providerConfig } = validationResult.data;

    // Encrypt sensitive provider configuration using the same format expected by decryption
    const encryptedConfig = await encryptProviderConfig(providerConfig);

    // Find existing settings or create new
    const existingSettings = await db
      .select()
      .from(platformEmailSettingsTable)
      .limit(1);

    if (existingSettings && existingSettings.length > 0) {
      // Update existing settings
      const updated = await db
        .update(platformEmailSettingsTable)
        .set({
          provider,
          providerConfig: encryptedConfig,
          updatedAt: new Date(),
        })
        .where(eq(platformEmailSettingsTable.id, existingSettings[0].id))
        .returning();

      return NextResponse.json({
        success: true,
        message: 'Provider settings updated successfully',
        id: updated[0]?.id,
      });
    } else {
      // Create new settings with minimal required fields
      const created = await db
        .insert(platformEmailSettingsTable)
        .values({
          provider,
          providerConfig: encryptedConfig,
          emailFrom: 'noreply@example.com', // Default value
          features: {
            welcomeEmails: true,
            passwordResetEmails: true,
            invitationEmails: true,
            feedbackEmails: true,
            leadQualificationEmails: true,
            contactFormEmails: false,
            serviceRequestEmails: false,
          },
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: 'Provider settings created successfully',
        id: created[0]?.id,
      });
    }
  } catch (error) {
    console.error('Provider settings error:', error);
    return NextResponse.json(
      { error: 'Failed to save provider settings' },
      { status: 500 }
    );
  }
}