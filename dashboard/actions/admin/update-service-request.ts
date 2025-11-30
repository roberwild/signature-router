/**
 * Update Service Request Server Action
 * Allows admins to update service request status and details
 */

'use server';

import { z } from 'zod';
import { createServerAction } from 'next-safe-action';
import { auth } from '@workspace/auth';
import { requirePlatformAdmin } from '~/middleware/admin';
import { updateServiceRequestSchema } from '~/schemas/admin/service-request-schema';

const schema = z.object({
  requestId: z.string().uuid(),
  updates: updateServiceRequestSchema,
});

export const updateServiceRequest = createServerAction({
  schema,
  async action({ parsedInput }) {
    // Check authentication and admin authorization
    const session = await auth();
    if (!session?.user) {
      throw new Error('No autenticado');
    }

    await requirePlatformAdmin();

    // TODO: Update in database
    // const updates: any = { ...parsedInput.updates, updatedAt: new Date() };

    // If marking as won, set wonDate
    // if (parsedInput.updates.status === 'won') {
    //   updates.wonDate = new Date();
    //   updates.conversionStage = 'customer';
    // }

    // await db.update(serviceRequestTable)
    //   .set(updates)
    //   .where(eq(serviceRequestTable.id, parsedInput.requestId));

    // TODO: Send email notification for status changes
    // if (parsedInput.updates.status) {
    //   await sendStatusChangeEmail(parsedInput.requestId, parsedInput.updates.status);
    // }

    return {
      success: true,
    };
  },
});

