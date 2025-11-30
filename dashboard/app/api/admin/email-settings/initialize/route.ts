import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { initializeEmailSettingsFromEnv, needsEmailSettingsInitialization } from '~/lib/email/initialize-email-settings';

/**
 * GET /api/admin/email-settings/initialize
 * Check if email settings need initialization
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const needsInit = await needsEmailSettingsInitialization();

    return NextResponse.json({
      needsInitialization: needsInit,
      hasEnvironmentVars: !!(
        process.env.POSTMARK_SERVER_TOKEN ||
        process.env.POSTMARK_API_TOKEN ||
        process.env.RESEND_API_KEY ||
        process.env.SENDGRID_API_KEY ||
        process.env.SMTP_HOST
      )
    });
  } catch (error) {
    console.error('Failed to check initialization status:', error);
    return NextResponse.json(
      { error: 'Failed to check initialization status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/email-settings/initialize
 * Initialize email settings from environment variables
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if initialization is needed
    const needsInit = await needsEmailSettingsInitialization();

    if (!needsInit) {
      return NextResponse.json({
        success: false,
        message: 'Email settings already exist. Clear existing settings first if you want to reinitialize.'
      });
    }

    // Run initialization
    const result = await initializeEmailSettingsFromEnv();

    if (result.initialized) {
      return NextResponse.json({
        success: true,
        message: 'Email settings initialized successfully from environment variables',
        provider: result.provider,
        id: result.id
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Could not initialize email settings',
        reason: result.reason,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Failed to initialize email settings:', error);
    return NextResponse.json(
      {
        error: 'Failed to initialize email settings',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}