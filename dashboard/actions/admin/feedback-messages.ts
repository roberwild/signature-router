'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@workspace/database';
import { feedbackTable } from '@workspace/database/schema';
import { inArray } from 'drizzle-orm';
import { auth } from '@workspace/auth';

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function markFeedbackAsRead(feedbackIds: string[]) {
  await requireAuth();
  
  try {
    await db
      .update(feedbackTable)
      .set({ status: 'read' })
      .where(inArray(feedbackTable.id, feedbackIds));
    
    revalidatePath('/[locale]/admin/messages', 'page');
    return { success: true };
  } catch (error) {
    console.error('Failed to mark feedback as read:', error);
    return { success: false, error: 'Failed to mark feedback as read' };
  }
}

export async function markFeedbackAsUnread(feedbackIds: string[]) {
  await requireAuth();
  
  try {
    await db
      .update(feedbackTable)
      .set({ status: 'unread' })
      .where(inArray(feedbackTable.id, feedbackIds));
    
    revalidatePath('/[locale]/admin/messages', 'page');
    return { success: true };
  } catch (error) {
    console.error('Failed to mark feedback as unread:', error);
    return { success: false, error: 'Failed to mark feedback as unread' };
  }
}

export async function archiveFeedback(feedbackIds: string[]) {
  await requireAuth();
  
  try {
    await db
      .update(feedbackTable)
      .set({ status: 'archived' })
      .where(inArray(feedbackTable.id, feedbackIds));
    
    revalidatePath('/[locale]/admin/messages', 'page');
    return { success: true };
  } catch (error) {
    console.error('Failed to archive feedback:', error);
    return { success: false, error: 'Failed to archive feedback' };
  }
}

export async function deleteFeedback(feedbackIds: string[]) {
  await requireAuth();
  
  try {
    await db
      .delete(feedbackTable)
      .where(inArray(feedbackTable.id, feedbackIds));
    
    revalidatePath('/[locale]/admin/messages', 'page');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete feedback:', error);
    return { success: false, error: 'Failed to delete feedback' };
  }
}