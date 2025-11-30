'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@workspace/database';
import { serviceRequestTable } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@workspace/auth';

export async function addAdminMessage(requestId: string, newMessage: string, currentStatus?: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id; // Store in const to satisfy TypeScript

  // Check if user is platform admin
  const user = await db.query.userTable.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
    columns: {
      isPlatformAdmin: true,
    },
  });

  if (!user?.isPlatformAdmin) {
    throw new Error('Forbidden - Admin access required');
  }

  // Get the current request
  const [request] = await db
    .select({
      adminNotes: serviceRequestTable.adminNotes,
      status: serviceRequestTable.status,
    })
    .from(serviceRequestTable)
    .where(eq(serviceRequestTable.id, requestId))
    .limit(1);

  if (!request) {
    throw new Error('Service request not found');
  }

  // Append the new admin note with timestamp
  const timestamp = new Date().toISOString();
  let updatedAdminNotes: string;
  
  if (request.adminNotes) {
    // Check if the existing notes already have timestamps
    if (request.adminNotes.includes('--- Respuesta del admin')) {
      // Append to existing timestamped notes
      updatedAdminNotes = `${request.adminNotes}\n\n--- Respuesta del admin (${timestamp}) ---\n${newMessage}`;
    } else {
      // Convert existing note to timestamped format
      const originalTimestamp = new Date().toISOString();
      updatedAdminNotes = `--- Respuesta del admin (${originalTimestamp}) ---\n${request.adminNotes}\n\n--- Respuesta del admin (${timestamp}) ---\n${newMessage}`;
    }
  } else {
    // First admin note
    updatedAdminNotes = `--- Respuesta del admin (${timestamp}) ---\n${newMessage}`;
  }

  // Prepare updates
  const updates: Record<string, unknown> = {
    adminNotes: updatedAdminNotes,
    updatedAt: new Date()
  };

  // Update status if provided and different
  if (currentStatus && currentStatus !== request.status) {
    updates.status = currentStatus;
  }

  // Update the request with the new admin notes
  await db
    .update(serviceRequestTable)
    .set(updates)
    .where(eq(serviceRequestTable.id, requestId));

  // Revalidate admin paths
  revalidatePath(`/[locale]/admin/services/[id]`, 'page');
  revalidatePath(`/es/admin/services/${requestId}`);
  revalidatePath(`/en/admin/services/${requestId}`);
  
  // Also revalidate client paths in case they're viewing the conversation
  revalidatePath(`/[locale]/organizations/[slug]/services/requests/[id]`, 'page');
  
  return { success: true };
}