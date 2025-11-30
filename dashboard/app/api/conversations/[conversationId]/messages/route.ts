import { NextRequest, NextResponse } from 'next/server';
import { db, conversations, conversationMessages, eq, and, sql } from '@workspace/database';
import { auth } from '@workspace/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = request.headers.get('x-organization-id');
    const userId = request.headers.get('x-user-id') || session.user?.id || '';
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }
    const { role, content, metadata } = await request.json();

    // Verify the conversation belongs to the user
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, params.conversationId),
          eq(conversations.userId, userId),
          eq(conversations.organizationId, organizationId)
        )
      );

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Insert the new message
    const [newMessage] = await db
      .insert(conversationMessages)
      .values({
        conversationId: params.conversationId,
        role,
        content,
        metadata
      })
      .returning();

    // Update conversation's last message timestamp
    await db
      .update(conversations)
      .set({
        lastMessageAt: sql`now()`,
        updatedAt: sql`now()`
      })
      .where(eq(conversations.id, params.conversationId));

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    );
  }
}