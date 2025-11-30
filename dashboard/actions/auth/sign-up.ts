'use server';

import { redirect } from 'next/navigation';
import { returnValidationErrors } from 'next-safe-action';

import { hashPassword } from '@workspace/auth/password';
import { createOtpTokens } from '@workspace/auth/verification';
import { db, eq } from '@workspace/database/client';
import { userTable } from '@workspace/database/schema';
import { sendVerifyEmailAddressEmail } from '@workspace/email/send-verify-email-address-email';
import { routes } from '@workspace/routes';

import { actionClient } from '~/actions/safe-action';
import { signUpSchema } from '~/schemas/auth/sign-up-schema';
import { adminNotificationService } from '~/lib/email/admin-notification-service';

export const signUp = actionClient
  .metadata({ actionName: 'signUp' })
  .schema(signUpSchema)
  .action(async ({ parsedInput }) => {
    const normalizedEmail = parsedInput.email.toLowerCase();
    const [user] = await db
      .select({})
      .from(userTable)
      .where(eq(userTable.email, normalizedEmail))
      .limit(1);

    if (user) {
      return returnValidationErrors(signUpSchema, {
        email: {
          _errors: ['Email address is already taken.']
        }
      });
    }

    const hashedPassword = await hashPassword(parsedInput.password);

    await db.insert(userTable).values({
      name: parsedInput.name,
      email: normalizedEmail,
      password: hashedPassword,
      locale: 'en-US',
      completedOnboarding: false
    });

    const { otp, hashedOtp } = await createOtpTokens(normalizedEmail);

    await sendVerifyEmailAddressEmail({
      recipient: normalizedEmail,
      name: parsedInput.name,
      otp,
      verificationLink: `${routes.dashboard.auth.verifyEmail.Request}/${hashedOtp}`
    });
    console.log(`[Sign-up] Verification email sent successfully to: ${normalizedEmail}`);

    // Send admin notification for new user registration
    try {
      await adminNotificationService.sendUserRegistrationNotification({
        name: parsedInput.name,
        email: normalizedEmail,
        registrationDate: new Date(),
      });
    } catch (e) {
      console.error('Failed to send user registration notification:', e);
    }

    return redirect(
      `${routes.dashboard.auth.verifyEmail.Index}?email=${encodeURIComponent(parsedInput.email)}`
    );
  });
