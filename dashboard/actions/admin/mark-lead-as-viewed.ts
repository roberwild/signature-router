'use server';

import { revalidatePath } from 'next/cache';
import { markLeadAsViewed, markAllLeadsAsViewed } from '~/data/admin/lead-views';

export async function markLeadAsViewedAction(leadId: string, userId: string) {
  try {
    await markLeadAsViewed(leadId, userId);
    
    // Revalidate the leads pages to update the UI
    revalidatePath('/admin/leads');
    revalidatePath(`/admin/leads/${leadId}`);
    revalidatePath('/es/admin/leads');
    revalidatePath(`/es/admin/leads/${leadId}`);
    revalidatePath('/en/admin/leads');
    revalidatePath(`/en/admin/leads/${leadId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error marking lead as viewed:', error);
    return { success: false, error: 'Failed to mark lead as viewed' };
  }
}

export async function markAllLeadsAsViewedAction(userId: string) {
  try {
    const count = await markAllLeadsAsViewed(userId);
    
    // Revalidate the leads pages to update the UI
    revalidatePath('/admin/leads');
    revalidatePath('/es/admin/leads');
    revalidatePath('/en/admin/leads');
    
    return { success: true, count };
  } catch (error) {
    console.error('Error marking all leads as viewed:', error);
    return { success: false, error: 'Failed to mark all leads as viewed' };
  }
}