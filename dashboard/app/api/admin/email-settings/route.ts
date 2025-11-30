import { NextRequest, NextResponse } from 'next/server';
import { db } from '@workspace/database';
import { platformEmailSettingsTable, emailSettingsAuditTable } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';
import { emailSettingsSchema } from '~/app/[locale]/admin/email-settings/schemas/email-settings-schema';
import { withPlatformAdmin,  AccessControlContext } from '~/lib/security/access-control';
import { CredentialMasker } from '~/lib/security/credential-masking';
import { EncryptionService, type EncryptedData } from '~/lib/security/encryption';
import { applySecurityHeaders } from '~/lib/security/middleware';

// GET /api/admin/email-settings
export const GET = withPlatformAdmin(async (_request, _context) => {
  try {
    const settings = await db
      .select()
      .from(platformEmailSettingsTable)
      .where(eq(platformEmailSettingsTable.isActive, true))
      .limit(1);

    if (settings.length === 0) {
      const response = NextResponse.json({ settings: null });
      return applySecurityHeaders(response);
    }

    const [setting] = settings;
    
    // Decrypt and mask provider config for display
    let decryptedConfig = null;
    if (setting.providerConfig) {
      try {
        decryptedConfig = await EncryptionService.decrypt(setting.providerConfig as EncryptedData);
        decryptedConfig = CredentialMasker.maskProviderConfig(setting.provider, JSON.parse(decryptedConfig));
      } catch (error) {
        console.error('Failed to decrypt provider config:', error);
        decryptedConfig = { error: 'Unable to decrypt configuration' };
      }
    }

    const sanitizedSettings = {
      ...setting,
      providerConfig: decryptedConfig
    };

    const response = NextResponse.json({ settings: sanitizedSettings });
    return applySecurityHeaders(response);
  } catch (error) {
    console.error('Failed to fetch email settings:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch email settings' },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
});

// Internal handler for creating email settings
async function createEmailSettings(request: NextRequest, context: AccessControlContext) {
  try {
    const body = await request.json();
    console.log('[Email Settings] Creating with data:', JSON.stringify(body, null, 2));
    
    // Validate the input
    const validatedData = emailSettingsSchema.parse(body);
    console.log('[Email Settings] Validation passed');

    // Encrypt sensitive provider config
    console.log('[Email Settings] Encrypting provider config');
    const encryptedConfig = await EncryptionService.encrypt(JSON.stringify(validatedData.providerConfig));
    console.log('[Email Settings] Encryption completed');

    // Deactivate existing settings
    await db
      .update(platformEmailSettingsTable)
      .set({ isActive: false })
      .where(eq(platformEmailSettingsTable.isActive, true));

    // Create new settings
    const [newSettings] = await db
      .insert(platformEmailSettingsTable)
      .values({
        emailFrom: validatedData.emailFrom,
        emailFromName: validatedData.emailFromName || null,
        feedbackInbox: validatedData.feedbackInbox || null,
        replyTo: validatedData.replyTo || null,
        provider: validatedData.provider,
        providerConfig: encryptedConfig,
        features: validatedData.features,
        notificationSettings: validatedData.notificationSettings || {},
        updatedBy: context.user.id,
        isActive: true
      })
      .returning();

    // Log the creation
    await db.insert(emailSettingsAuditTable).values({
      settingsId: newSettings.id,
      action: 'create',
      changes: {
        provider: validatedData.provider,
        emailFrom: validatedData.emailFrom
      },
      userId: context.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });

    const response = NextResponse.json({ success: true, settings: newSettings });
    return applySecurityHeaders(response);
  } catch (error: unknown) {
    console.error('[Email Settings] Failed to create:', error);
    if (error instanceof Error) {
      console.error('[Email Settings] Error stack:', error.stack);
    }

    let response;
    if (error instanceof Error && error.name === 'ZodError') {
      interface ZodError {
        errors: Array<{ path: (string | number)[]; message: string; code: string }>;
      }
      const zodError = error as unknown as ZodError;
      console.error('[Email Settings] Validation error details:', zodError.errors);
      response = NextResponse.json(
        { error: 'Invalid configuration', details: zodError.errors },
        { status: 400 }
      );
    } else {
      const message = error instanceof Error ? error.message : 'Failed to create email settings';
      const details = error instanceof Error ? error.toString() : String(error);
      response = NextResponse.json(
        { error: message, details },
        { status: 500 }
      );
    }
    
    return applySecurityHeaders(response);
  }
}

// POST /api/admin/email-settings
export const POST = withPlatformAdmin(createEmailSettings);

// PUT /api/admin/email-settings
export const PUT = withPlatformAdmin(async (request, context) => {
  try {
    const body = await request.json();
    
    // Validate the input
    const validatedData = emailSettingsSchema.parse(body);

    // Get current active settings
    const [currentSettings] = await db
      .select()
      .from(platformEmailSettingsTable)
      .where(eq(platformEmailSettingsTable.isActive, true))
      .limit(1);

    if (!currentSettings) {
      // If no settings exist, create instead
      return createEmailSettings(request, context);
    }

    // Encrypt sensitive provider config
    const encryptedConfig = await EncryptionService.encrypt(JSON.stringify(validatedData.providerConfig));

    // Update settings
    const [updatedSettings] = await db
      .update(platformEmailSettingsTable)
      .set({
        emailFrom: validatedData.emailFrom,
        emailFromName: validatedData.emailFromName || null,
        feedbackInbox: validatedData.feedbackInbox || null,
        replyTo: validatedData.replyTo || null,
        provider: validatedData.provider,
        providerConfig: encryptedConfig,
        features: validatedData.features,
        notificationSettings: validatedData.notificationSettings || {},
        updatedBy: context.user.id,
        updatedAt: new Date()
      })
      .where(eq(platformEmailSettingsTable.id, currentSettings.id))
      .returning();

    // Log the update
    await db.insert(emailSettingsAuditTable).values({
      settingsId: currentSettings.id,
      action: 'update',
      changes: {
        before: {
          provider: currentSettings.provider,
          emailFrom: currentSettings.emailFrom
        },
        after: {
          provider: validatedData.provider,
          emailFrom: validatedData.emailFrom
        }
      },
      userId: context.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });

    const response = NextResponse.json({ success: true, settings: updatedSettings });
    return applySecurityHeaders(response);
  } catch (error: unknown) {
    console.error('Failed to update email settings:', error);

    let response;
    if (error instanceof Error && error.name === 'ZodError') {
      interface ZodError {
        errors: Array<{ path: (string | number)[]; message: string; code: string }>;
      }
      const zodError = error as unknown as ZodError;
      response = NextResponse.json(
        { error: 'Invalid configuration', details: zodError.errors },
        { status: 400 }
      );
    } else {
      response = NextResponse.json(
        { error: 'Failed to update email settings' },
        { status: 500 }
      );
    }
    
    return applySecurityHeaders(response);
  }
});

// DELETE /api/admin/email-settings
export const DELETE = withPlatformAdmin(async (request, context) => {
  try {
    // Get current active settings
    const [currentSettings] = await db
      .select()
      .from(platformEmailSettingsTable)
      .where(eq(platformEmailSettingsTable.isActive, true))
      .limit(1);

    if (!currentSettings) {
      const response = NextResponse.json(
        { error: 'No active email settings found' },
        { status: 404 }
      );
      return applySecurityHeaders(response);
    }

    // Deactivate settings instead of deleting
    await db
      .update(platformEmailSettingsTable)
      .set({ 
        isActive: false,
        updatedBy: context.user.id,
        updatedAt: new Date()
      })
      .where(eq(platformEmailSettingsTable.id, currentSettings.id));

    // Log the deletion
    await db.insert(emailSettingsAuditTable).values({
      settingsId: currentSettings.id,
      action: 'delete',
      changes: {
        provider: currentSettings.provider,
        emailFrom: currentSettings.emailFrom
      },
      userId: context.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });

    const response = NextResponse.json({ success: true, message: 'Email settings deactivated' });
    return applySecurityHeaders(response);
  } catch (error) {
    console.error('Failed to delete email settings:', error);
    const response = NextResponse.json(
      { error: 'Failed to delete email settings' },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
});