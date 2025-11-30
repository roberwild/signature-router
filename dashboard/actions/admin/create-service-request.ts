/**
 * Create Service Request Server Action
 * Handles creation of new service requests from users
 */

'use server';

import { z } from 'zod';
import { createServerAction } from 'next-safe-action';
import { auth } from '@workspace/auth';
import { createServiceRequestSchema } from '~/schemas/admin/service-request-schema';

// TODO: Import actual database client
// import { db } from '@workspace/database';
// import { serviceRequestTable } from '@workspace/database/schema';

export const createServiceRequest = createServerAction({
  schema: createServiceRequestSchema,
  async action({ parsedInput }) {
    // Get authenticated user
    const session = await auth();
    if (!session?.user) {
      throw new Error('No autenticado');
    }

    // TODO: Get user's organization
    // For now, using mock organization ID
    const organizationId = 'mock-org-id';
    const userId = session.user.id;

    // TODO: Insert into database
    // const [request] = await db.insert(serviceRequestTable).values({
    //   organizationId,
    //   userId,
    //   serviceName: parsedInput.serviceName,
    //   serviceType: parsedInput.serviceType,
    //   contactName: parsedInput.contactName,
    //   contactEmail: parsedInput.contactEmail,
    //   contactPhone: parsedInput.contactPhone,
    //   message: parsedInput.message,
    //   status: 'pending',
    //   conversionStage: 'lead',
    // }).returning();

    // TODO: Send email notification to admin
    // await sendServiceRequestEmail(request);

    // Mock response for now
    return {
      success: true,
      requestId: 'mock-request-id',
    };
  },
});

