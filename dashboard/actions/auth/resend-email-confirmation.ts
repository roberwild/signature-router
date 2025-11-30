'use server';

import { createOtpTokens } from '@workspace/auth/verification';
import { db, eq } from '@workspace/database/client';
import { userTable } from '@workspace/database/schema';
import { sendVerifyEmailAddressEmail } from '@workspace/email/send-verify-email-address-email';
import { routes } from '@workspace/routes';

import { actionClient } from '~/actions/safe-action';
import { resendEmailConfirmationSchema } from '~/schemas/auth/resend-email-confirmation-schema';

export const resendEmailConfirmation = actionClient
  .metadata({ actionName: 'resendEmailConfirmation' })
  .schema(resendEmailConfirmationSchema)
  .action(async ({ parsedInput }) => {
    try {
      console.log('[Resend Verification] Starting with input:', parsedInput.email);

      const normalizedEmail = parsedInput.email.toLowerCase();
      console.log('[Resend Verification] Normalized email:', normalizedEmail);

      const [maybeUser] = await db
        .select({
          name: userTable.name,
          email: userTable.email,
          emailVerified: userTable.emailVerified
        })
        .from(userTable)
        .where(eq(userTable.email, normalizedEmail))
        .limit(1);

      console.log('[Resend Verification] User found:', {
        exists: !!maybeUser,
        email: maybeUser?.email,
        emailVerified: maybeUser?.emailVerified,
        name: maybeUser?.name
      });

      if (!maybeUser || !maybeUser.email) {
        console.log('[Resend Verification] User not found:', normalizedEmail);
        // Return success to avoid leaking user existence
        return { success: true, message: 'If the email exists, a verification email has been sent' };
      }

      if (maybeUser.emailVerified) {
        console.log('[Resend Verification] User already verified:', normalizedEmail);
        return { success: true, message: 'Email is already verified' };
      }

      console.log('[Resend Verification] Creating OTP tokens...');
      const { otp, hashedOtp } = await createOtpTokens(normalizedEmail);
      console.log('[Resend Verification] OTP created:', { otp, hashedOtp });

      const emailPayload = {
        recipient: maybeUser.email,
        name: maybeUser.name || 'User',
        otp,
        verificationLink: `${routes.dashboard.auth.verifyEmail.Request}/${hashedOtp}`
      };
      console.log('[Resend Verification] Sending email with payload:', JSON.stringify(emailPayload, null, 2));

      await sendVerifyEmailAddressEmail(emailPayload);
      console.log(`[Resend Verification] Email sent successfully to: ${maybeUser.email}`);

      return { success: true, message: 'Verification email sent' };
    } catch (error) {
      console.error('[Resend Verification] ERROR:', error);
      console.error('[Resend Verification] Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('[Resend Verification] Error details:', JSON.stringify(error, null, 2));

      // Re-throw to let the action client handle it
      throw error;
    }
  });
