import { NextRequest, NextResponse } from 'next/server';
import { db, conversations, eq, desc, and } from '@workspace/database';
import { auth } from '@workspace/auth';

// Interface for error handling
interface ConversationError extends Error {
  name: string;
  message: string;
}

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user?.id || '';
    
    // For now, just get all conversations for the user
    // We can filter by organization later if needed
    const userConversations = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.userId, userId),
          eq(conversations.isArchived, false)
        )
      )
      .orderBy(desc(conversations.updatedAt));

    return NextResponse.json(userConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    const typedError = error as ConversationError;
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: typedError.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user?.id || '';
    const { title, sessionId, organizationId } = await request.json();
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const [newConversation] = await db
      .insert(conversations)
      .values({
        userId,
        organizationId,
        title: title || 'Nueva conversación',
        sessionId,
        isActive: true,
        isArchived: false
      })
      .returning();

    return NextResponse.json(newConversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    const typedError = error as ConversationError;
    return NextResponse.json(
      { error: 'Failed to create conversation', details: typedError.message },
      { status: 500 }
    );
  }
}