'use server';

import { headers } from 'next/headers';
import { db } from '@workspace/database';
import { serviceInfoClickTable } from '@workspace/database/schema';
import { auth } from '@workspace/auth';

export async function trackServiceInfoClick(
  serviceName: string,
  serviceType: string | undefined,
  organizationId: string
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { error: 'User not authenticated' };
    }

    // Get IP address from headers
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 
                     headersList.get('x-real-ip') || 
                     'unknown';

    // Insert the click tracking record
    await db.insert(serviceInfoClickTable).values({
      userId: session.user.id,
      organizationId,
      serviceName,
      serviceType: serviceType || null,
      ipAddress,
      sessionId: session.user.id
    });

    return { success: true };
  } catch (error) {
    console.error('Error tracking service info click:', error);
    return { error: 'Failed to track click' };
  }
}