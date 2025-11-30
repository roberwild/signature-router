'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@workspace/database';
import { serviceRequestTable } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@workspace/auth';

export async function addUserMessage(requestId: string, newMessage: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Get the current request
  const [request] = await db
    .select({
      message: serviceRequestTable.message,
      userId: serviceRequestTable.userId,
    })
    .from(serviceRequestTable)
    .where(eq(serviceRequestTable.id, requestId))
    .limit(1);

  if (!request) {
    throw new Error('Service request not found');
  }

  // Verify the user owns this request
  if (request.userId !== session.user.id) {
    throw new Error('Unauthorized');
  }

  // Append the new message with timestamp
  const timestamp = new Date().toISOString();
  const updatedMessage = request.message 
    ? `${request.message}\n\n--- Mensaje adicional del usuario (${timestamp}) ---\n${newMessage}`
    : newMessage;

  // Update the request with the new message
  await db
    .update(serviceRequestTable)
    .set({ 
      message: updatedMessage,
      updatedAt: new Date()
    })
    .where(eq(serviceRequestTable.id, requestId));

  // Revalidate all possible paths for this request
  revalidatePath(`/[locale]/organizations/[slug]/services/requests/[id]`, 'page');
  revalidatePath(`/es/organizations/[slug]/services/requests/${requestId}`);
  revalidatePath(`/en/organizations/[slug]/services/requests/${requestId}`);
  
  return { success: true };
}