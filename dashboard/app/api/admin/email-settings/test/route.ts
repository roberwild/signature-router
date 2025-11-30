import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { requirePlatformAdmin } from '~/middleware/admin';
import { emailSettingsSchema } from '~/app/[locale]/admin/email-settings/schemas/email-settings-schema';
import { EmailProviderFactory } from '@workspace/email/services/email-provider-factory';
import type { DatabaseEmailConfig } from '@workspace/email/provider/enhanced-types';

// Interfaces for email operations
interface EmailError extends Error {
  name: string;
  message: string;
  errors?: unknown;
}

// POST /api/admin/email-settings/test
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePlatformAdmin();

    const body = await request.json();
    
    // Validate the input
    const validatedData = emailSettingsSchema.parse(body);

    // Create a temporary config for testing
    const testConfig: DatabaseEmailConfig = {
      id: 'test',
      emailFrom: validatedData.emailFrom,
      emailFromName: validatedData.emailFromName,
      feedbackInbox: validatedData.feedbackInbox,
      replyTo: validatedData.replyTo,
      provider: validatedData.provider,
      providerConfig: validatedData.providerConfig,
      features: validatedData.features,
      isActive: true
    };

    // Test the provider configuration
    try {
      const provider = EmailProviderFactory.create(testConfig);
      const isValid = await provider.verify();
      
      if (isValid) {
        // Optionally send a test email
        if (validatedData.emailFrom) {
          try {
            await provider.sendEmailEnhanced({
              recipient: validatedData.emailFrom,
              to: validatedData.emailFrom,
              subject: 'Prueba de Configuración de Correo',
              text: 'This is a test email to verify your email configuration.',
              html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2>Email Configuration Test</h2>
                  <p>This is a test email to verify your email configuration.</p>
                  <p>Provider: ${validatedData.provider}</p>
                  <p>From: ${validatedData.emailFrom}</p>
                  <p style="color: #666; font-size: 12px; margin-top: 20px;">
                    Sent from your application's email settings configuration page.
                  </p>
                </div>
              `
            });
            
            return NextResponse.json({ 
              success: true, 
              message: `Connection verified! Test email sent to ${validatedData.emailFrom}` 
            });
          } catch (emailError: unknown) {
            // Connection is valid but sending failed (might be due to domain verification)
            const typedEmailError = emailError as EmailError;
            return NextResponse.json({
              success: true,
              message: 'Connection verified! (Test email failed - check domain verification)',
              warning: typedEmailError.message
            });
          }
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Connection test successful!' 
        });
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid provider configuration' 
          },
          { status: 400 }
        );
      }
    } catch (providerError: unknown) {
      console.error('Provider test failed:', providerError);
      const typedProviderError = providerError as EmailError;
      return NextResponse.json(
        {
          success: false,
          error: typedProviderError.message || 'Failed to verify provider configuration'
        },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error('Failed to test email settings:', error);
    const typedError = error as EmailError;
    
    if (typedError.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid configuration',
          details: typedError.errors
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to test email settings' 
      },
      { status: 500 }
    );
  }
}