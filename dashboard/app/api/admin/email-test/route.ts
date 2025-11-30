import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@workspace/auth';
import { sendVerifyEmailAddressEmail } from '@workspace/email/send-verify-email-address-email';
import { sendWelcomeEmail } from '@workspace/email/send-welcome-email';
import { sendPasswordResetEmail } from '@workspace/email/send-password-reset-email';
import { sendInvitationEmail } from '@workspace/email/send-invitation-email';
import { sendFeedbackEmail } from '@workspace/email/send-feedback-email';
// Import other send functions as needed

// Type for email sender functions
type EmailData = Record<string, unknown> & { recipient?: string };
type EmailSenderFunction = (data: EmailData) => Promise<void>;

const templateSenders: Record<string, EmailSenderFunction> = {
  'verify-email': sendVerifyEmailAddressEmail as EmailSenderFunction,
  'welcome': sendWelcomeEmail as EmailSenderFunction,
  'password-reset': sendPasswordResetEmail as EmailSenderFunction,
  'invitation': sendInvitationEmail as EmailSenderFunction,
  'feedback': sendFeedbackEmail as EmailSenderFunction,
  // Add other templates as they have send functions
};

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { template, data } = body;

    if (!template || !templateSenders[template]) {
      return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
    }

    // Add the admin's email as recipient
    const emailData = {
      ...data,
      recipient: session.user.email
    };

    // Send the email
    const sendFunction = templateSenders[template];
    await sendFunction(emailData);

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${session.user.email}`
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}