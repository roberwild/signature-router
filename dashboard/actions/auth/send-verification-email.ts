'use server';

import { createOtpTokens } from '@workspace/auth/verification';
import { db, eq } from '@workspace/database/client';
import { userTable } from '@workspace/database/schema';
import { sendVerifyEmailAddressEmail } from '@workspace/email/send-verify-email-address-email';
import { routes } from '@workspace/routes';

// Simple function that can be called from server components
// Mirrors the password reset flow exactly
export async function sendVerificationEmail(email: string): Promise<void> {
  console.log('[sendVerificationEmail] Starting for:', email);
  console.log('[sendVerificationEmail] Email length:', email?.length);
  console.log('[sendVerificationEmail] Email includes @:', email?.includes('@'));

  if (!email) {
    console.log('[sendVerificationEmail] No email provided');
    return;
  }

  // Ensure email is decoded (in case it still has URL encoding)
  const decodedEmail = decodeURIComponent(email);
  const normalizedEmail = decodedEmail.toLowerCase();

  console.log('[sendVerificationEmail] Decoded email:', decodedEmail);
  console.log('[sendVerificationEmail] Normalized email:', normalizedEmail);

  try {
    const [maybeUser] = await db
      .select({
        name: userTable.name,
        email: userTable.email,
        emailVerified: userTable.emailVerified
      })
      .from(userTable)
      .where(eq(userTable.email, normalizedEmail))
      .limit(1);

    console.log('[sendVerificationEmail] User lookup result:', {
      found: !!maybeUser,
      email: maybeUser?.email,
      emailVerified: !!maybeUser?.emailVerified
    });

    if (!maybeUser || !maybeUser.email) {
      console.log('[sendVerificationEmail] User not found');
      return;
    }

    if (maybeUser.emailVerified) {
      console.log('[sendVerificationEmail] User already verified');
      return;
    }

    console.log('[sendVerificationEmail] Generating OTP...');
    const { otp, hashedOtp } = await createOtpTokens(normalizedEmail);
    console.log('[sendVerificationEmail] OTP generated:', { otp, hashedOtp });

    const verificationLink = `${routes.dashboard.auth.verifyEmail.Request}/${hashedOtp}`;

    console.log('[sendVerificationEmail] Sending email...');
    await sendVerifyEmailAddressEmail({
      recipient: maybeUser.email,
      name: maybeUser.name || 'User',
      otp,
      verificationLink
    });

    console.log('[sendVerificationEmail] Email sent successfully to:', maybeUser.email);
  } catch (error) {
    console.error('[sendVerificationEmail] Error:', error);
    console.error('[sendVerificationEmail] Error stack:', error instanceof Error ? error.stack : 'No stack');
    // Don't throw - we don't want to break the page load
  }
}