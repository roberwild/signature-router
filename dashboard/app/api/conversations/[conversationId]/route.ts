import { NextRequest, NextResponse } from 'next/server';
import { db, conversations, conversationMessages, eq,  and, sql } from '@workspace/database';
import { auth } from '@workspace/auth';

export async function GET(
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

    const messages = await db
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, params.conversationId))
      .orderBy(conversationMessages.createdAt);

    return NextResponse.json({ conversation, messages });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const updates = await request.json();

    const [updatedConversation] = await db
      .update(conversations)
      .set({
        ...updates,
        updatedAt: sql`now()`
      })
      .where(
        and(
          eq(conversations.id, params.conversationId),
          eq(conversations.userId, userId),
          eq(conversations.organizationId, organizationId)
        )
      )
      .returning();

    if (!updatedConversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json(updatedConversation);
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const [archivedConversation] = await db
      .update(conversations)
      .set({
        isArchived: true,
        updatedAt: sql`now()`
      })
      .where(
        and(
          eq(conversations.id, params.conversationId),
          eq(conversations.userId, userId),
          eq(conversations.organizationId, organizationId)
        )
      )
      .returning();

    if (!archivedConversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Conversation archived' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}