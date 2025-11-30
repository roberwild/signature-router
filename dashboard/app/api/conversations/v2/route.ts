import { NextRequest, NextResponse } from 'next/server';
import { db, conversations,  eq, desc, and } from '@workspace/database';
import { auth } from '@workspace/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organizationId from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const userConversations = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.userId, session.user?.id || ''),
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
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      sessionId,
      organizationId 
    } = body;
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const [newConversation] = await db
      .insert(conversations)
      .values({
        userId: session.user?.id || '',
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