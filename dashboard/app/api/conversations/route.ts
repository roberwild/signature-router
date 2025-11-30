import { NextRequest, NextResponse } from 'next/server';
import { db, conversations,  eq, desc, and } from '@workspace/database';
import { auth } from '@workspace/auth';

export async function GET(request: NextRequest) {
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

    const userConversations = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.userId, userId),
          eq(conversations.organizationId, organizationId),
          eq(conversations.isArchived, false)
        )
      )
      .orderBy(desc(conversations.updatedAt));

    return NextResponse.json(userConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    
    const { title, sessionId } = await request.json();

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
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}