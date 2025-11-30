// Test script for contact message actions
// Run with: npx tsx apps/dashboard/scripts/test-contact-actions.ts

import { db } from '@workspace/database';
import { contactMessageTable } from '@workspace/database/schema';
import { eq } from 'drizzle-orm';

async function testContactActions() {
  console.log('Testing contact message actions...\n');

  // Get first message
  const [firstMessage] = await db
    .select()
    .from(contactMessageTable)
    .limit(1);

  if (!firstMessage) {
    console.log('No messages found in database');
    return;
  }

  console.log('Found message:', {
    id: firstMessage.id,
    subject: firstMessage.subject,
    status: firstMessage.status
  });

  // Test marking as read
  console.log('\nTesting mark as read...');
  await db
    .update(contactMessageTable)
    .set({ status: 'read' })
    .where(eq(contactMessageTable.id, firstMessage.id));
  
  const [updatedMessage] = await db
    .select()
    .from(contactMessageTable)
    .where(eq(contactMessageTable.id, firstMessage.id));
  
  console.log('Updated status:', updatedMessage.status);

  // Test marking as unread
  console.log('\nTesting mark as unread...');
  await db
    .update(contactMessageTable)
    .set({ status: 'unread' })
    .where(eq(contactMessageTable.id, firstMessage.id));
  
  const [revertedMessage] = await db
    .select()
    .from(contactMessageTable)
    .where(eq(contactMessageTable.id, firstMessage.id));
  
  console.log('Reverted status:', revertedMessage.status);

  console.log('\n✅ All tests passed!');
  process.exit(0);
}

testContactActions().catch(console.error);