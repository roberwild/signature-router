import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE
} from 'next-safe-action';
import { z } from 'zod';

import {
  getAuthContext,
  getAuthOrganizationContext
} from '@workspace/auth/context';
import {
  ForbiddenError,
  GatewayError,
  NotFoundError,
  PreConditionError,
  ValidationError
} from '@workspace/common/errors';
import { SystemErrorHandler } from '~/lib/error/system-error-handler';

const metadataSchema = z.object({
  actionName: z.string()
});

type _ActionMetadata = z.infer<typeof metadataSchema>;

export const actionClient = createSafeActionClient<
  undefined,
  string,
  typeof metadataSchema
>({
  handleServerError(e, utils) {
    // Send system error notification for unexpected errors
    if (
      !(e instanceof ValidationError) &&
      !(e instanceof ForbiddenError) &&
      !(e instanceof NotFoundError) &&
      !(e instanceof PreConditionError) &&
      !(e instanceof GatewayError)
    ) {
      // Handle unexpected system errors
      SystemErrorHandler.handleError(e instanceof Error ? e : new Error(String(e)), {
        endpoint: `Action: ${utils.metadata?.actionName || 'unknown'}`,
      }).catch((notificationError) => {
        console.error('Failed to send system error notification:', notificationError);
      });
    }

    if (
      e instanceof ValidationError ||
      e instanceof ForbiddenError ||
      e instanceof NotFoundError ||
      e instanceof PreConditionError ||
      e instanceof GatewayError
    ) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
  defineMetadataSchema() {
    return metadataSchema;
  }
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const ctx = await getAuthContext();

  return next({ ctx });
});

export const authOrganizationActionClient = actionClient.use(
  async ({ next }) => {
    const ctx = await getAuthOrganizationContext();

    return next({ ctx });
  }
);
