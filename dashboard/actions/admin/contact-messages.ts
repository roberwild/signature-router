'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@workspace/database';
import { contactMessageTable } from '@workspace/database/schema';
import { inArray } from 'drizzle-orm';
import { auth } from '@workspace/auth';

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function markMessagesAsRead(messageIds: string[]) {
  await requireAuth();
  
  try {
    await db
      .update(contactMessageTable)
      .set({ status: 'read' })
      .where(inArray(contactMessageTable.id, messageIds));
    
    revalidatePath('/[locale]/admin/messages', 'page');
    return { success: true };
  } catch (error) {
    console.error('Failed to mark messages as read:', error);
    return { success: false, error: 'Failed to mark messages as read' };
  }
}

export async function markMessagesAsUnread(messageIds: string[]) {
  await requireAuth();
  
  try {
    await db
      .update(contactMessageTable)
      .set({ status: 'unread' })
      .where(inArray(contactMessageTable.id, messageIds));
    
    revalidatePath('/[locale]/admin/messages', 'page');
    return { success: true };
  } catch (error) {
    console.error('Failed to mark messages as unread:', error);
    return { success: false, error: 'Failed to mark messages as unread' };
  }
}

export async function archiveMessages(messageIds: string[]) {
  await requireAuth();
  
  try {
    // For now, we'll mark as archived by updating status
    // In the future, you might want to add an 'archived' field to the schema
    await db
      .update(contactMessageTable)
      .set({ status: 'archived' as 'read' | 'unread' | 'archived' })
      .where(inArray(contactMessageTable.id, messageIds));
    
    revalidatePath('/[locale]/admin/messages', 'page');
    return { success: true };
  } catch (error) {
    console.error('Failed to archive messages:', error);
    return { success: false, error: 'Failed to archive messages' };
  }
}

export async function deleteMessages(messageIds: string[]) {
  await requireAuth();
  
  try {
    await db
      .delete(contactMessageTable)
      .where(inArray(contactMessageTable.id, messageIds));
    
    revalidatePath('/[locale]/admin/messages', 'page');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete messages:', error);
    return { success: false, error: 'Failed to delete messages' };
  }
}