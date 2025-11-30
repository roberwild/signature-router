'use server';

import { returnValidationErrors } from 'next-safe-action';

import { signIn } from '@workspace/auth';
import { CredentialsSignin } from 'next-auth';
import { Provider } from '@workspace/auth/providers.types';
import { getRedirectAfterSignIn } from '@workspace/auth/redirect';
import { AuthErrorCode } from '@workspace/auth/errors';
// import { routes } from '@workspace/routes';

import { actionClient } from '~/actions/safe-action';
import { passThroughCredentialsSchema } from '~/schemas/auth/pass-through-credentials-schema';
import { FailedLoginTracker } from '@workspace/auth';
import { adminNotificationService } from '~/lib/email/admin-notification-service';

export const signInWithCredentials = actionClient
  .metadata({ actionName: 'signInWithCredentials' })
  .schema(passThroughCredentialsSchema)
  .action(async ({ parsedInput }) => {
    const redirectTo = await getRedirectAfterSignIn();

    // Expected UX for log in is to pass the credentials through
    // and not validate them on the client-side.
    try {
      await signIn(Provider.Credentials, {
        ...parsedInput,
        redirectTo,
        redirect: true
      });
      
      // Clear failed attempts on successful login
      if (parsedInput.email) {
        FailedLoginTracker.clearFailedAttempts(parsedInput.email.toLowerCase());
      }
    } catch (e) {
      console.log('[SignIn] Error caught:', e);
      if (e instanceof CredentialsSignin) {
        console.log('[SignIn] CredentialsSignin error code:', e.code);
        console.log('[SignIn] AuthErrorCode.UnverifiedEmail value:', AuthErrorCode.UnverifiedEmail);
        console.log('[SignIn] Codes match?', e.code === AuthErrorCode.UnverifiedEmail);
        console.log('[SignIn] Email provided?', !!parsedInput.email);

        // Check if it's an unverified email error and return redirect info
        if (e.code === AuthErrorCode.UnverifiedEmail && parsedInput.email) {
          console.log('[SignIn] Unverified email detected, returning redirect info:', parsedInput.email);
          // Return the redirect info with email as separate field
          return {
            redirect: true,
            redirectTo: '/auth/verify-email',
            email: parsedInput.email
          };
        }

        // Handle failed login notification
        if (parsedInput.email) {
          const normalizedEmail = parsedInput.email.toLowerCase();
          const _attemptCount = FailedLoginTracker.recordFailedAttempt(normalizedEmail);

          // Send admin notification if threshold reached
          if (FailedLoginTracker.shouldSendNotification(normalizedEmail)) {
            try {
              const attemptData = FailedLoginTracker.getFailedAttempts(normalizedEmail);
              if (attemptData) {
                await adminNotificationService.sendFailedLoginNotification({
                  email: normalizedEmail,
                  ipAddress: attemptData.ipAddress || 'Unknown',
                  attemptCount: attemptData.count,
                  timestamp: attemptData.lastAttempt,
                });
              }
            } catch (notificationError) {
              console.error('Failed to send failed login notification:', notificationError);
            }
          }
        }

        return returnValidationErrors(passThroughCredentialsSchema, {
          _errors: [e.code]
        });
      }
      throw e;
    }
  });
